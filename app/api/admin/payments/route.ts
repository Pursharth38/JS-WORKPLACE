// DEV B — P10-06. GET /api/admin/payments — paginated, ADMIN only.
// Optional ?status=CREATED|PAID|FAILED|REFUNDED filter, because the row an
// admin is actually hunting for is almost always a FAILED or REFUNDED one.
import type { NextRequest } from 'next/server'
import { PaymentStatus } from '@prisma/client'

import { parsePagination } from '@/lib/admin-query'
import { db } from '@/lib/db'
import { apiError, apiResponse, paginated } from '@/lib/response'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return apiResponse(403, 'Forbidden')

    const url = new URL(req.url)
    const { page, limit, skip } = parsePagination(url)

    const statusParam = url.searchParams.get('status')
    const status =
      statusParam && (Object.values(PaymentStatus) as string[]).includes(statusParam)
        ? (statusParam as PaymentStatus)
        : undefined
    const where = status ? { status } : {}

    const [total, rows] = await Promise.all([
      db.payment.count({ where }),
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amountInPaise: true,
          currency: true,
          status: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          invoiceNumber: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ])

    return apiResponse(200, 'OK', paginated(rows, page, limit, total))
  } catch (err) {
    return apiError('admin/payments', err)
  }
}
