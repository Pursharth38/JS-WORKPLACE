# Codebase Map
> Where every file lives and what it owns. Never guess locations — check here first.
> Architecture: ../ARCHITECTURE.md · Schemas: data-model.md · API: ../CONTRACTS.md

---

## APP ROUTES: app/

```
app/
├── layout.tsx                        ← Root. Fonts (Fraunces + Inter), Plausible, Toaster.
├── globals.css                       ← Tailwind + CSS variables from design tokens
│
├── (marketing)/                      ← [A] SSG/ISR. No client fetching on first paint.
│   ├── layout.tsx                    ← Header + Footer + WhatsAppFAB
│   ├── page.tsx                      ← Home (Lottie slots — [C] fills Phase 11)
│   ├── about/page.tsx
│   ├── services/page.tsx
│   ├── services/[slug]/page.tsx
│   ├── posh-act/page.tsx             ← KNOWLEDGE HUB — the SEO centerpiece
│   ├── posh-compliance-check/page.tsx
│   ├── blog/page.tsx
│   ├── blog/[slug]/page.tsx
│   ├── blog/category/[cat]/page.tsx
│   ├── faq/page.tsx
│   ├── courses/page.tsx
│   ├── courses/[slug]/page.tsx       ← Sales page + free-preview module
│   ├── contact/page.tsx
│   ├── book-demo/page.tsx
│   ├── verify/[certId]/page.tsx      ← PUBLIC cert verification  [B]
│   └── (legal)/
│       ├── privacy/page.tsx          ← [A] BLOCKS Razorpay activation
│       ├── terms/page.tsx
│       └── refund-policy/page.tsx
│
├── (auth)/                           ← [B]
│   ├── login/  signup/  verify-email/  forgot-password/  reset-password/
│
├── (learner)/                        ← middleware-protected
│   ├── dashboard/page.tsx            ← [B]
│   ├── dashboard/certificates/page.tsx
│   ├── dashboard/invoices/page.tsx
│   └── learn/[courseSlug]/
│       ├── page.tsx                  ← [C] curriculum overview
│       ├── [moduleId]/page.tsx       ← [C] player
│       ├── chapter/[n]/assessment/page.tsx
│       └── final-test/page.tsx
│
├── admin/page.tsx                    ← [B] role=ADMIN
├── studio/[[...tool]]/page.tsx       ← [A] Sanity Studio — EXCLUDED from auth middleware
│
├── sitemap.ts  robots.ts             ← [A] generated from Sanity
├── opengraph-image.tsx               ← [A] per-route OG images
│
└── api/
    ├── auth/[...nextauth]/route.ts   ← [B]
    ├── checkout/create-order/route.ts← [B] PRICE FROM DB
    ├── webhooks/
    │   ├── razorpay/route.ts         ← [B] HMAC verified, idempotent, replay-safe
    │   └── sanity/route.ts           ← [A] secret verified, structure upsert, revalidate
    ├── video/token/[moduleId]/route.ts   ← [C] signed ≤5min, re-checks enrol + unlock
    ├── progress/heartbeat/route.ts   ← [C] server-clamped delta
    ├── assessment/
    │   ├── [chapterId]/start/route.ts    ← [C] STRIPS correctOptionId
    │   └── [attemptId]/submit/route.ts   ← [C] server-grade only
    ├── certificate/
    │   ├── issue/route.ts            ← [B] idempotent; runtime='nodejs'
    │   └── [certId]/verify/route.ts  ← [B] public
    ├── leads/route.ts                ← [A] rate-limited, honeypot, Turnstile
    └── youtube/latest/route.ts       ← [C] cached 6h, stale fallback
```

---

## COMPONENTS: components/

```
components/
├── ui/                               ← [A] primitives, no domain logic
│   button · input · select · checkbox · card · badge · modal · toast
│   skeleton · accordion · tabs · turnstile
│
├── marketing/                        ← [A] unless noted
│   header (sticky, mega-menu) · footer · whatsapp-fab · container
│   hero · stat-band · service-card · course-card · post-card
│   testimonial-slider · cta-band · lead-form · newsletter-form
│   toc-sidebar (scroll-spy) · reading-progress · back-to-top
│   prose-block · callout-box
│   lottie-loop        ← [C]
│   youtube-lite       ← [C]
│   insta-grid         ← [C]
│
└── learn/                            ← [C] unless noted
    video-player · curriculum-tree (lock states) · progress-ring
    quiz-runner · result-panel
    certificate-card   ← [B]
    verify-result      ← [B]
```

---

## LIBRARY: lib/

```
lib/
├── schemas/            ← [owner of each route] Zod, one file per API boundary
│   checkout.ts · leads.ts · progress.ts · assessment.ts · auth.ts · certificate.ts
│
├── auth.ts             ← [B] Auth.js v5 config, providers, callbacks
├── session.ts          ← [B] getSession(), requireSession()  → CONTRACT for C
├── enrollment.ts       ← [B] isEnrolled(userId, courseId)     → CONTRACT for C
├── razorpay.ts         ← [B] client + HMAC verify (timingSafeEqual)
├── certificate.ts      ← [B] certId generation + PDF render
│
├── db.ts               ← [A] Prisma singleton
├── response.ts         ← [A] apiResponse() — ALL routes use this
├── sanity.ts           ← [A] client + typed GROQ helpers
├── seo.ts              ← [A] JSON-LD builders
│
├── unlock.ts           ← [C] ★ THE CORRECTNESS CORE — two reviewers required
├── stream.ts           ← [C] Cloudflare Stream signed-token minting
├── progress.ts         ← [C] heartbeat clamping + completion math
│                            exports getCourseProgress() → CONTRACT for B
├── grading.ts          ← [C] server-side scoring + topic feedback
└── ratelimit.ts        ← [A] Upstash wrappers per endpoint
```

