// ─────────────────────────────────────────────────────────────────────────────
// DEV B — Razorpay client and signature verification.
// NODE RUNTIME ONLY (uses `crypto`).
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto'
import Razorpay from 'razorpay'

let client: Razorpay | null = null

/**
 * Lazily constructed. The Razorpay constructor throws when `key_id` is absent,
 * and building it at module scope would crash any import of this file in an
 * environment without keys — including `next build` and the test runner.
 */
export function razorpayClient(): Razorpay {
  if (client) return client

  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Razorpay is not configured: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing')
  }

  client = new Razorpay({ key_id, key_secret })
  return client
}

/**
 * Constant-time comparison of two hex digests.
 *
 * `crypto.timingSafeEqual` throws on a length mismatch, so the length is
 * compared first — and that comparison is safe to short-circuit because the
 * length of a sha256 hex digest is fixed and public.
 *
 * Using `===` here would leak the expected signature one byte at a time: an
 * attacker measures which candidate first byte takes marginally longer to
 * reject, fixes it, and moves to the next. That is a practical attack over a
 * few thousand requests, and it would let anyone forge a `payment.captured`
 * webhook and enrol themselves for free.
 */
function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verifies the `X-Razorpay-Signature` header against the RAW request body.
 *
 * The caller MUST pass the exact bytes Razorpay sent — read with `req.text()`.
 * Calling `req.json()` first and re-stringifying produces different bytes (key
 * order, whitespace, unicode escaping) and the HMAC will never match.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    // Fail CLOSED. Unlike rate limiting, this IS the authorization control for
    // the endpoint that creates enrolments. A missing secret must reject every
    // request, never accept them.
    console.error('[razorpay] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook')
    return false
  }
  if (!signature) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return timingSafeCompare(signature, expected)
}

/**
 * Verifies the signature Razorpay Checkout hands the browser on success.
 *
 * NOTE: this is used only to decide what to show the user. It is NOT what
 * grants access — enrolment comes exclusively from the webhook. The client
 * controls this entire code path, so its result is advisory.
 */
export function verifyPaymentSignature(args: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest('hex')

  return timingSafeCompare(args.signature, expected)
}
