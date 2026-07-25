# JS Workplace Wellness — Architecture
> Full technical reference. Bootstrap: CLAUDE.md · Schemas: orchestrate/data-model.md
> API: CONTRACTS.md · Board: orchestrate/tasks.md · Plan: documentation/DETAILED-PLAN.md

**Client:** Jyoti Solaria, certified POSH trainer
**Reference site:** elearnposh.com (information architecture only — never copy)
**Document status:** v1.0, engineering source of truth
**Audience:** Any developer or AI coding agent implementing this system

---

## 1. Locked Decisions

These are settled. Do not re-litigate them mid-build. If a decision must change, it changes here first, then in code.

| Decision | Choice | Rationale |
|---|---|---|
| Customer model | **B2C individuals only** | No organizations, seats, bulk invites, or HR dashboards in v1. Schema is built so a B2B seat layer can be added later without migration. |
| Video hosting | **Cloudflare Stream, signed playback URLs** | ~$5 per 1000 min stored + $1 per 1000 min delivered. Automatic HLS/adaptive bitrate, resume, mobile-network friendly. At expected volume (3–5 hrs content, few hundred learners) this is roughly ₹500–1500/month. |
| CMS | **Sanity v3, Studio embedded at `/studio`** | Client edits blogs, POSH content, services, course text, and quiz questions herself. Video files uploaded via Cloudflare dashboard; she pastes the Stream UID into Sanity. |
| Hosting | **Vercel** | Native Next.js App Router support, ISR, edge middleware. |
| Database | **Neon Postgres + Prisma** | Serverless Postgres, branching for staging. |

### 1.1 Rejected alternatives and why

| Rejected | Reason |
|---|---|
| Separate Express/Nest backend | Next.js route handlers cover every endpoint here. A second service doubles deploy surface, auth plumbing, and CORS bugs for zero gain at this scale. |
| Supabase (auth + DB) | Auth.js gives finer control over certificate-name locking and email verification flow. Avoids a second auth system competing with Sanity sessions. |
| Mux for video | Materially more expensive than Cloudflare Stream at this volume, and R2 is already in the stack for certificates. |
| Direct S3 + CloudFront MP4 | No adaptive bitrate. A 500 MB file downloads in full on every view, which is punishing on Indian mobile networks. Would require building a transcoding pipeline — out of scope. |
| Unlisted YouTube embeds | Cannot be gated behind payment. Anyone with the URL watches free. |
| Redux / Zustand | Server components plus URL state cover all shared state here. A client store is over-engineering for this app. |
| Three.js for home animations | Heavy bundle, hard to hand off, hard for the client to change. Lottie JSON is smaller and editable by a designer. |

---

## 2. Legal Constraint (binds the architecture)

Jyoti Solaria is **not** empanelled by the Ministry of Women and Child Development. The reference competitor is. Copying their claim structure creates legal exposure for her and for the agency that wrote the copy.

**Hard rules enforced in code and content review:**

- Certificate wording is exactly: **"Certificate of Completion — POSH Awareness Training"**, issued by Jyoti Solaria / JS Workplace Wellness.
- The following strings must never appear anywhere on the site: `POSH Certified`, `certified under the POSH Act`, `government recognized`, `MWCD empanelled`, `government approved`.
- Add a CI lint step that greps the built output for these strings and fails the build.
- Written client sign-off on certificate wording is a **blocking prerequisite** for Phase 10.

---

## 3. Stack

```
Next.js 15 (App Router) + TypeScript + Tailwind CSS
├─ Auth:        Auth.js v5 (credentials + Google OAuth), JWT sessions
├─ DB:          PostgreSQL (Neon serverless) + Prisma ORM
├─ CMS:         Sanity v3, embedded Studio at /studio
├─ Video:       Cloudflare Stream, signed playback tokens
├─ Payments:    Razorpay Orders API + webhooks
├─ Email:       Resend + React Email
├─ Object store: Cloudflare R2 (certificates, invoices, lead magnets)
├─ PDF:         @react-pdf/renderer (server-side, Node runtime)
├─ Animation:   Framer Motion + lottie-react
├─ Validation:  Zod at every API boundary
├─ Rate limit:  Upstash Redis
├─ Analytics:   Plausible (cookieless — avoids DPDP consent banner)
└─ Hosting:     Vercel
```

### 3.1 Runtime notes

