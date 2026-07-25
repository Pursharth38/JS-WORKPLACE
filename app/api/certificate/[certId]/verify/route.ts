// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-04. PUBLIC certificate verification API.
//
// No auth — an employer checking a candidate's credential has no account here.
//
// ★ AN UNKNOWN certId RETURNS `valid: false` WITH HTTP 200 — NEVER 404. ★
// A status-code difference between "exists" and "does not exist" lets a script
// enumerate the certificate space by watching codes alone. Everyone gets 200
// and a body; the body says whether the credential is real.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from 'next/server'

import { normalizeCertId } from '@/lib/cert-id'
import { db } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/ratelimit'
import { apiError, apiResponse } from '@/lib/response'

export const runtime = 'nodejs'

type VerifyPayload = {
  valid: boolean
  learnerName: string | null
  courseTitle: string | null
  issuedAt: string | null
  revoked: boolean
}

const NOT_FOUND: VerifyPayload = {
  valid: false,
  learnerName: null,
  courseTitle: null,
  issuedAt: null,
  revoked: false,
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certId: string }> },
) {
  try {
    // Rate-limited by IP: random ids are unguessable (32^6), but there is no
    // reason to let anyone try a million of them for free.
    const limit = await rateLimit.verifyIp(clientIp(req.headers))
    if (!limit.success) {
      return apiResponse(429, 'Too many verification requests. Please wait.', null, {
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      })
    }

    const { certId: raw } = await params
    const certId = normalizeCertId(raw)
    // Malformed input short-circuits without a DB read — same body as unknown.
    if (!certId) return apiResponse<VerifyPayload>(200, 'Verification result', NOT_FOUND)

    const cert = await db.certificate.findUnique({
      where: { certId },
      select: {
        learnerName: true,
        courseId: true,
        issuedAt: true,
        revokedAt: true,
        // NOTE: no userId, no pdfUrl. The public payload carries exactly what
        // CONTRACTS.md lists and nothing more.
      },
    })

    if (!cert) return apiResponse<VerifyPayload>(200, 'Verification result', NOT_FOUND)

    const course = await db.course.findUnique({
      where: { id: cert.courseId },
      select: { title: true },
    })

    const revoked = cert.revokedAt !== null

    return apiResponse<VerifyPayload>(200, 'Verification result', {
      // A revoked certificate is NOT valid — but it is reported as revoked
      // rather than unknown, because "this was withdrawn" and "this was never
      // issued" mean very different things to an employer holding a printout.
      valid: !revoked,
      learnerName: cert.learnerName,
      courseTitle: course?.title ?? 'POSH Awareness Training',
      issuedAt: cert.issuedAt.toISOString(),
      revoked,
    })
  } catch (err) {
    return apiError('certificate/verify', err)
  }
}
