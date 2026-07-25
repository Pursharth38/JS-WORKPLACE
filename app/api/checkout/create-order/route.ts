// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P7-01. Creates a Razorpay order.
//
// ★ THE PRICE COMES FROM THE DATABASE. NEVER FROM THE REQUEST BODY. ★
//
// This handler does NOT grant access to anything. It reserves an order and
// records an intent-to-pay. Enrolment is created only by the HMAC-verified
// webhook at /api/webhooks/razorpay.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { razorpayClient } from '@/lib/razorpay'
import { rateLimit } from '@/lib/ratelimit'
import { apiError, apiResponse, invalidInput } from '@/lib/response'
import { createOrderSchema } from '@/lib/schemas/checkout'
import { requireSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if (!session) return apiResponse(401, 'Sign in required')

    // CONTRACTS.md: 10 / hour / user. Each call creates a real Razorpay order
    // and a Payment row, so an unthrottled loop is both a data-quality problem
    // and a way to burn through Razorpay's API quota.
    const limit = await rateLimit.checkoutUser(session.userId)
    if (!limit.success) {
      return apiResponse(429, 'Too many checkout attempts. Please wait and try again.', null, {
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return invalidInput()
    }

    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return invalidInput()
    const { courseId } = parsed.data

    // ── The price authority. Read by id, from Postgres, every time. ──────────
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, slug: true, title: true, priceInPaise: true, isPublished: true },
    })

    // An unpublished course is treated as non-existent rather than 403. Saying
    // "this exists but is not for sale" tells a competitor what is in the
    // pipeline, and it gives no useful information to a legitimate buyer.
    if (!course || !course.isPublished) return apiResponse(404, 'Course not found')

    // A free course needs no payment rail at all, and Razorpay rejects a
    // zero-amount order. Guard explicitly rather than letting the SDK throw.
    if (course.priceInPaise <= 0) {
      return apiResponse(400, 'This course is not available for purchase')
    }

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.userId, courseId } },
      select: { id: true },
    })
    if (existing) return apiResponse(409, 'You are already enrolled in this course')

    // Reuse an outstanding unpaid order rather than minting a new one on every
    // click. Without this, a learner who abandons Razorpay's modal three times
    // leaves three orphan CREATED rows, and the admin payments table becomes
    // impossible to read.
    const pending = await db.payment.findFirst({
      where: {
        userId: session.userId,
        courseId,
        status: 'CREATED',
        amountInPaise: course.priceInPaise, // stale price ⇒ do not reuse
        createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) },
      },
      select: { razorpayOrderId: true },
      orderBy: { createdAt: 'desc' },
    })
    if (pending) {
      return apiResponse(200, 'Order created', {
        orderId: pending.razorpayOrderId,
        amount: course.priceInPaise,
        currency: 'INR',
        courseTitle: course.title,
      })
    }

    const order = await razorpayClient().orders.create({
      amount: course.priceInPaise, // ← from the DB, not the body
      currency: 'INR',
      receipt: `rcpt_${session.userId}_${courseId}`.slice(0, 40), // Razorpay caps receipt at 40 chars
      notes: { userId: session.userId, courseId },
    })

    await db.payment.create({
      data: {
        userId: session.userId,
        courseId,
        razorpayOrderId: order.id,
        amountInPaise: course.priceInPaise, // ← from the DB
        currency: 'INR',
        status: 'CREATED',
      },
    })

    return apiResponse(200, 'Order created', {
      orderId: order.id,
      amount: course.priceInPaise,
      currency: 'INR',
      courseTitle: course.title,
    })
  } catch (err) {
    return apiError('checkout/create-order', err)
  }
}
