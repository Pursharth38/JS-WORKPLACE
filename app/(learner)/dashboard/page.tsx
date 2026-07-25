// DEV B — P7-07. Learner dashboard.
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PaymentPendingBanner } from '@/components/commerce/payment-pending-banner'
import { db } from '@/lib/db'
import { listEnrollments } from '@/lib/enrollment'
import { getCourseProgress } from '@/lib/progress'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Dashboard' }
// Reads live enrolment and progress state — must never be cached.
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; course?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login?redirectTo=/dashboard')

  const { payment, course } = await searchParams

  const [user, enrollments] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      // Note what is NOT selected: passwordHash. Never widen this to `include`.
      select: { name: true, emailVerified: true, nameLocked: true },
    }),
    listEnrollments(session.userId),
  ])

  // Progress is Dev C's number, read through the agreed contract.
  const withProgress = await Promise.all(
    enrollments.map(async (e) => ({
      ...e,
      progress: await getCourseProgress(session.userId, e.courseId),
    })),
  )

  const showPending =
    payment === 'processing' &&
    !!course &&
    !enrollments.some((e) => e.courseSlug === course)

  return (
    <div>
      <h1 className="mb-1 text-[30px]">Welcome back, {user?.name?.split(' ')[0] ?? 'there'}</h1>
      <p className="mb-8 text-[16px] text-[var(--brand-muted)]">
        Your courses, progress, and certificates.
      </p>

      {showPending && course && <PaymentPendingBanner courseSlug={course} />}

      {user && !user.emailVerified && (
        <div className="mb-8 rounded-lg border border-[var(--brand-amber)] bg-white p-5">
          <p className="text-[16px] font-semibold">Confirm your email address</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--brand-muted)]">
            We still need to confirm your email before we can issue a certificate in your
            name.{' '}
            <Link href="/verify-email" className="text-[var(--brand-teal)] underline">
              Send a new confirmation link
            </Link>
            .
          </p>
        </div>
      )}

      {withProgress.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-4">
          {withProgress.map((e) => (
            <li
              key={e.courseId}
              className="rounded-lg border border-[var(--brand-line)] bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[20px]">{e.courseTitle}</h2>
                  <p className="mt-1 text-[14px] text-[var(--brand-muted)]">
                    Enrolled {e.enrolledAt.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <Link
                  href={`/learn/${e.courseSlug}`}
                  className="shrink-0 rounded-md bg-[var(--brand-teal)] px-5 py-2.5 text-[16px] font-semibold text-white hover:bg-[var(--brand-teal-hover)]"
                >
                  {e.progress.percentComplete > 0 ? 'Continue' : 'Start course'}
                </Link>
              </div>

              <ProgressBar percent={e.progress.percentComplete} />

              {e.progress.finalTestPassed && (
                <p className="mt-4 text-[15px]">
                  <Link
                    href="/dashboard/certificates"
                    className="font-medium text-[var(--brand-teal)] underline"
                  >
                    Your Certificate of Completion is ready
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="mt-5">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--brand-teal-tint)]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
      >
        <div
          className="h-full rounded-full bg-[var(--brand-teal)] transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1.5 text-[14px] text-[var(--brand-muted)]">{clamped}% complete</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--brand-line)] bg-white p-10 text-center">
      <h2 className="text-[20px]">You are not enrolled in a course yet</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-[16px] leading-relaxed text-[var(--brand-muted)]">
        Browse the POSH awareness course to see what it covers, or read the knowledge hub
        for free.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/courses"
          className="rounded-md bg-[var(--brand-teal)] px-5 py-3 text-[17px] font-semibold text-white hover:bg-[var(--brand-teal-hover)]"
        >
          Browse courses
        </Link>
        <Link
          href="/posh-act"
          className="rounded-md border border-[var(--brand-line)] px-5 py-3 text-[17px] font-medium hover:bg-[var(--brand-sand)]"
        >
          Read the POSH Act guide
        </Link>
      </div>
    </div>
  )
}
