// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-01/02. Certificate issuance.
// NODE RUNTIME ONLY (@react-pdf/renderer, qrcode).
// ─────────────────────────────────────────────────────────────────────────────
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import * as React from 'react'

import { CertificateDocument, type CertificateData } from '@/components/pdf/certificate-document'
import { certificateObjectKey, generateCertId } from '@/lib/cert-id'
import { db } from '@/lib/db'
import { isR2Configured, putObject } from '@/lib/r2'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export function verifyUrlFor(certId: string): string {
  return `${SITE}/verify/${certId}`
}

/**
 * ★ H5 CONTRACT — the eligibility read Dev B consumes from Dev C. ★
 *
 * CONTRACTS.md: `AssessmentAttempt WHERE courseId = ? AND chapterId IS NULL AND passed = true`.
 * `chapterId IS NULL` is what distinguishes the final test from a chapter
 * assessment. Dev B does NOT re-score anything here — grading lives in Dev C's
 * lib/grading.ts, and a second implementation would eventually disagree with it
 * about who has earned a credential.
 */
export async function hasPassedFinalTest(userId: string, courseId: string): Promise<boolean> {
  const attempt = await db.assessmentAttempt.findFirst({
    where: { userId, courseId, chapterId: null, passed: true },
    select: { id: true },
  })
  return attempt !== null
}

async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  const element = React.createElement(CertificateDocument, {
    data,
  }) as React.ReactElement<DocumentProps>
  return renderToBuffer(element)
}

/** QR encodes the public verification URL, so a printed certificate is checkable. */
async function qrFor(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#0F5257', light: '#FBF9F5' },
  })
}

export async function buildCertificatePdf(args: {
  certId: string
  learnerName: string
  courseTitle: string
  issuedAt: Date
}): Promise<Buffer> {
  const verifyUrl = verifyUrlFor(args.certId)
  return renderCertificatePdf({
    certId: args.certId,
    learnerName: args.learnerName,
    courseTitle: args.courseTitle,
    issuedAt: args.issuedAt,
    verifyUrl,
    qrDataUrl: await qrFor(verifyUrl),
  })
}

export type IssueResult =
  | { ok: true; certId: string; alreadyIssued: boolean }
  | { ok: false; reason: 'not_enrolled' | 'not_passed' | 'course_missing' | 'id_exhausted' }

/**
 * Issues a certificate, or returns the existing one.
 *
 * ★ IDEMPOTENCY IS ENFORCED IN TWO PLACES AND BOTH ARE NECESSARY. ★
 *
 *   1. The read below returns an existing active certificate immediately. This
 *      handles the ordinary case — a learner clicking twice — without work.
 *   2. The partial unique index `cert_active_unique` on
 *      (userId, courseId) WHERE revokedAt IS NULL turns a genuine race into a
 *      P2002 that we catch and resolve into the winner's certId.
 *
 * With only (1), two concurrent requests both read "no certificate", both
 * insert, and the learner ends up with two credentials bearing different ids —
 * which is exactly the kind of thing that makes a verification page worthless.
 */
export async function issueCertificate(userId: string, courseId: string): Promise<IssueResult> {
  // (1) Fast path.
  const existing = await db.certificate.findFirst({
    where: { userId, courseId, revokedAt: null },
    select: { certId: true },
  })
  if (existing) return { ok: true, certId: existing.certId, alreadyIssued: true }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  if (!enrollment) return { ok: false, reason: 'not_enrolled' }

  if (!(await hasPassedFinalTest(userId, courseId))) return { ok: false, reason: 'not_passed' }

  const [user, course] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
  ])
  if (!user || !course) return { ok: false, reason: 'course_missing' }

  const certId = await reserveUniqueCertId()
  if (!certId) return { ok: false, reason: 'id_exhausted' }

  const issuedAt = new Date()
  const pdfKey = certificateObjectKey(certId)

  // The row is written BEFORE the PDF is rendered. Insertion is what resolves a
  // race — losing it costs one wasted id, whereas rendering first would mean
  // both racers do 300ms of PDF work before discovering one of them must throw
  // it away. The key is deterministic from certId, so it is known in advance.
  try {
    await db.$transaction(async (tx) => {
      await tx.certificate.create({
        data: {
          certId,
          userId,
          courseId,
          learnerName: user.name, // snapshot — NOT a live join
          issuedAt,
          pdfUrl: pdfKey,
        },
      })

      // The name on the certificate is now a matter of record.
      await tx.user.update({ where: { id: userId }, data: { nameLocked: true } })
    })
  } catch (err) {
    // (2) Lost the race against the partial unique index. The other request
    // issued the certificate; return its id rather than surfacing an error to a
    // learner who has done nothing wrong.
    if (isUniqueViolation(err)) {
      const winner = await db.certificate.findFirst({
        where: { userId, courseId, revokedAt: null },
        select: { certId: true },
      })
      if (winner) return { ok: true, certId: winner.certId, alreadyIssued: true }
    }
    throw err
  }

  // Archiving is best-effort, exactly as for invoices. The PDF is fully
  // determined by the row, so a failed upload is recoverable by re-rendering —
  // it is not a reason to fail an issuance the learner has earned.
  if (isR2Configured()) {
    try {
      const pdf = await buildCertificatePdf({
        certId,
        learnerName: user.name,
        courseTitle: course.title,
        issuedAt,
      })
      await putObject({ key: pdfKey, body: pdf, contentType: 'application/pdf' })
    } catch (err) {
      console.error('[certificate] R2 upload failed; certificate is still valid', {
        certId,
        err,
      })
    }
  }

  return { ok: true, certId, alreadyIssued: false }
}

/**
 * Finds an id not already in the certificates table.
 *
 * 32^6 ≈ 1.07 billion, so at this course's volume a collision is essentially
 * never. The loop exists because "essentially never" is not "never", and a
 * silent collision would mean two learners sharing one verification record.
 */
async function reserveUniqueCertId(attempts = 5): Promise<string | null> {
  for (let i = 0; i < attempts; i += 1) {
    const candidate = generateCertId()
    const clash = await db.certificate.findUnique({
      where: { certId: candidate },
      select: { id: true },
    })
    if (!clash) return candidate
  }
  console.error('[certificate] could not find a free certId after %d attempts', attempts)
  return null
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  )
}
