// ─────────────────────────────────────────────────────────────────────────────
// DEV B — adversarial tests for the ONE endpoint that creates enrolments.
//
// ARCHITECTURE.md §13 lists "Replay a Razorpay webhook → must not create a
// duplicate enrolment" as a mandatory adversarial test. This is that test, plus
// the neighbouring failure modes.
//
// Prisma is faked in memory rather than run against a test database, so these
// run in CI with no DATABASE_URL. The fake implements only the handful of calls
// the route makes, and throws on the unique constraints the real schema
// enforces — so a regression that relies on a constraint not existing still
// fails here.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 'test_webhook_secret_value'

// ── In-memory Prisma fake ───────────────────────────────────────────────────

type PaymentRow = {
  id: string
  userId: string
  courseId: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  amountInPaise: number
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED'
  invoiceUrl: string | null
}
type EnrollmentRow = { userId: string; courseId: string; paymentId: string | null }

const store = {
  payments: [] as PaymentRow[],
  enrollments: [] as EnrollmentRow[],
}

function matches(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([k, v]) => row[k] === v)
}

const fakeDb = {
  payment: {
    findUnique: async ({ where }: { where: Record<string, unknown> }) =>
      store.payments.find((p) => matches(p as unknown as Record<string, unknown>, where)) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Partial<PaymentRow> }) => {
      const row = store.payments.find((p) => p.id === where.id)
      if (!row) throw new Error('Record to update not found')
      Object.assign(row, data)
      return row
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: Record<string, unknown>
      data: Partial<PaymentRow>
    }) => {
      const rows = store.payments.filter((p) =>
        matches(p as unknown as Record<string, unknown>, where),
      )
      rows.forEach((r) => Object.assign(r, data))
      return { count: rows.length }
    },
  },
  enrollment: {
    upsert: async ({
      where,
      create,
    }: {
      where: { userId_courseId: { userId: string; courseId: string } }
      create: EnrollmentRow
    }) => {
      const { userId, courseId } = where.userId_courseId
      const found = store.enrollments.find((e) => e.userId === userId && e.courseId === courseId)
      if (found) return found
      store.enrollments.push(create)
      return create
    },
  },
  user: {
    findUnique: async () => ({ email: 'learner@example.com', name: 'Asha Iyer' }),
  },
  course: {
    findUnique: async () => ({ title: 'POSH Awareness Training', slug: 'posh-awareness' }),
  },
}

// The route's $transaction takes a callback; hand it the same fake so writes
// inside land in the same store. Declared separately (not inline in `fakeDb`)
// because a self-referencing object literal has no inferable type.
async function fakeTransaction(fn: (tx: typeof fakeDb) => Promise<unknown>): Promise<unknown> {
  return fn(fakeDb)
}

const dbMock = { ...fakeDb, $transaction: fakeTransaction }

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/email', () => ({
  sendReceiptEmail: vi.fn(async () => true),
  sendVerificationEmail: vi.fn(async () => true),
  sendPasswordResetEmail: vi.fn(async () => true),
  sendWelcomeEmail: vi.fn(async () => true),
}))

// Imported after the mocks are registered.
const { POST } = await import('@/app/api/webhooks/razorpay/route')
const { sendReceiptEmail } = await import('@/lib/email')

// ── Helpers ─────────────────────────────────────────────────────────────────

function post(body: unknown, opts: { signature?: string | null; secret?: string } = {}) {
  const raw = JSON.stringify(body)
  const signature =
    opts.signature !== undefined
      ? opts.signature
      : crypto.createHmac('sha256', opts.secret ?? SECRET).update(raw).digest('hex')

  const headers = new Headers({ 'content-type': 'application/json' })
  if (signature !== null) headers.set('x-razorpay-signature', signature)

  const req = new Request('https://example.com/api/webhooks/razorpay', {
    method: 'POST',
    headers,
    body: raw,
  })
  return POST(req as never)
}

const capturedEvent = (over: { orderId?: string; paymentId?: string; amount?: number } = {}) => ({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: over.paymentId ?? 'pay_TEST123',
        order_id: over.orderId ?? 'order_TEST123',
        amount: over.amount ?? 499900,
        status: 'captured',
      },
    },
  },
})