- PDF generation (`@react-pdf/renderer`) requires the **Node runtime**, not Edge. Mark those route handlers `export const runtime = 'nodejs'`.
- Middleware runs on Edge — keep it to session checks and redirects only. No Prisma calls in middleware.
- Sanity Studio route must be excluded from the auth middleware matcher; Sanity handles its own auth.

---

## 4. System Diagram

```
                        ┌──────────────────────────┐
                        │        Browser           │
                        │  Next.js RSC + Client    │
                        └────────┬─────────────────┘
                                 │
                  ┌──────────────┴───────────────┐
                  │      Vercel (Next.js 15)     │
                  │  ┌────────────────────────┐  │
                  │  │ Server Components      │  │
                  │  │ Route Handlers (/api)  │  │
                  │  │ Edge Middleware (auth) │  │
                  │  └────────────────────────┘  │
                  └──┬────┬────┬────┬────┬───────┘
                     │    │    │    │    │
      ┌──────────────┘    │    │    │    └──────────────┐
      │                   │    │    │                   │
┌─────▼──────┐  ┌─────────▼─┐ ┌▼──────────┐  ┌──────────▼────┐
│ Neon       │  │ Sanity    │ │ Cloudflare│  │ Razorpay      │
│ Postgres   │  │ CMS       │ │ Stream    │  │ Orders+Webhook│
│ (Prisma)   │  │ (content) │ │ (signed)  │  └───────────────┘
└────────────┘  └─────┬─────┘ └───────────┘
                      │
              webhook │ (structure sync)
                      ▼
              /api/webhooks/sanity

┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Cloudflare R2│   │ Resend       │   │ Upstash Redis│
│ certs,       │   │ transactional│   │ rate limits  │
│ invoices,PDFs│   │ email        │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

### 4.1 Source-of-truth split

This is the most important architectural concept in the system. Get it wrong and you will have two systems disagreeing about what a course contains.

- **Sanity owns content**: titles, descriptions, body copy, quiz question text, options, correct answers, ordering intent.
- **Postgres owns state and identity**: users, enrolments, payments, progress, attempts, certificates.
- **Postgres mirrors only the structural IDs it needs to enforce gating**: `Course`, `Chapter`, `Module` rows exist in Postgres carrying `sanityId`, `order`, and `videoUid` — nothing else.

A Sanity webhook fires on publish, hitting `/api/webhooks/sanity`, which upserts the structural mirror and revalidates cache tags. Content changes never require a deploy.

---

## 5. Data Model (Prisma)

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  emailVerified  DateTime?
  passwordHash   String?
  name           String              // printed on certificate
  nameLocked     Boolean   @default(false)
  phone          String?
  image          String?
  role           Role      @default(LEARNER)
  createdAt      DateTime  @default(now())
  accounts       Account[]
  sessions       Session[]
  enrollments    Enrollment[]
  moduleProgress ModuleProgress[]
  attempts       AssessmentAttempt[]
  certificates   Certificate[]
  payments       Payment[]
}

enum Role { LEARNER ADMIN }

model Course {
  id            String   @id @default(cuid())
  sanityId      String   @unique
  slug          String   @unique
  title         String
  priceInPaise  Int
  isPublished   Boolean  @default(false)
  passThreshold Int      @default(85)   // final test %
  enrollments   Enrollment[]
  chapters      Chapter[]
}

model Chapter {
  id            String   @id @default(cuid())
  sanityId      String   @unique
  courseId      String
  course        Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  order         Int
  title         String
  passThreshold Int      @default(80)
  modules       Module[]
  attempts      AssessmentAttempt[]

  @@unique([courseId, order])
}

model Module {
  id              String   @id @default(cuid())
  sanityId        String   @unique
  chapterId       String
  chapter         Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  order           Int
  title           String
  videoUid        String              // Cloudflare Stream UID
  durationSeconds Int
  isFreePreview   Boolean  @default(false)
  progress        ModuleProgress[]

  @@unique([chapterId, order])
}

model Enrollment {
  id          String    @id @default(cuid())
  userId      String
  courseId    String
  user        User      @relation(fields: [userId], references: [id])
  course      Course    @relation(fields: [courseId], references: [id])
  paymentId   String?   @unique
  enrolledAt  DateTime  @default(now())
  completedAt DateTime?

  @@unique([userId, courseId])
}

model ModuleProgress {
  id              String    @id @default(cuid())
  userId          String
  moduleId        String
  user            User      @relation(fields: [userId], references: [id])
  module          Module    @relation(fields: [moduleId], references: [id])
  secondsWatched  Int       @default(0)   // cumulative, SERVER-CLAMPED
  lastPositionSec Int       @default(0)   // resume point
  lastHeartbeatAt DateTime?               // ★ clamp basis for the next delta
  completedAt     DateTime?               // set at secondsWatched ≥ 0.9 × durationSeconds

  @@unique([userId, moduleId])
}

model AssessmentAttempt {
  id           String    @id @default(cuid())
  userId       String
  chapterId    String?             // null => final test
  courseId     String
  user         User      @relation(fields: [userId], references: [id])
  chapter      Chapter?  @relation(fields: [chapterId], references: [id])
  scorePercent Int
  passed       Boolean
  answers      Json                // { questionId: selectedOptionId }
  startedAt    DateTime  @default(now())
  submittedAt  DateTime?

  @@index([userId, chapterId])
}

model Certificate {
  id           String    @id @default(cuid())
  certId       String    @unique     // human-readable: JSWW-2026-A7K2P9
  userId       String
  courseId     String
  user         User      @relation(fields: [userId], references: [id])
  learnerName  String                // snapshot at issue time
  issuedAt     DateTime  @default(now())
  pdfUrl       String
  revokedAt    DateTime?
  revokeReason String?
}

model Payment {
  id                String        @id @default(cuid())
  userId            String
  user              User          @relation(fields: [userId], references: [id])
  courseId          String
  razorpayOrderId   String        @unique
  razorpayPaymentId String?       @unique
  amountInPaise     Int
  currency          String        @default("INR")
  status            PaymentStatus @default(CREATED)
  invoiceUrl        String?
  createdAt         DateTime      @default(now())
}

enum PaymentStatus { CREATED PAID FAILED REFUNDED }

model Lead {
  id              String   @id @default(cuid())
  name            String
  email           String
  phone           String?
  organization    String?
  employeeCount   String?
  serviceInterest String?
  message         String?
  source          String              // 'demo'|'checklist'|'assessment'|'newsletter'
  consentGiven    Boolean
  createdAt       DateTime @default(now())

  @@index([source, createdAt])
}
```

