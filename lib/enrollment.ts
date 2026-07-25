// ─────────────────────────────────────────────────────────────────────────────
// DEV B — ★ H4 CONTRACT, published to Dev C in Week 4. ★
//
// CONTRACTS.md:
//   isEnrolled(userId: string, courseId: string): Promise<boolean>
//
// Read-only. There is deliberately NO `enrol()` export in this file: an
// Enrollment row is created in exactly one place, /api/webhooks/razorpay, after
// HMAC verification. If a future change needs to create one somewhere else,
// that is a design conversation, not a helper function.
// ─────────────────────────────────────────────────────────────────────────────
import { db } from '@/lib/db'

/**
 * Whether the learner has a paid enrolment in the course.
 *
 * Note this does NOT consider `isFreePreview`. Preview access is a per-MODULE
 * property and is Dev C's concern inside `computeUnlockState` — folding it in
 * here would make "enrolled" mean two different things at two call sites.
 */
export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  if (!userId || !courseId) return false

  const found = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  return found !== null
}

/** Same check by course slug, for page routes that only have the slug in the URL. */
export async function isEnrolledBySlug(userId: string, courseSlug: string): Promise<boolean> {
  if (!userId || !courseSlug) return false

  const found = await db.enrollment.findFirst({
    where: { userId, course: { slug: courseSlug } },
    select: { id: true },
  })
  return found !== null
}

export type EnrollmentSummary = {
  courseId: string
  courseSlug: string
  courseTitle: string
  enrolledAt: Date
  completedAt: Date | null
}

/** Every course the learner has paid for, newest first. Used by the dashboard. */
export async function listEnrollments(userId: string): Promise<EnrollmentSummary[]> {
  const rows = await db.enrollment.findMany({
    where: { userId },
    select: {
      courseId: true,
      enrolledAt: true,
      completedAt: true,
      course: { select: { slug: true, title: true } },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  return rows.map((r) => ({
    courseId: r.courseId,
    courseSlug: r.course.slug,
    courseTitle: r.course.title,
    enrolledAt: r.enrolledAt,
    completedAt: r.completedAt,
  }))
}
