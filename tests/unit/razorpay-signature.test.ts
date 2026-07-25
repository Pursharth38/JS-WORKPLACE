// DEV B — the webhook's only authentication mechanism. If these fail, anyone
// can forge a `payment.captured` and enrol themselves for free.
import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyPaymentSignature, verifyWebhookSignature } from '@/lib/razorpay'

const SECRET = 'test_webhook_secret_value'
const BODY = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } })

function sign(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = SECRET
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts a signature produced with the shared secret', () => {
    expect(verifyWebhookSignature(BODY, sign(BODY, SECRET))).toBe(true)
  })

  it('rejects a signature made with the wrong secret', () => {
    expect(verifyWebhookSignature(BODY, sign(BODY, 'not_the_secret'))).toBe(false)
  })

  it('rejects when the body has been altered after signing', () => {
    const sig = sign(BODY, SECRET)
    const tampered = BODY.replace('pay_1', 'pay_2')
    expect(verifyWebhookSignature(tampered, sig)).toBe(false)
  })

  it('rejects a missing signature header', () => {
    expect(verifyWebhookSignature(BODY, null)).toBe(false)
  })

  it('rejects an empty signature', () => {
    expect(verifyWebhookSignature(BODY, '')).toBe(false)
  })

  it('rejects a truncated signature instead of throwing', () => {
    // timingSafeEqual throws on a length mismatch — the length pre-check must
    // absorb that, or a short signature becomes a 500 and Razorpay retries it
    // forever.
    const sig = sign(BODY, SECRET).slice(0, 20)
    expect(() => verifyWebhookSignature(BODY, sig)).not.toThrow()
    expect(verifyWebhookSignature(BODY, sig)).toBe(false)
  })

  it('rejects an over-long signature instead of throwing', () => {
    const sig = sign(BODY, SECRET) + 'deadbeef'
    expect(verifyWebhookSignature(BODY, sig)).toBe(false)
  })

  it('FAILS CLOSED when RAZORPAY_WEBHOOK_SECRET is not configured', () => {
    // The most dangerous possible misconfiguration: if an unset secret meant
    // "skip verification", a deploy that forgot the env var would let anyone
    // enrol for free. It must reject everything, including a valid signature.
    delete process.env.RAZORPAY_WEBHOOK_SECRET
    expect(verifyWebhookSignature(BODY, sign(BODY, SECRET))).toBe(false)
  })

  it('is byte-exact: whitespace differences invalidate the signature', () => {
    // This is why the handler must use req.text() and never req.json(). Parsing
    // and re-stringifying changes the bytes and breaks verification.
    const sig = sign(BODY, SECRET)
    const reserialized = JSON.stringify(JSON.parse(BODY), null, 2)
    expect(reserialized).not.toBe(BODY)
    expect(verifyWebhookSignature(reserialized, sig)).toBe(false)
  })
})

describe('verifyPaymentSignature (client-side checkout callback)', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = SECRET
  })

  it('accepts the documented orderId|paymentId construction', () => {
    const signature = crypto
      .createHmac('sha256', SECRET)
      .update('order_abc|pay_xyz')
      .digest('hex')

    expect(
      verifyPaymentSignature({ orderId: 'order_abc', paymentId: 'pay_xyz', signature }),
    ).toBe(true)
  })

  it('rejects a signature over swapped fields', () => {
    const signature = crypto
      .createHmac('sha256', SECRET)
      .update('pay_xyz|order_abc')
      .digest('hex')

    expect(
      verifyPaymentSignature({ orderId: 'order_abc', paymentId: 'pay_xyz', signature }),
    ).toBe(false)
  })
})