Auth.js also requires `Account`, `Session`, and `VerificationToken` models — use the standard Prisma adapter schema verbatim.

### 5.1 Why Enrollment is its own table

It would be simpler to put a `courseId` array on `User`. Do not. A separate join table is what allows a future B2B layer (`Organization` → `Seat` → `Enrollment`) to be bolted on without touching learner data or migrating existing rows.

---

## 6. Route Map

```
PUBLIC
/                          Home
/about
/posh-act                  Knowledge Hub — SEO centerpiece
/posh-act/[section]        Optional split for heavy sections
/services
/services/[slug]
/courses
/courses/[slug]            Sales page + free preview module
/blog
/blog/[slug]
/blog/category/[cat]
/faq
/posh-compliance-check     Self-assessment tool
/book-demo
/contact
/verify/[certId]           Public certificate verification
/privacy
/terms
/refund-policy

AUTH
/login
/signup
/verify-email
/forgot-password
/reset-password

LEARNER (middleware-protected)
/dashboard
/dashboard/certificates
/dashboard/invoices
/learn/[courseSlug]                          Curriculum overview
/learn/[courseSlug]/[moduleId]               Player
/learn/[courseSlug]/chapter/[n]/assessment
/learn/[courseSlug]/final-test

ADMIN (role=ADMIN)
/studio                    Sanity Studio
/admin                     Enrolments, payments, leads, cert revocation
```

---

## 7. API Surface

| Method | Route | Purpose |
|---|---|---|
| `*` | `/api/auth/[...nextauth]` | Auth.js handler |
| POST | `/api/checkout/create-order` | Creates Razorpay order. Price read from DB by `courseId`. |
| POST | `/api/webhooks/razorpay` | HMAC-verified. Creates `Enrollment` + `Payment`. |
| POST | `/api/webhooks/sanity` | Secret-verified. Syncs structure, revalidates tags. |
| GET | `/api/video/token/:moduleId` | Signed Stream token. 403 unless enrolled and unlocked. |
| POST | `/api/progress/heartbeat` | `{moduleId, position, delta}`. Server clamps delta. |
| POST | `/api/assessment/:chapterId/start` | Returns randomized questions, answers stripped. |
| POST | `/api/assessment/:attemptId/submit` | Server-grades. Returns score + topic feedback. |
| POST | `/api/certificate/issue` | Idempotent. Only if final test passed. |
| GET | `/api/certificate/:certId/verify` | Public verification lookup. |
| POST | `/api/leads` | Rate-limited. Honeypot + Cloudflare Turnstile. |
| GET | `/api/youtube/latest` | Cached 6h. YouTube Data API v3. |

