// DEV B — P10-06. GET /api/admin/enrollments — paginated, ADMIN only.
import type { NextRequest } from 'next/server'

import { parsePagination } from '@/lib/admin-query'
import { db } from '@/lib/db'
import { apiError, apiResponse, paginated } from '@/lib/response'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // requireAdmin re-reads the role from the database — a demoted admin's
    // 30-day JWT does not keep this door open.
    const admin = await requireAdmin()
    if (!admin) return apiResponse(403, 'Forbidden')

    const { page, limit, skip } = parsePagination(new URL(req.url))

    const [total, rows] = await Promise.all([
      db.enrollment.count(),
      db.enrollment.findMany({
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          enrolledAt: true,
          completedAt: true,
          // Name and email only — never the full user row.
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      }),
    ])

    const items = rows.map((r) => ({
      id: r.id,
      enrolledAt: r.enrolledAt,
      completedAt: r.completedAt,
      learner: r.user,
      course: r.course,
    }))

    return apiResponse(200, 'OK', paginated(items, page, limit, total))
  } catch (err) {
    return apiError('admin/enrollments', err)
  }
}
