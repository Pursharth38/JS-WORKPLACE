// DEV B — P10-06. GET /api/admin/learners/:id — one learner's progress detail.
import type { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { getCourseProgress } from '@/lib/progress'
import { apiError, apiResponse } from '@/lib/response'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin()
    if (!admin) return apiResponse(403, 'Forbidden')

    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      // Explicit select — passwordHash must never ride along, even to an admin.
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        nameLocked: true,
        createdAt: true,
      },
    })
    if (!user) return apiResponse(404, 'Learner not found')

    const [enrollments, attempts, certificates] = await Promise.all([
      db.enrollment.findMany({
        where: { userId: id },
        select: {
          courseId: true,
          enrolledAt: true,
          completedAt: true,
          course: { select: { title: true, slug: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      db.assessmentAttempt.findMany({
        where: { userId: id },
        select: {
          id: true,
          chapterId: true,
          courseId: true,
          scorePercent: true,
          passed: true,
          startedAt: true,
          submittedAt: true,
          // NOTE: `answers` is deliberately not selected. It is grading detail,
          // not progress detail, and has no admin use case.
        },
        orderBy: { startedAt: 'desc' },
        take: 50,
      }),
      db.certificate.findMany({
        where: { userId: id },
        select: { certId: true, courseId: true, issuedAt: true, revokedAt: true },
        orderBy: { issuedAt: 'desc' },
      }),
    ])

    // Progress numbers come from Dev C's contract — same source the learner's
    // own dashboard uses, so admin and learner can never disagree.
    const progress = await Promise.all(
      enrollments.map(async (e) => ({
        courseId: e.courseId,
        courseTitle: e.course.title,
        courseSlug: e.course.slug,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        ...(await getCourseProgress(id, e.courseId)),
      })),
    )

    return apiResponse(200, 'OK', { learner: user, progress, attempts, certificates })
  } catch (err) {
    return apiError('admin/learners', err)
  }
}