Every handler validates its body with a Zod schema defined in `/lib/schemas/`. No exceptions.

---

## 8. Security Rules

These are not suggestions. Each one maps to a specific, common, exploitable failure.

1. **Price is read from the database by `courseId`. Never from the request body.**
   The single most common payment bug in Indian e-learning builds. A client sending `amount: 100` for a ₹4999 course must fail.

2. **Enrolment is created only by the Razorpay webhook, after HMAC verification.**
   Never by the client-side `handler` success callback — the attacker controls that code path entirely. Verify `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using `crypto.timingSafeEqual`.

3. **Video tokens are per-module, short-lived (≤5 minutes), and re-check enrolment plus unlock state on every request.**
   Never include the Stream UID of a locked module in any RSC payload or JSON response.

4. **Progress heartbeat is server-clamped: `delta ≤ elapsedWallClock × 1.5`.**
   Otherwise a learner POSTs `delta: 999999` and completes a 45-minute module instantly. Store `lastHeartbeatAt` server-side and compute elapsed time from it. This is how every naive LMS gets gamed.

5. **Correct answers never leave the server.**
   `/assessment/start` strips `correctOptionId` before serialization. Grading happens exclusively in `/assessment/submit`. Return score and topic-level feedback only — never a per-question answer key, or learners screenshot it and share.

6. **Unlock state is computed server-side in the route handler.**
   Never inferred from client state. A locked chapter's content must not exist in the RSC payload.

7. **Certificate issuance is idempotent.**
   Partial unique index on `(userId, courseId) WHERE revokedAt IS NULL`. A double-submit must not mint two certificates.

8. **DPDP Act compliance.**
   Explicit, unticked consent checkbox on every form that collects personal data. Privacy policy states purpose, retention period, and a deletion contact. Plausible chosen over GA4 specifically to avoid a cookie consent banner.

9. **Rate limits (Upstash):**
   - `/api/leads` — 5/hour per IP
   - `/api/auth/*` login — 10/15min per IP, 5/15min per email
   - `/api/assessment/*/submit` — 20/hour per user
   - `/api/video/token/*` — 60/hour per user

---

## 9. Unlock Engine (specification)

A single server-side function is the authority for all gating. Every route that reveals content calls it.

```ts
// lib/unlock.ts
type UnlockState = {
  moduleUnlocked: (moduleId: string) => boolean
  chapterAssessmentUnlocked: (chapterId: string) => boolean
  finalTestUnlocked: boolean
}

async function computeUnlockState(userId: string, courseId: string): Promise<UnlockState>
```

Rules:

1. Module `n` in chapter `c` unlocks when module `n-1` in chapter `c` has `completedAt != null`.
2. Module 1 of chapter `c` unlocks when chapter `c-1`'s assessment has a passing attempt.
3. Chapter 1, module 1 unlocks on enrolment.
4. A chapter's assessment unlocks when all modules in that chapter are complete.
5. The final test unlocks when every chapter has a passing assessment attempt.
6. Modules flagged `isFreePreview` are unlocked for everyone, enrolled or not.
7. A module completes at **≥90% of `durationSeconds` watched** (cumulative `secondsWatched`, not position).

### 9.1 Assessment rules

Client requested 100%-correct-to-pass. **This is specified at 80% with randomization instead.** Rationale documented in the Detailed Plan; requires client sign-off before Phase 9.

- Chapter assessment: 80% pass
- Final test: 85% pass, drawn across all chapters
- Questions randomized per attempt from a larger Sanity pool
- Option order shuffled per attempt
- Unlimited retries; 10-minute cooldown after two consecutive failures
- Final test: max 3 attempts per 24 hours
- Post-attempt review shows **which topics** were missed, never which answers were right

---

## 10. Environment Variables

```
# Core
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_READ_TOKEN=
SANITY_WEBHOOK_SECRET=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_TOKEN=
CLOUDFLARE_STREAM_SIGNING_KEY_ID=
CLOUDFLARE_STREAM_SIGNING_KEY_PEM=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Misc
YOUTUBE_API_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

---

## 11. Repository Structure

```
/app
  /(marketing)
    page.tsx                    Home
    /about /services /blog /faq /contact /book-demo
    /posh-act
    /posh-compliance-check
    /verify/[certId]
    /(legal)/privacy /terms /refund-policy
  /(auth)
    /login /signup /verify-email /forgot-password /reset-password
  /(learner)
    /dashboard
    /learn/[courseSlug]
  /admin
  /studio/[[...tool]]
  /api
    /auth/[...nextauth]
    /checkout /webhooks /video /progress /assessment /certificate /leads /youtube
/components
  /ui                           Primitives: Button, Input, Accordion...
  /marketing                    Hero, ServiceCard, TocSidebar, LottieLoop...
  /learn                        VideoPlayer, CurriculumTree, QuizRunner...
/lib
  /schemas                      Zod schemas, one file per API boundary
  auth.ts  db.ts  sanity.ts  stream.ts  razorpay.ts  unlock.ts  ratelimit.ts
/sanity
  /schemas                      course, chapter, module, question, post, service,
                                poshSection, faq, testimonial, siteSettings
/prisma
  schema.prisma
/emails                         React Email templates
/public/lottie                  animation JSON
/tests
  /unit /integration /e2e
```

---

## 12. Performance Budget

| Metric | Target |
|---|---|
| Lighthouse Performance (marketing pages, mobile) | ≥ 90 |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| Initial JS (marketing routes) | < 150 KB gzipped |
| Each Lottie file | ≤ 150 KB |

Enforcement details:
- All public marketing pages are SSG or ISR. No client-side data fetching on first paint.
- YouTube uses a **lite façade** (click-to-load poster) — never the standard iframe, which ships ~1.5 MB.
- Lottie animations lazy-load via `IntersectionObserver`, pause when offscreen, and are skipped entirely under `prefers-reduced-motion`.
- Images through `next/image` with explicit dimensions.

---

## 13. Testing Strategy

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | `unlock.ts` truth table, grading logic, delta clamping, cert ID generation |
| Integration | Vitest + test DB | Webhook idempotency, enrolment creation, cert issuance idempotency |
| E2E | Playwright | Signup → pay (Razorpay test) → watch → assess → final → certificate → verify |
| Security | Manual checklist | See §8, one test per numbered rule |
| A11y | axe-core in Playwright | WCAG 2.1 AA on every public route |

**Mandatory adversarial tests** — each maps to a §8 rule:
- POST checkout with a tampered `amount` → must 400
- POST progress heartbeat with `delta: 999999` → must clamp
- GET video token for a locked module → must 403
- Inspect `/assessment/start` response → must contain no `correctOptionId`
- Double-submit `/certificate/issue` → must return the same `certId`
- Replay a Razorpay webhook → must not create a duplicate enrolment

---

## 14. Deployment & Environments

| Environment | Branch | Database | Purpose |
|---|---|---|---|
| Production | `main` | Neon `main` | Live site |
| Staging | `develop` | Neon branch `staging` | Client UAT |
| Preview | any PR | Neon branch per PR | Review |

- Razorpay **test keys** everywhere except production.
- Sanity uses a separate `staging` dataset; production dataset is never written to from a preview deploy.
- CI on every PR: typecheck → lint → unit tests → build → forbidden-claims grep (§2) → Lighthouse CI on 3 key routes.
- Branch protection on `main`: no direct pushes, one approving review required.

---

## 15. Third-Party Risk Register

| Dependency | Risk | Mitigation |
|---|---|---|
| Instagram Basic Display API | Token expires every 60 days, fails silently | **Do not use.** Sanity-managed grid of post URLs + static images. Documented tradeoff for the client. |
| YouTube Data API | 10k units/day quota | Cache 6h. Fall back to last-cached payload on failure. |
| Razorpay account activation | Requires live Terms + Refund Policy pages | Legal pages are a **Phase 3 blocker**, not a launch-week task. |
| Cloudflare Stream | Vendor lock-in on video IDs | Keep source MP4s in R2. Migration is re-upload, not re-encode. |
| Sanity free tier | 100k API requests/month | All public content is ISR-cached; requests scale with builds, not traffic. |

---

## 16. Out of Scope for v1

Stated explicitly so scope creep is a conversation about money, not a silent absorption of work.

Multi-language content, complaint management system, IC meeting registers, external member directory, live webinars, organization/HR dashboards, mobile app, SCORM/LTI export, AI chatbot, bulk seat purchase, SSO.

Anything on this list that the client requests becomes v2 with separate scoping and pricing.
