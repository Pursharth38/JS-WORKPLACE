# Team Division — 3 Developers
> Agent identities: .claude/orchestrate/agents/{platform,commerce,learning,review}-agent.md
> Live board: .claude/orchestrate/tasks.md

**Companion to:** `.claude/ARCHITECTURE.md`, `.claude/documentation/DETAILED-PLAN.md`
**Team:** Dev A, Dev B, Dev C
**Target:** ~7 calendar weeks

---

## 1. Division Principle

The split is by **system boundary, not by page**. Splitting "you do frontend, you do backend" on a project this size produces constant blocking — the frontend dev sits idle waiting for endpoints, then the backend dev sits idle waiting for integration bugs.

Each developer owns a **vertical slice**: schema, API, and UI for their domain. They ship working features independently and integrate at defined contract points.

| Dev | Domain | One-line summary |
|---|---|---|
| **A** | Platform & Content | Foundation, Sanity, all marketing pages, Knowledge Hub, SEO |
| **B** | Identity & Commerce | Auth, Razorpay, enrolment, dashboard, certificates, admin |
| **C** | Learning Engine & Motion | Video, progress, unlock engine, assessments, animations |

**Highest-risk slice is C** (unlock engine and anti-gaming logic). Assign your strongest developer there. Second-highest is B (payment webhooks — where money is lost).

---

## 2. Ownership Matrix

| Area | Owner | Reviewer |
|---|---|---|
| Repo, tooling, CI, Tailwind tokens | A | B |
| Prisma schema (initial) | A | B, C |
| Prisma migrations (ongoing) | Owner of the affected model | Other two |
| Sanity schemas + Studio | A | C (quiz schemas) |
| Sanity → Postgres sync webhook | A | C |
| Marketing pages | A | B |
| Knowledge Hub | A | — |
| Blog, FAQ, lead magnet, self-check | A | B |
| SEO, sitemap, JSON-LD, Lighthouse | A | — |
| Auth.js setup | B | C |
| Razorpay + webhooks | B | A |
| Enrolment, dashboard, invoices | B | C |
| Certificate PDF + verification | B | A |
| Admin panel | B | A |
| Cloudflare Stream + signed tokens | C | B |
| Video player + progress heartbeat | C | B |
| **Unlock engine** | C | A **and** B |
| Assessment engine | C | B |
| Lottie animations | C | A |
| YouTube / Instagram integration | C | A |
| Legal pages (content) | A | Client |
| Security pass | All three | — |

**The unlock engine gets two reviewers.** It is the correctness core of the product — every gating decision, every anti-gaming clamp, every "can this user see this video" check flows through it.

---

## 3. Dev A — Platform & Content

**Owns:** repository foundation, CMS, all public marketing surface, SEO.
**Why this is one person's job:** the Knowledge Hub is the single highest-value asset in the project and needs one person with sustained context on content structure.

### Deliverables

**Foundation (Week 1)**
- Next.js 15 + TypeScript + Tailwind repo
- Design tokens from `Detailed_Plan.md` §4 as Tailwind theme extension
- Layout shell: `Header` (sticky, mega-menu), `Footer`, `WhatsAppFAB`, `Container`
- UI primitives: `Button`, `Input`, `Select`, `Checkbox`, `Card`, `Badge`, `Modal`, `Toast`, `Skeleton`, `Accordion`, `Tabs`
- Prisma schema initial commit + first migration
- CI: typecheck → lint → test → build → **forbidden-claims grep** (`Architecture.md` §2) → Lighthouse CI
- Branch protection, PR template, environment setup docs

**CMS (Week 2)**
- All Sanity schemas: `course`, `chapter`, `module`, `question`, `post`, `service`, `poshSection`, `faq`, `testimonial`, `siteSettings`
- Studio embedded at `/studio`, custom desk structure so the client is not lost
- `/api/webhooks/sanity` — secret verification, structure upsert into Postgres, cache tag revalidation
- Typed GROQ query helpers in `/lib/sanity.ts`
- **Write a one-page "how to edit your site" guide for the client** — this prevents months of support requests

