// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P7-03. Razorpay webhook.
//
// ★★★ THIS IS THE ONLY PLACE AN `Enrollment` IS EVER CREATED. ★★★
//
// Public endpoint — no session. Its ONLY authentication is the HMAC over the
// raw body. Everything below the signature check assumes Razorpay sent it;
// everything above it assumes an attacker did.
//
// Razorpay retries a webhook until it gets a 2xx, and will happily deliver the
// same event several times. Every branch here must therefore be safe to run
// twice. That is why the handler returns 200 for "already processed" — a 4xx
// would make Razorpay retry forever.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { sendReceiptEmail } from '@/lib/email'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { apiError, apiResponse } from '@/lib/response'

export const runtime = 'nodejs'
// Never cache or statically optimise a webhook.
export const dynamic = 'force-dynamic'

type RazorpayEvent = {
  event?: string
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } }
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number } }
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. RAW body. Must be read with .text(), never .json(). ───────────────
    // req.json() parses and discards the original bytes. Re-stringifying
    // produces different key order / whitespace / unicode escaping, and the
    // HMAC would never match what Razorpay signed.
    const raw = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // ── 2. Verify BEFORE parsing, before touching the database. ──────────────
    if (!verifyWebhookSignature(raw, signature)) {
      console.warn('[webhook:razorpay] signature verification failed')
      return apiResponse(400, 'Invalid signature')
    }

    let event: RazorpayEvent
    try {
      event = JSON.parse(raw) as RazorpayEvent
    } catch {
      return apiResponse(400, 'Invalid payload')
    }

    switch (event.event) {
      case 'payment.captured':
        return await handlePaymentCaptured(event)
      case 'payment.failed':
        return await handlePaymentFailed(event)
      case 'refund.processed':
        return await handleRefundProcessed(event)
      default:
        // Razorpay sends many event types. Acknowledge so it stops retrying.
        return apiResponse(200, 'Ignored')
    }
  } catch (err) {
    // A 500 makes Razorpay retry, which is the behaviour we want for a
    // transient database blip — the event is not lost.
    return apiError('webhooks/razorpay', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function handlePaymentCaptured(event: RazorpayEvent) {
  const entity = event.payload?.payment?.entity
  const orderId = entity?.order_id
  const paymentId = entity?.id
  const capturedAmount = entity?.amount

  if (!orderId || !paymentId) return apiResponse(200, 'Ignored')

  const payment = await db.payment.findUnique({
    where: { razorpayOrderId: orderId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      amountInPaise: true,
      status: true,
      invoiceUrl: true,
    },
  })

  // An order we never created. Could be a different integration on the same
  // Razorpay account. Acknowledge — retrying will not make it exist.
  if (!payment) {
    console.warn('[webhook:razorpay] captured payment for unknown order', { orderId })
    return apiResponse(200, 'Unknown order')
  }

  // ── REPLAY GUARD ─────────────────────────────────────────────────────────
  // Razorpay redelivers on any non-2xx, and an attacker who captures a valid
  // signed body can POST it back verbatim — the signature stays valid forever.
  // Both cases land here and stop.
  if (payment.status === 'PAID') {
    return apiResponse(200, 'Already processed')
  }

  // ── AMOUNT GUARD ─────────────────────────────────────────────────────────
  // The order was created server-side with the DB price, so a mismatch should
  // be impossible. If it happens anyway (partial capture, a manually created
  // order, a price edited mid-flight), do NOT enrol — record it and surface it
  // for a human. Silently granting access on an underpayment is exactly the
  // failure this whole webhook exists to prevent.
  if (typeof capturedAmount === 'number' && capturedAmount !== payment.amountInPaise) {
    console.error('[webhook:razorpay] CAPTURED AMOUNT MISMATCH — enrolment withheld', {
      orderId,
      paymentId,
      expected: payment.amountInPaise,
      captured: capturedAmount,
    })
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', razorpayPaymentId: paymentId },
    })
    return apiResponse(200, 'Amount mismatch recorded')
  }

  // ── THE TRANSACTION ──────────────────────────────────────────────────────
  // Marking the payment PAID and creating the enrolment must be atomic. If the
  // enrolment write failed after the payment was marked PAID, the replay guard
  // above would short-circuit every retry and the learner would have paid for
  // access they never receive.
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', razorpayPaymentId: paymentId },
    })

    // upsert, not create: a concurrent duplicate delivery that got past the
    // status check is absorbed by the (userId, courseId) unique constraint
    // rather than throwing.
    await tx.enrollment.upsert({
      where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
      create: {
        userId: payment.userId,
        courseId: payment.courseId,
        paymentId: payment.id,
      },
      update: {},
    })
  })

  // Receipt is fire-and-forget and deliberately OUTSIDE the transaction. A
  // Resend outage must never roll back an enrolment the learner has paid for.
  void sendReceipt(payment.userId, payment.courseId, payment.amountInPaise, paymentId, payment.invoiceUrl)

  return apiResponse(200, 'OK')
}

async function handlePaymentFailed(event: RazorpayEvent) {
  const orderId = event.payload?.payment?.entity?.order_id
  const paymentId = event.payload?.payment?.entity?.id
  if (!orderId) return apiResponse(200, 'Ignored')

  // Guarded on `status: 'CREATED'` so a late-arriving `payment.failed` for an
  // order that was subsequently captured cannot downgrade a paid enrolment.
  // Razorpay does not guarantee event ordering.
  const updated = await db.payment.updateMany({
    where: { razorpayOrderId: orderId, status: 'CREATED' },
    data: { status: 'FAILED', ...(paymentId ? { razorpayPaymentId: paymentId } : {}) },
  })

  return apiResponse(200, updated.count > 0 ? 'Marked failed' : 'Ignored')
}

async function handleRefundProcessed(event: RazorpayEvent) {
  const paymentId = event.payload?.refund?.entity?.payment_id
  if (!paymentId) return apiResponse(200, 'Ignored')

  const updated = await db.payment.updateMany({
    where: { razorpayPaymentId: paymentId, status: 'PAID' },
    data: { status: 'REFUNDED' },
  })

  // ── DELIBERATE DECISION: a refund does NOT auto-revoke the enrolment. ─────
  // Refunds on Razorpay are initiated by hand, so a person is always in the
  // loop, and they may be partial or a goodwill gesture on a course the learner
  // should keep. Auto-revoking would also strand an already-issued certificate
  // in an inconsistent state.
  //
  // Instead: the payment reads REFUNDED, the admin payments view surfaces it,
  // and revocation is an explicit admin action (see /admin, P10-06).
  // CONFIRM THIS WITH THE CLIENT before launch — if she wants access pulled
  // automatically, it is a delete on Enrollment plus a Certificate revoke here.
  if (updated.count > 0) {
    console.warn('[webhook:razorpay] payment refunded — enrolment left intact for admin review', {
      paymentId,
    })
  }

  return apiResponse(200, updated.count > 0 ? 'Marked refunded' : 'Ignored')
}

/** Best-effort receipt. Every failure is swallowed and logged. */
async function sendReceipt(
  userId: string,
  courseId: string,
  amountInPaise: number,
  razorpayPaymentId: string,
  invoiceUrl: string | null,
): Promise<void> {
  try {
    const [user, course] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      db.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true } }),
    ])
    if (!user || !course) return

    await sendReceiptEmail({
      to: user.email,
      name: user.name,
      courseTitle: course.title,
      courseSlug: course.slug,
      amountInPaise,
      razorpayPaymentId,
      paidAt: new Date(),
      invoiceUrl,
    })
  } catch (err) {
    console.error('[webhook:razorpay] receipt email failed', err)
  }
}
