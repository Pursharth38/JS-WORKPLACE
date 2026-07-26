# API Contracts
> Every endpoint, its owner, its guards, and its exact shape. Agents build against this file.
> Architecture: ARCHITECTURE.md · Schemas: orchestrate/data-model.md · Board: orchestrate/tasks.md

---

## UNIVERSAL ENVELOPE

All responses go through `apiResponse()` in `lib/response.ts`. Never bare `NextResponse.json()`.
```
{ success: true|false, message: string, data: {...} | null }
```
Never expose `err.message` or a stack trace. Never return `passwordHash`, `correctOptionId`, or a
locked module's `videoUid`.

## PAGINATION (every list endpoint)
```
data: { items: [...], pagination: { page, limit, total, pages } }
```

## VALIDATION
Every route parses its body with a Zod schema from `lib/schemas/`. A parse failure is `400`, and the
response says "Invalid input" — never the Zod error detail, which leaks the schema shape.

---

# AUTH  — owner: Dev B

### `*` /api/auth/[...nextauth]
Auth.js v5 handler. Providers: credentials (email + password) and Google OAuth. JWT sessions in
httpOnly cookies. `name` is captured at signup and becomes the certificate's legal name.

Rate limits: 10 / 15 min per IP · 5 / 15 min per email.

### Session helpers (contract consumed by Dev C — H3, end of Week 2)
```ts
getSession():     Promise<{ userId: string; role: 'LEARNER'|'ADMIN' } | null>
requireSession(): Promise<{ userId: string; role: 'LEARNER'|'ADMIN' } | null>
```

### Enrolment helper (contract consumed by Dev C — H4, Week 4)
```ts
isEnrolled(userId: string, courseId: string): Promise<boolean>
```

---

# COMMERCE  — owner: Dev B

### POST /api/checkout/create-order
Guards: session required.
```
req  { courseId: string }
res  { orderId: string, amount: number }     // amount in paise, FROM THE DATABASE
```
- Price is read from `Course.priceInPaise` by `courseId`. **Never from the body.**
- `409` if an `Enrollment` already exists for this `(userId, courseId)`.
- `404` if the course is missing or `isPublished === false`.
- Creates a `Payment` row with `status: CREATED`.

### POST /api/webhooks/razorpay
Guards: **none** (public) — but HMAC-verified before anything else runs.
- Read the **raw body** with `req.text()`. Calling `req.json()` first breaks verification.
- `crypto.timingSafeEqual` against `RAZORPAY_WEBHOOK_SECRET`. Never `===`.
- Only acts on `payment.captured`. Everything else returns `200 Ignored`.
- **Replay-safe:** if `Payment.status === 'PAID'` already, return `200 Already processed`.
- In one transaction: mark the `Payment` PAID and `upsert` the `Enrollment`.
- **This is the only place an `Enrollment` is ever created.**

### GET /api/dashboard/summary
Guards: session.
```
res  { enrollments: [{ courseId, title, slug, percentComplete, currentModuleId, finalTestPassed }] }
```
Progress fields come from Dev C's `getCourseProgress()`. Dev B does not recompute them.

### GET /api/invoice/[paymentId]
Guards: session. Runtime: **`nodejs`** (`@react-pdf/renderer` cannot run on Edge).
```
res  application/pdf (Content-Disposition: attachment)
```
- Added beyond the original contract during Dev B's Phase 7 build — not in the initial spec.
- Streams the PDF through this handler rather than handing out an R2 URL, so ownership is
  re-checked on every download. `Payment.invoiceUrl` stores an R2 object **key**, never a public URL.
- Generated lazily on first download (not in the webhook), then cached to R2.
- `409` if the payment exists but is not yet `PAID`. `404` collapses "not yours" and "doesn't
  exist" into the same response — distinguishing them would confirm another user's payment id is real.
- `Cache-Control: private, no-store` — contains personal/financial data.

---

# CONTENT  — owner: Dev A

### POST /api/webhooks/sanity
Guards: `SANITY_WEBHOOK_SECRET` header check.
- Upserts `Course` / `Chapter` / `Module` by `sanityId` — **structure only**.
  Fields synced: `sanityId`, `slug`, `title`, `order`, `videoUid`, `durationSeconds`,
  `isFreePreview`, `priceInPaise`, `isPublished`, `passThreshold`.
- Never writes body copy, descriptions, or question text into Postgres.
- Calls `revalidateTag()` on the affected content tags.

### POST /api/leads
Guards: Upstash rate limit 5/hour per IP · honeypot field · Cloudflare Turnstile.
```
req  { name, email, phone?, organization?, employeeCount?, serviceInterest?, message?,
       source: 'demo'|'checklist'|'assessment'|'newsletter', consentGiven: boolean, website?: string }
res  { id: string }
```
- `website` is the honeypot. If filled, return `200 Received` and discard silently.
- `consentGiven: false` → `400`. The checkbox must render **unticked** (DPDP).
- Notification email is fire-and-forget; never block the response on it.

---

# LEARNING  — owner: Dev C

### GET /api/video/token/[moduleId]
Guards: session → `isEnrolled` (skipped for `isFreePreview`) → `computeUnlockState`.
```
res  { token: string }      // signed Cloudflare Stream token, TTL ≤ 300s
```
- `403 Not enrolled` / `403 Locked` as appropriate.
- **`videoUid` is never in the response.** It is selected only inside this handler.