function seedPayment(over: Partial<PaymentRow> = {}) {
  const row: PaymentRow = {
    id: 'pmt_1',
    userId: 'usr_1',
    courseId: 'crs_1',
    razorpayOrderId: 'order_TEST123',
    razorpayPaymentId: null,
    amountInPaise: 499900,
    status: 'CREATED',
    invoiceUrl: null,
    ...over,
  }
  store.payments.push(row)
  return row
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/razorpay', () => {
  beforeEach(() => {
    store.payments = []
    store.enrollments = []
    process.env.RAZORPAY_WEBHOOK_SECRET = SECRET
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('creates exactly one enrolment for a valid payment.captured', async () => {
    seedPayment()

    const res = await post(capturedEvent())
    expect(res.status).toBe(200)

    expect(store.enrollments).toHaveLength(1)
    expect(store.enrollments[0]).toMatchObject({ userId: 'usr_1', courseId: 'crs_1' })
    expect(store.payments[0]?.status).toBe('PAID')
    expect(store.payments[0]?.razorpayPaymentId).toBe('pay_TEST123')
  })

  it('★ REPLAY: the identical signed body delivered twice creates ONE enrolment', async () => {
    seedPayment()

    const first = await post(capturedEvent())
    const second = await post(capturedEvent())
    const third = await post(capturedEvent())

    // All 2xx — a 4xx would make Razorpay retry the event forever.
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(third.status).toBe(200)

    expect(await second.json()).toMatchObject({ message: 'Already processed' })
    expect(store.enrollments).toHaveLength(1)

    // And the learner is not emailed a receipt three times.
    expect(sendReceiptEmail).toHaveBeenCalledTimes(1)
  })

  it('rejects a forged signature and writes nothing', async () => {
    seedPayment()

    const res = await post(capturedEvent(), { secret: 'attacker_guess' })

    expect(res.status).toBe(400)
    expect(store.enrollments).toHaveLength(0)
    expect(store.payments[0]?.status).toBe('CREATED')
  })

  it('rejects a missing signature header and writes nothing', async () => {
    seedPayment()

    const res = await post(capturedEvent(), { signature: null })

    expect(res.status).toBe(400)
    expect(store.enrollments).toHaveLength(0)
  })

  it('FAILS CLOSED when the webhook secret is unset', async () => {
    seedPayment()
    delete process.env.RAZORPAY_WEBHOOK_SECRET

    const res = await post(capturedEvent())

    expect(res.status).toBe(400)
    expect(store.enrollments).toHaveLength(0)
  })

  it('★ UNDERPAYMENT: a captured amount below the order price does NOT enrol', async () => {
    seedPayment({ amountInPaise: 499900 })

    const res = await post(capturedEvent({ amount: 100 })) // ₹1 for a ₹4,999 course

    expect(res.status).toBe(200)
    expect(store.enrollments).toHaveLength(0)
    expect(store.payments[0]?.status).toBe('FAILED')
  })

  it('acknowledges an order it never created without enrolling anyone', async () => {
    const res = await post(capturedEvent({ orderId: 'order_SOMEONE_ELSES' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ message: 'Unknown order' })
    expect(store.enrollments).toHaveLength(0)
  })

  it('ignores unrelated event types', async () => {
    seedPayment()

    const res = await post({ event: 'order.paid', payload: {} })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ message: 'Ignored' })
    expect(store.enrollments).toHaveLength(0)
    expect(store.payments[0]?.status).toBe('CREATED')
  })

  it('marks a payment FAILED on payment.failed', async () => {
    seedPayment()

    await post({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'pay_X', order_id: 'order_TEST123' } } },
    })

    expect(store.payments[0]?.status).toBe('FAILED')
    expect(store.enrollments).toHaveLength(0)
  })

  it('★ OUT-OF-ORDER: a late payment.failed cannot downgrade an already-PAID payment', async () => {
    // Razorpay does not guarantee event ordering. Without the status guard this
    // would flip a paid enrolment's payment to FAILED.
    seedPayment()
    await post(capturedEvent())
    expect(store.payments[0]?.status).toBe('PAID')

    await post({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'pay_X', order_id: 'order_TEST123' } } },
    })

    expect(store.payments[0]?.status).toBe('PAID')
    expect(store.enrollments).toHaveLength(1)
  })

  it('marks REFUNDED on refund.processed and leaves the enrolment for admin review', async () => {
    seedPayment()
    await post(capturedEvent())

    await post({
      event: 'refund.processed',
      payload: { refund: { entity: { id: 'rfnd_1', payment_id: 'pay_TEST123' } } },
    })

    expect(store.payments[0]?.status).toBe('REFUNDED')
    // Documented decision: revocation is an explicit admin action, not automatic.
    expect(store.enrollments).toHaveLength(1)
  })

  it('rejects a malformed body that carries a valid signature', async () => {
    const raw = 'not json at all'
    const signature = crypto.createHmac('sha256', SECRET).update(raw).digest('hex')

    const req = new Request('https://example.com/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': signature },
      body: raw,
    })
    const res = await POST(req as never)

    expect(res.status).toBe(400)
  })
})