**`lib/unlock.ts` is the single authority for gating.** Every route that reveals content calls
`computeUnlockState(userId, courseId)`. No route re-implements a gate inline.

---

## SANITY: sanity/

```
sanity/
├── schemas/            ← [A]
│   course.ts · chapter.ts · module.ts · question.ts
│   post.ts · service.ts · poshSection.ts · faq.ts
│   testimonial.ts · siteSettings.ts · index.ts
├── desk-structure.ts   ← [A] custom Studio nav so the client is not lost
└── env.ts
```

---

## OTHER

```
prisma/schema.prisma    ← [A] owns file; migrations owned by the model's owner
emails/                 ← [B] React Email templates (verify, reset, welcome, receipt)
                             [A] owns lead-magnet + compliance-report templates
public/lottie/          ← [C] a-harassment.json · b-complaint-journey.json · c-who-protected.json
tests/
├── unit/               ← unlock.test.ts [C] · grading.test.ts [C] · certId.test.ts [B]
├── integration/        ← webhook-idempotency [B] · cert-idempotency [B] · sanity-sync [A]
└── e2e/                ← full-journey.spec.ts [all] · a11y.spec.ts [all]
.github/workflows/ci.yml← [A] typecheck → lint → test → build → forbidden-grep → Lighthouse
```

---

## FILE CREATION ORDER (follows tasks.md phases)

```
1.  package.json, tsconfig, tailwind.config, globals.css      P1  [A]
2.  prisma/schema.prisma + first migration                    P1  [A]
3.  lib/db.ts, lib/response.ts, lib/schemas/                  P1  [A]
4.  components/ui/*, components/marketing/header|footer       P1  [A]  → H1
5.  sanity/schemas/*, app/studio, api/webhooks/sanity         P2  [A]  → H2
6.  app/(marketing)/* + legal pages                           P3  [A]  → unblocks P7-06
7.  app/(marketing)/posh-act                                  P4  [A]
8.  blog, faq, lead magnet, compliance check                  P5  [A]  → SHIP STAGE 1
9.  lib/auth.ts, lib/session.ts, app/(auth)/*, middleware.ts  P6  [B]  → H3
10. lib/razorpay.ts, api/checkout, api/webhooks/razorpay      P7  [B]  → H4
11. lib/stream.ts, lib/unlock.ts (+tests FIRST), api/video    P8  [C]
12. lib/progress.ts, api/progress, components/learn/*         P8  [C]
13. lib/grading.ts, api/assessment/*                          P9  [C]  → H5
14. lib/certificate.ts, api/certificate/*, /verify            P10 [B]
15. public/lottie/*, components/marketing/lottie-loop         P11 [C]
16. sitemap, robots, opengraph, JSON-LD                       P12 [A]
```

---

## CURRENT FILE STATUS

Branch `dev-b-commerce` (see `MERGE-NOTES.md` at repo root for merge rules).

### Dev A files — 0 / 34 built by Dev A
> Dev B has PROVISIONAL transcriptions of 10 of them to work offline (package.json,
> tsconfig, next.config, postcss, app/layout, app/globals.css, prisma/schema.prisma,
> lib/db.ts, lib/response.ts, lib/ratelimit.ts) — each carries a `FILE OWNER: DEV A`
> header. Take Dev A's versions on merge per MERGE-NOTES.md §1.

### Dev B files — 21 / 21 code-complete ✅
```
lib/          auth.config.ts · auth.ts · session.ts (H3) · password.ts · tokens.ts
              email.ts · enrollment.ts (H4) · razorpay.ts · invoice.ts · r2.ts
              cert-id.ts · certificate.ts · admin-query.ts
              schemas/auth.ts · schemas/checkout.ts · schemas/certificate.ts
middleware.ts (edge-safe: imports auth.config only, never Prisma)
app/(auth)/   layout · actions · login · signup · verify-email · forgot-password · reset-password
app/(learner)/ layout · actions · dashboard · dashboard/certificates · dashboard/invoices
app/admin/    page · actions
app/(marketing)/verify/[certId]/page.tsx
app/api/      auth/[...nextauth] · checkout/create-order · webhooks/razorpay
              certificate/{issue, [certId]/verify, [certId]/pdf} · invoice/[paymentId]
              dashboard/summary · admin/{enrollments, payments, learners/[id],
              certificate/[certId]/revoke, leads.csv}
components/   auth/* · commerce/{checkout-button, payment-pending-banner}
              learn/certificate-card · marketing/verify-result · admin/revoke-form
              pdf/{invoice-document, certificate-document}
emails/       components/email-layout · verify-email · reset-password · welcome · receipt
tests/        unit/{razorpay-signature, certId, invoice-numbering}
              integration/{webhook-idempotency, cert-idempotency}   — 53 tests green
prisma/migrations/20260725000001_certificate_active_unique/  ★ partial unique index
```
Extra routes beyond CONTRACTS.md (documented in MERGE-NOTES.md): `/api/invoice/[paymentId]`
and `/api/certificate/[certId]/pdf` — authenticated downloads, because R2 objects are
private and are never direct-linked.

### Dev C files — 0 / 18
> `lib/progress.ts` on this branch is a fail-closed STUB so Dev B's dashboard
> typechecks. Dev C's real implementation replaces it — DELETE on merge.
