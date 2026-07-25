// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-04. PUBLIC certificate verification page.
//
// Lives in the (marketing) group so Dev A's header/footer wrap it on merge.
// Excluded from the auth middleware matcher on purpose: the person verifying is
// an employer or HR reviewer with no account.
//
// Reads the database directly (same process) rather than fetching its own API
// route — one hop fewer, same data, and the API stays for programmatic checks
// and the QR code path.
// ─────────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Link from 'next/link'

import { VerifyResult, type VerifyOutcome } from '@/components/marketing/verify-result'
import { normalizeCertId } from '@/lib/cert-id'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Verify a certificate',
  description:
    'Check the authenticity of a Certificate of Completion issued by JS Workplace Wellness.',
  // Individual verification results should not be indexed — they carry names.
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certId: string }>
}) {
  const { certId: raw } = await params
  const displayId = decodeURIComponent(raw)
  const certId = normalizeCertId(displayId)

  let outcome: VerifyOutcome = { kind: 'not_found' }

  if (certId) {
    const cert = await db.certificate.findUnique({
      where: { certId },
      select: { learnerName: true, courseId: true, issuedAt: true, revokedAt: true },
    })

    if (cert) {
      const course = await db.course.findUnique({
        where: { id: cert.courseId },
        select: { title: true },
      })
      const common = {
        learnerName: cert.learnerName,
        courseTitle: course?.title ?? 'POSH Awareness Training',
        issuedAt: cert.issuedAt,
      }
      outcome = cert.revokedAt ? { kind: 'revoked', ...common } : { kind: 'valid', ...common }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <p className="text-[14px] uppercase tracking-wide text-[var(--brand-muted)]">
        Certificate verification
      </p>
      <h1 className="mt-1 mb-8 text-[30px]">
        JS Workplace Wellness certificate check
      </h1>

      <VerifyResult outcome={outcome} certId={certId ?? displayId} />

      <p className="mt-8 text-[15px] leading-relaxed text-[var(--brand-muted)]">
        Every Certificate of Completion we issue carries a unique ID and a QR code that
        links to this page. If you have questions about a result,{' '}
        <Link href="/contact" className="text-[var(--brand-primary)] underline">
          contact us
        </Link>
        .
      </p>
    </div>
  )
}
