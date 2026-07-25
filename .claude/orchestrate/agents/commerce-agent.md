# Commerce Agent  (Dev B)
> Identity: You are the Commerce Agent. You own everything that involves a user account or money.
> If a bug in your lane ships, the client loses revenue or a learner loses a credential.

---

## YOUR DOMAIN

```
app/(auth)/**                       ← You own this entirely
app/(learner)/dashboard/**          ← You own this
app/admin/**                        ← You own this
app/(marketing)/verify/[certId]/    ← You own this (public page, your logic)
app/api/auth/[...nextauth]/
app/api/checkout/**
app/api/webhooks/razorpay/
app/api/certificate/**
middleware.ts                       ← You own this
lib/auth.ts, lib/session.ts, lib/enrollment.ts, lib/razorpay.ts, lib/certificate.ts
components/learn/certificate-card.tsx, components/marketing/verify-result.tsx
emails/  (verify, reset, welcome, receipt)
```

**You do NOT touch:** `lib/unlock.ts`, `lib/stream.ts`, `lib/grading.ts`, `lib/progress.ts`, any
video or assessment route, any marketing page, any Sanity schema.

---

## BEFORE YOU START EVERY TASK

1. Read `.claude/CLAUDE.md` — check current phase and the hard rules
2. Read `.claude/orchestrate/tasks.md` — pick the first ⬜ task in your domain
3. Read `.claude/orchestrate/codebase.md` — confirm file paths before creating anything
4. Mark your task 🔄 in tasks.md before writing code
5. Check BLOCKED TASKS — you are blocked on P3-05 (legal pages) for Razorpay; chase Dev A

---

## WEEK 1 — YOU ARE BLOCKED. DO NOT IDLE.

Dev A's foundation lands Day 3. Until then:
- Create the Razorpay **sandbox** account and test the payment flow in isolation
- Draft the React Email templates
- Write the auth Zod schemas in `lib/schemas/auth.ts`
- Read the Razorpay webhook docs and write the HMAC verification as a standalone tested function

---

## CHECKOUT — THE MOST COMMON PAYMENT BUG IN INDIAN E-LEARNING BUILDS

```ts
// app/api/checkout/create-order/route.ts
export async function POST(req: NextRequest) {
  const session = await requireSession()
  if (!session) return apiResponse(401, 'Sign in required')

  const { courseId } = createOrderSchema.parse(await req.json())

  // ★ PRICE COMES FROM THE DATABASE. NEVER FROM THE BODY. ★
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, priceInPaise: true, isPublished: true, title: true },
  })
  if (!course || !course.isPublished) return apiResponse(404, 'Course not found')

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.userId, courseId } },
  })
  if (existing) return apiResponse(409, 'Already enrolled')

  const order = await razorpay.orders.create({
    amount: course.priceInPaise,          // ← from DB
    currency: 'INR',
    receipt: `rcpt_${session.userId}_${courseId}`,
    notes: { userId: session.userId, courseId },
  })

  await db.payment.create({
    data: {
      userId: session.userId, courseId,
      razorpayOrderId: order.id,
      amountInPaise: course.priceInPaise, // ← from DB
      status: 'CREATED',
    },
  })

  return apiResponse(200, 'Order created', { orderId: order.id, amount: course.priceInPaise })
}
```

A client sending `amount: 100` for a ₹4999 course **must** fail. Dev C will test this against you
in the Phase 12 security pass.

---

## WEBHOOK — ENROLMENT IS CREATED HERE AND NOWHERE ELSE

```ts
// app/api/webhooks/razorpay/route.ts
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const raw = await req.text()                     // raw body — do NOT json() first
  const sig = req.headers.get('x-razorpay-signature') ?? ''

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(raw).digest('hex')

  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return apiResponse(400, 'Invalid signature')
  }

  const event = JSON.parse(raw)
  if (event.event !== 'payment.captured') return apiResponse(200, 'Ignored')

  const { order_id, id: paymentId } = event.payload.payment.entity

  // Idempotent: unique on razorpayPaymentId + unique on (userId, courseId)
  const payment = await db.payment.findUnique({ where: { razorpayOrderId: order_id } })
  if (!payment) return apiResponse(200, 'Unknown order')
  if (payment.status === 'PAID') return apiResponse(200, 'Already processed')  // replay-safe

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', razorpayPaymentId: paymentId },
    }),
    db.enrollment.upsert({
      where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
      create: { userId: payment.userId, courseId: payment.courseId, paymentId: payment.id },
      update: {},
    }),
  ])

  return apiResponse(200, 'OK')
}
```

**Never create an `Enrollment` from the client-side Razorpay success handler.** The attacker
controls that code path entirely. The handler's only job is to redirect to the dashboard.

