// DEV B — GET /api/dashboard/summary, per CONTRACTS.md.
//
// Progress numbers come from Dev C's `getCourseProgress()`. Dev B does NOT
// recompute them — two implementations of "how far along am I" will disagree,
// and the one shown next to a certificate button is the one that matters.
import { listEnrollments } from '@/lib/enrollment'
import { getCourseProgress } from '@/lib/progress'
import { apiError, apiResponse } from '@/lib/response'
import { requireSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireSession()
    if (!session) return apiResponse(401, 'Sign in required')

    const enrollments = await listEnrollments(session.userId)

    const items = await Promise.all(
      enrollments.map(async (e) => {
        const progress = await getCourseProgress(session.userId, e.courseId)
        return {
          courseId: e.courseId,
          title: e.courseTitle,
          slug: e.courseSlug,
          percentComplete: progress.percentComplete,
          currentModuleId: progress.currentModuleId,
          finalTestPassed: progress.finalTestPassed,
        }
      }),
    )

    return apiResponse(200, 'OK', { enrollments: items })
  } catch (err) {
    return apiError('dashboard/summary', err)
  }
}
