// DEV B — P10-05. The learner's certificates.
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CertificateCard } from '@/components/learn/certificate-card'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Certificates' }
export const dynamic = 'force-dynamic'

export default async function CertificatesPage() {
  const session = await getSession()
  if (!session) redirect('/login?redirectTo=/dashboard/certificates')

  // Scoped to the caller. Revoked certificates are shown (with their status)
  // rather than hidden — silently disappearing a credential someone may have
  // already shared invites a support ticket with no context.
  const certs = await db.certificate.findMany({
    where: { userId: session.userId },
    select: {
      certId: true,
      courseId: true,
      learnerName: true,
      issuedAt: true,
      revokedAt: true,
    },
    orderBy: { issuedAt: 'desc' },
  })

  const courseIds = [...new Set(certs.map((c) => c.courseId))]
  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  })
  const titleById = new Map(courses.map((c) => [c.id, c.title]))

  return (
    <div>
      <h1 className="mb-1 text-[30px]">Certificates</h1>
      <p className="mb-8 text-[16px] text-[var(--brand-muted)]">
        Download your Certificate of Completion or share its public verification link.
      </p>

      {certs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--brand-line)] bg-white p-10 text-center">
          <h2 className="text-[20px]">No certificates yet</h2>
          <p className="mx-auto mt-2 max-w-[48ch] text-[16px] leading-relaxed text-[var(--brand-muted)]">
            Complete all modules, pass each chapter assessment, and pass the final test to
            earn your Certificate of Completion.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-md bg-[var(--brand-primary)] px-5 py-3 text-[17px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
          >
            Back to your courses
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4">
          {certs.map((c) => (
            <li key={c.certId}>
              <CertificateCard
                certId={c.certId}
                courseTitle={titleById.get(c.courseId) ?? 'POSH Awareness Training'}
                learnerName={c.learnerName}
                issuedAt={c.issuedAt}
                revoked={c.revokedAt !== null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