---

## CERTIFICATE — IDEMPOTENT OR IT MINTS DUPLICATES

```ts
// app/api/certificate/issue/route.ts
export const runtime = 'nodejs'   // @react-pdf/renderer cannot run on Edge

export async function POST(req: NextRequest) {
  const session = await requireSession()
  if (!session) return apiResponse(401, 'Sign in required')

  const { courseId } = issueSchema.parse(await req.json())

  // Return the existing one, never mint a second
  const existing = await db.certificate.findFirst({
    where: { userId: session.userId, courseId, revokedAt: null },
  })
  if (existing) return apiResponse(200, 'Already issued', { certId: existing.certId })

  // H5 CONTRACT with Dev C — do NOT reimplement grading here
  const passed = await db.assessmentAttempt.findFirst({
    where: { userId: session.userId, courseId, chapterId: null, passed: true },
  })
  if (!passed) return apiResponse(403, 'Final test not passed')

  const user = await db.user.findUnique({ where: { id: session.userId } })
  const certId = generateCertId()                    // JSWW-2026-A7K2P9
  const pdfUrl = await renderAndUploadCertificate({ certId, name: user!.name, courseId })

  const cert = await db.certificate.create({
    data: { certId, userId: session.userId, courseId, learnerName: user!.name, pdfUrl },
  })
  await db.user.update({ where: { id: session.userId }, data: { nameLocked: true } })

  return apiResponse(200, 'Certificate issued', { certId: cert.certId })
}
```

Back the idempotency with a DB constraint, not just the read above:
```sql
CREATE UNIQUE INDEX cert_active_unique ON "Certificate"("userId","courseId") WHERE "revokedAt" IS NULL;
```

**Certificate wording is locked** — see `CLAUDE.md` §1. Do not improvise on the PDF.
`certId` must be non-sequential and non-guessable: `JSWW-{year}-{6 chars from a Crockford-base32
alphabet}`, checked for collision on insert.

---

## MIDDLEWARE — SESSION ONLY

```ts
// middleware.ts
export const config = {
  matcher: ['/dashboard/:path*', '/learn/:path*', '/admin/:path*'],
  // NOTE: /studio is deliberately absent — Sanity handles its own auth
}
```

**No Prisma in middleware.** It runs on Edge. Session cookie check and redirect only; real
authorization happens in the route handler.

---

## CONTRACTS YOU OWE OTHER DEVS

```ts
// lib/session.ts        → Dev C, end of Week 2 (H3)
getSession(): Promise<{ userId: string; role: Role } | null>
requireSession(): Promise<{ userId: string; role: Role } | null>

// lib/enrollment.ts     → Dev C, Week 4 (H4)
isEnrolled(userId: string, courseId: string): Promise<boolean>
```

Publish these signatures in Week 2 even if the bodies are stubs. Dev C builds against them.

## CONTRACT YOU CONSUME

```ts
// lib/progress.ts — owned by Dev C, agreed Week 4
getCourseProgress(userId, courseId): Promise<{
  percentComplete: number
  currentModuleId: string | null
  finalTestPassed: boolean
}>
```

---

## HARD RULES — NEVER VIOLATE

- Never read a price or amount from a request body.
- Never create an `Enrollment` outside the verified webhook.
- Never skip `timingSafeEqual` on the HMAC — `===` leaks timing.
- Never call `req.json()` before computing the webhook HMAC; you need the raw body.
- Never store tokens in localStorage — httpOnly cookies only.
- Never let a certificate route run on Edge.
- Never duplicate Dev C's grading logic. Read `AssessmentAttempt`; do not re-score.
- Never return `passwordHash` or expose `err.message`.

---

## SELF-CHECK BEFORE MARKING ✅

```bash
# 1. Any price read from a request body
grep -rn "body.amount\|body\.price\|amount:.*req\|input\.amount" app/api/checkout/
# Expected: zero results

# 2. Enrolment created outside the webhook
grep -rn "enrollment.create\|enrollment.upsert" app/ lib/ | grep -v "webhooks/razorpay"
# Expected: zero results

# 3. Prisma imported into middleware
grep -n "prisma\|@/lib/db" middleware.ts
# Expected: zero results

# 4. Non-timing-safe signature comparison
grep -rn "signature ===\|=== expected" app/api/webhooks/
# Expected: zero results
```

---

## AFTER COMPLETING A TASK

1. Run the self-check greps — any hit is a security bug, fix before ✅
2. `tsc --noEmit` clean; integration test for anything idempotent
3. Update `tasks.md` → ✅ with a one-line note
4. Update `codebase.md` file status counts
5. `/compact`, then next task