**Marketing (Weeks 2–4)**
- Home, About, Services (`/services`, `/services/[slug]`), Contact, Book Demo
- **Legal pages: Privacy, Terms, Refund Policy** — flag to the team the moment these are live, because Razorpay activation depends on them and blocks Dev B
- `LeadForm` with Zod validation, honeypot, Turnstile, `/api/leads` with Upstash rate limiting
- `Hero`, `StatBand`, `ServiceCard`, `CourseCard`, `PostCard`, `TestimonialSlider`, `CTABand`

**Knowledge Hub (Week 4)**
- `/posh-act` rendering `poshSection` documents grouped and ordered from Sanity
- `TocSidebar` with scroll-spy, deep-linkable anchors, mobile collapsible
- `ReadingProgress`, `BackToTop`
- Inline Sanity-managed CTA bands
- Full JSON-LD

**Content & conversion (Week 5)**
- Blog: list, detail, category, related posts, RSS
- FAQ page with `FAQPage` schema
- Lead magnet (E2): gated checklist PDF, email capture, Resend delivery
- Compliance self-check (E3): 8 questions, scoring, emailed report, demo CTA
- IC Quick-Reference (E4)

**SEO & launch (Week 7)**
- `sitemap.xml`, `robots.txt` generated from Sanity
- Canonicals, per-route OG images
- All JSON-LD verified in Rich Results Test
- Lighthouse ≥90 mobile on Home, Knowledge Hub, Course detail
- Plausible integration

### A's blocking dependencies
None inbound. **A blocks everyone in Week 1** — foundation must land Day 3 or the whole team stalls. Prioritise it above all else.

### A's outbound blockers
- Legal pages block Dev B's Razorpay activation → target Week 3, not Week 6
- Sanity schemas block Dev C's assessment work → target end of Week 2

---

## 4. Dev B — Identity & Commerce

**Owns:** everything involving a user account or money.
**Why:** payment correctness demands one person with complete context. Split payment logic across two people and you get a bug where nobody is sure who owns the fix.

### Deliverables