### POST /api/progress/heartbeat
Guards: session → module unlocked. Client sends every 15s while playing.
```
req  { moduleId: string, position: number, delta: number }
res  { secondsWatched: number, completed: boolean }
```
- **Server clamp:** `safeDelta = min(delta, ceil((now − lastHeartbeatAt) / 1000 × 1.5))`.
- `secondsWatched` is capped at `durationSeconds`.
- `completedAt` is set when `secondsWatched ≥ 0.9 × durationSeconds`, and never unset.

### POST /api/assessment/[chapterId]/start
Guards: session → chapter assessment unlocked → cooldown check.
```
res  { attemptId: string,
       questions: [{ id, text, options: [{ id, text }] }] }   // correctOptionId ABSENT
```
- Questions randomized from the Sanity pool; option order shuffled per attempt.
- `429` with `retryAfter` if within the 10-minute cooldown (two consecutive failures).
- Final test (`chapterId` omitted) additionally caps at 3 attempts per 24h.

### POST /api/assessment/[attemptId]/submit
Guards: session → attempt belongs to the caller → not already submitted.
```
req  { answers: { [questionId: string]: string } }
res  { scorePercent, passed, weakTopics: string[] }
```
- Grading is server-side against a fresh Sanity fetch. **Never trust a client-computed score.**
- Threshold: `Chapter.passThreshold` (80) or `Course.passThreshold` (85) for the final test.
- Returns weak **topics**, never a per-question answer key.

### GET /api/youtube/latest
Public. No auth.
```
res  { videos: [{ id, title, publishedAt, thumbnailUrl }] }
```
- Cached 6h via Next's fetch Data Cache (`next: { revalidate: 21600 }`), not a hand-rolled cache —
  the route runs on serverless functions with no memory shared between invocations.
- On API failure after the cache window expires, Next keeps serving the previous cached response
  rather than surfacing the error — the "stale fallback on failure" behaviour is a property of the
  cache, not application code. A cold cache with nothing to fall back to returns `{ videos: [] }`.
- Degrades to `{ videos: [] }` when `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` are unset — the
  home page's YouTube strip simply doesn't render, same pattern as an unconfigured Sanity project.

### Progress contract (consumed by Dev B — H5, Week 4)
```ts
getCourseProgress(userId, courseId): Promise<{
  percentComplete: number
  currentModuleId: string | null
  finalTestPassed: boolean
}>
```

---

# CERTIFICATES  — owner: Dev B

### POST /api/certificate/issue
Guards: session. Runtime: **`nodejs`** (`@react-pdf/renderer` cannot run on Edge).
```
req  { courseId: string }
res  { certId: string }
```
- **Idempotent.** Existing non-revoked certificate → return its `certId`, do not mint a second.
  Backed by `CREATE UNIQUE INDEX ... ON "Certificate"("userId","courseId") WHERE "revokedAt" IS NULL`.
- Eligibility read (H5 contract): `AssessmentAttempt WHERE courseId = ? AND chapterId IS NULL AND passed = true`.
  Dev B does not re-score.
- Snapshots `learnerName` at issue time and sets `User.nameLocked = true`.
- `certId` format `JSWW-{year}-{6 chars}` — non-sequential, non-guessable, collision-checked.

### GET /api/certificate/[certId]/verify
**Public.** No auth.
```
res  { valid: boolean, learnerName, courseTitle, issuedAt, revoked: boolean }
```
Returns `valid: false` for an unknown `certId` — never `404`, which would let someone enumerate.

### GET /api/certificate/[certId]/pdf
Guards: session, owner or `role === 'ADMIN'`. Runtime: **`nodejs`**.
```
res  application/pdf (Content-Disposition: attachment)
```
- Added beyond the original contract during Dev B's Phase 10 build — not in the initial spec.
- The public surface for a certificate stays `/verify/[certId]` (facts only). This route serves
  the actual PDF document, and only to its owner or an admin — never a direct R2 link.
- "Not yours" and "does not exist" both return `404` — cannot be used to test whether a `certId` is real.
- `410` if revoked.
- Regenerates deterministically from the DB row on an R2 cache miss (the PDF is fully determined
  by the stored `certId` / `learnerName` snapshot / `issuedAt`), so a failed upload at issue time
  never becomes a permanently broken download.
- `Cache-Control: private, no-store`.

---

# ADMIN  — owner: Dev B

All routes guarded by `session.role === 'ADMIN'`.
```
GET   /api/admin/enrollments   → Paginated
GET   /api/admin/payments      → Paginated
GET   /api/admin/learners/:id  → progress detail
POST  /api/admin/certificate/:certId/revoke   { reason }
GET   /api/admin/leads.csv     → CSV export
```

---

# RATE LIMITS (Upstash) — owner: Dev A implements, each owner wires

| Endpoint | Limit |
|---|---|
| `/api/leads` | 5 / hour / IP |
| `/api/auth/*` login | 10 / 15min / IP · 5 / 15min / email |
| `/api/assessment/*/submit` | 20 / hour / user |
| `/api/video/token/*` | 60 / hour / user |
| `/api/checkout/create-order` | 10 / hour / user |