**Auth (Week 2, after A's foundation)**
- Auth.js v5: credentials + Google OAuth, JWT sessions
- Prisma adapter models: `Account`, `Session`, `VerificationToken`
- Email verification and password reset via Resend + React Email
- `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`
- Edge middleware for `/dashboard`, `/learn`, `/admin` — session checks only, **no Prisma in middleware**
- Rate limiting: 10/15min per IP, 5/15min per email
- **`name` capture at signup, `nameLocked` flag** — certificate carries legal name

**Commerce (Weeks 3–4)**
- `/api/checkout/create-order` — **price read from DB by `courseId`, never from body**
- Razorpay Checkout integration on `/courses/[slug]`
- `/api/webhooks/razorpay` — `crypto.timingSafeEqual` HMAC verification, idempotent enrolment creation, replay-safe
- `Payment` lifecycle: CREATED → PAID / FAILED / REFUNDED
- Invoice PDF (E8) via `@react-pdf/renderer`, stored in R2, GSTIN if registered
- Razorpay account activation — **needs A's legal pages live first**

**Dashboard (Week 4)**
- `/dashboard` — enrolled courses, progress rings, resume CTA
- `/dashboard/certificates`, `/dashboard/invoices`
- Progress data read from C's `ModuleProgress` — coordinate the read shape with C in Week 3

**Certificates (Week 6, after C's assessments)**
- `/api/certificate/issue` — **idempotent**, partial unique index on `(userId, courseId) WHERE revokedAt IS NULL`
- Certificate PDF: learner name, course, date, cert ID, verification URL, QR code, signature image
- Cert ID format: `JSWW-2026-A7K2P9` — human-readable, non-sequential, non-guessable
- `/verify/[certId]` public page + `/api/certificate/:certId/verify`
- **Wording locked to `Architecture.md` §2. Do not improvise here.**

**Admin (Week 6)**
- `/admin` role-gated: enrolments, payments, learner progress, certificate revocation, lead CSV export

### B's blocking dependencies
- A's foundation (Week 1)
- A's legal pages → Razorpay activation (Week 3)
- C's `passed` final-test signal → certificate issuance (Week 6)

### B's outbound blockers
- Auth blocks C's player work → target end of Week 2
- Enrolment blocks C's video token gating → target Week 4

---

## 5. Dev C — Learning Engine & Motion

**Owns:** the correctness core and the visual polish. Highest-risk slice — assign your strongest developer.

### Deliverables

**Video infrastructure (Week 3)**
- Cloudflare Stream account, upload workflow, documented process for the client
- `/api/video/token/:moduleId` — signed token, ≤5 min TTL, re-checks enrolment **and** unlock state every request
- **Never emit a locked module's Stream UID in any RSC payload or JSON response**
- `VideoPlayer` component: HLS playback, resume, captions, keyboard controls

**Progress & unlock engine (Weeks 4–5) — the critical path**
- `lib/unlock.ts` implementing `Architecture.md` §9 exactly
- `/api/progress/heartbeat` — 15-second throttle, **server-clamped `delta ≤ elapsedWallClock × 1.5`**
- Module completes at ≥90% of `durationSeconds` cumulative watched
- `CurriculumTree` with lock states, `ProgressRing`
- `/learn/[courseSlug]` overview and `/learn/[courseSlug]/[moduleId]` player routes

> **Write the unlock truth table as unit tests before writing the implementation.** Every rule in §9, plus adversarial cases: skip-ahead attempt, direct URL to locked module, heartbeat flood, free-preview access without enrolment. This is the one place in the project where test-first is not optional.

**Assessment engine (Week 6)**
- `/api/assessment/:chapterId/start` — randomized question selection from Sanity pool, shuffled options, **`correctOptionId` stripped before serialization**
- `/api/assessment/:attemptId/submit` — **server-side grading only**, returns score + topic feedback, never an answer key
- 80% chapter / 85% final thresholds; 10-min cooldown after two consecutive failures; final test 3 attempts per 24h
- `QuizRunner`, `ResultPanel` with `aria-live`
- `/learn/[courseSlug]/final-test`
- Emits the `passed` signal B consumes for certificate issuance — **agree this contract with B in Week 4**

**Motion & embeds (Week 7)**
- Three Lottie animations per `Detailed_Plan.md` §4.4, each ≤150 KB
- `LottieLoop`: `IntersectionObserver`-gated, pauses offscreen, skipped under `prefers-reduced-motion`
- **Static accessible HTML equivalent under each animation** — the SEO and screen-reader value must be in the DOM
- `YouTubeLite` façade + `/api/youtube/latest` cached 6h with stale fallback
- `InstaGrid` from Sanity-managed post URLs — **not the Basic Display API**

### C's blocking dependencies
- A's foundation (Week 1)
- A's Sanity `question` schema (Week 2)
- B's auth (Week 2)
- B's enrolment (Week 4) — until then, stub enrolment checks behind a feature flag and build against a seeded test enrolment

### C's outbound blockers
- Final-test `passed` signal blocks B's certificates → target Week 6

---

## 6. Timeline

```
        W1        W2        W3        W4        W5        W6        W7
A   ████████  ████████  ████████  ████████  ████████  ░░░░░░░░  ████████
    Foundation Sanity    Marketing Knowledge Blog/FAQ  buffer/   SEO
    +CI        +Studio   +Legal★   Hub       +magnets  content   +Launch

B   ░░░░░░░░  ████████  ████████  ████████  ░░░░░░░░  ████████  ████████
    (waiting)  Auth      Razorpay  Dashboard buffer/   Certs     UAT
                         +Webhook  +Invoices reviews   +Admin    +Fixes

C   ░░░░░░░░  ░░░░░░░░  ████████  ████████  ████████  ████████  ████████
    (waiting)  (waiting) Stream    Unlock    Unlock    Assess-   Lottie
               +schema   +Player   engine    engine    ments     +Embeds
                                             +tests

★ = Legal pages must land Week 3 — Razorpay activation depends on them
```

### Week 1 reality

B and C are genuinely blocked until A's foundation lands. Do not have them idle:

- **B:** Razorpay sandbox account, test the payment flow in isolation, draft React Email templates, write auth Zod schemas.
- **C:** Cloudflare Stream account, upload test videos, verify signed-token flow via curl, **write the unlock engine unit tests against the spec** — tests before the app exists is entirely reasonable here.

A must ship foundation by Day 3. Treat that as a hard commitment.

---

## 7. Integration Contracts

Define these in code **before** they are needed, so nobody blocks on a conversation.

**A → C: Sanity question shape** *(Week 2)*
```ts
type Question = {
  _id: string; text: string
  options: { id: string; text: string }[]
  correctOptionId: string   // NEVER serialized to client
  topic: string; explanation?: string
}
```

**B → C: session and enrolment** *(Week 2)*
```ts
getSession(): { userId: string; role: Role } | null
isEnrolled(userId: string, courseId: string): Promise<boolean>
```

**C → B: progress and completion** *(Week 4)*
```ts
getCourseProgress(userId, courseId): Promise<{
  percentComplete: number
  currentModuleId: string | null
  finalTestPassed: boolean
}>
```

**C → B: final pass signal** *(Week 4, consumed Week 6)*
Certificate issuance reads `AssessmentAttempt` where `chapterId IS NULL AND passed = true`. Both developers agree the query, and B does not duplicate C's grading logic.

---

## 8. Working Agreements

**Branching**
```
main       protected, production
develop    integration, staging deploy
feat/{dev-initial}/{short-name}
```
PRs into `develop`, one approving review required. `develop` → `main` weekly.

**Migrations**
Prisma migrations are the most common source of three-developer conflict. Rule: **announce in the team channel before generating a migration.** One migration in flight at a time. Owner of the model owns the migration.

**Code review**
Cross-review per the ownership matrix. Turnaround under 4 hours during working days. Review for correctness and security first, style second — style is the linter's job.

**Daily sync — 10 minutes, three questions**
1. What did I ship?
2. What am I blocked on, and who unblocks it?
3. Am I about to break a contract another dev depends on?

**Never merge without**
- Typecheck clean, no `any`, no `@ts-ignore`
- Zod validation on any new API boundary
- Loading, empty, and error states
- Mobile tested at 375px
- Keyboard navigable, axe-core clean
- Unit tests on business logic

---

## 9. Shared Responsibility: Security Pass (Week 7)

All three developers, half a day, working through `Architecture.md` §8 together. **No developer tests their own slice** — B tests C's video gating, C tests B's payment flow, A tests both.

| Test | Owner | Expected |
|---|---|---|
| Checkout with tampered `amount` | C tests B | 400 |
| Replay Razorpay webhook | A tests B | No duplicate enrolment |
| Heartbeat `delta: 999999` | B tests C | Clamped |
| Video token for locked module | B tests C | 403 |
| Inspect `/assessment/start` payload | A tests C | No `correctOptionId` |
| Double-submit `/certificate/issue` | C tests B | Same `certId` |
| Direct URL to locked module | A tests C | Redirect, no content in payload |
| Rate limits on all listed endpoints | A | Enforced |

Any failure is a release blocker.

---

## 10. Risk Register

| Risk | Impact | Owner | Mitigation |
|---|---|---|---|
| Client does not deliver Knowledge Hub content | **Highest** — this is the whole SEO strategy | A | Request content in Week 1 with a section-by-section template. Ship fewer sections written well over more sections paraphrased. Never copy the competitor. |
| Foundation slips past Day 3 | Two developers idle | A | Hard commitment. Escalate on Day 2 if at risk. |
| Legal pages slip past Week 3 | Razorpay unactivated, blocks Week 4 | A | Draft from templates in Week 2, client reviews in Week 3. |
| Unlock engine bugs found late | Rework across C and B | C | Truth-table tests written Week 1, before implementation. |
| Client insists on 100%-pass rule | Rework of assessment config | Lead | Get the decision in Phase 0. Config-driven thresholds so it is a value change, not a rewrite. |
| Scope creep from competitor feature envy | Timeline | Lead | `Detailed_Plan.md` §2.4 is the written scope boundary. Every addition is a pricing conversation. |
| Payment webhook race conditions | Money lost or double-enrolment | B | Idempotency keys, unique constraints, replay testing in Week 7. |

---

## 11. If You Drop to Two Developers

Merge C's motion work into A (Lottie and embeds are presentation) and C's engine work into B (both are correctness-critical server logic). Timeline extends to roughly 10 weeks. Do not merge A's Knowledge Hub into anyone — it needs sustained single-owner context.
