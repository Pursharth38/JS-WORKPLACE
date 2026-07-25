# Shared Task Board
> ALL agents read this before starting any work. Single source of truth for done / in-progress / blocked.
> Architecture: ../ARCHITECTURE.md · Schemas: data-model.md · API: ../CONTRACTS.md
>
> ⚠️ CLAUDE PRO: work sequentially, one file at a time — parallel agents will burn your quota.
>    CLAUDE MAX ($100+/mo): parallel sub-agents are viable; follow the agent identity files.

---

## CURRENT SESSION GOAL
**Team:** three developers, split by vertical slice. A = Platform & Content · B = Identity & Commerce ·
C = Learning Engine & Motion. Full detail: `team-division.md` at repo root.
**State:** **DEV A + DEV B ARE MERGED** on branch `integration-a-b` (2026-07-25). Dev A's P1-01
foundation (Next 16.2.11, React 19.2.4, TS strict, Tailwind v4) plus Dev B's code-complete Phases 6, 7
and 10 (auth, commerce, certificates, admin). Dev C's lane has not started.
Dev A's two Phase-0 deliverables are built and ready to send (P0-03 colour boards, P0-04 content
request); both await the *client*. Six client sign-offs outstanding (P0-01, P0-02, P0-03 pick, P0-04
reply, P0-05, P0-06).
**Next action:** (1) send P0-03 + P0-04 to the client — P0-01 gates SHIPPING certificates and P0-05
gates GSTIN on invoices, both of which are otherwise code-complete; (2) Dev A's next runnable task is
**P1-07 CI** or **P1-04 UI primitives** (P1-05 and P1-06 are now *review* tasks, not build tasks — see
below); (3) Dev C builds against Dev B's published H3 (`lib/session.ts`) and H4 (`lib/enrollment.ts`)
contracts, which are implemented and not stubbed; (4) run `/cso` on the payment path (P7-R).
**Blocking dependency:** client must supply original Knowledge Hub content. Still the single highest risk
in the project. P0-04 mitigates it by splitting delivery into 3 waves (Wave 1 = 14 sections unblocks the
build) and offering voice-note/interview routes so the request does not depend on her finding writing time.
**Merge note:** `MERGE-NOTES.md` at repo root is Dev B's handover and is still the reference for *why*
things are where they are. The `## MERGE RESOLUTION` section appended to it records what Dev A actually
did, including the two places Dev A deviated from Dev B's instructions.
**Environment note:** gstack was missing and is now installed globally (`~/.claude/skills/gstack`, team
mode). It needs `bun`, which was also installed. Skills require a Claude Code restart to register.

---

## HOW TO USE
1. Find the first ⬜ in the current phase → mark 🔄 before touching a file → complete → mark ✅ → next.
2. Blocker: mark ❌, log it in BLOCKED TASKS, stop.
3. Status: ⬜ not started · 🔄 in progress · ✅ done · ❌ blocked

---

## ARCHITECTURE LOCK (decisions that gate everything below)
- **B2C only** — no organizations, seats, or bulk invites in v1. `Enrollment` is a separate table so a
  B2B layer can be added later without a migration.
- **Sanity owns content; Postgres owns state.** Postgres mirrors only `sanityId`/`order`/`videoUid`.
- **Cloudflare Stream** with signed tokens ≤5 min. Never direct S3 MP4, never unlisted YouTube for paid.
- **Server is the only authority** on unlock, price, grading, and enrolment.
- **Enrolment is webhook-only**, HMAC-verified.
- **No false authority claims** — forbidden-string grep runs in CI.
- **Thresholds are data**, not code: chapter 80%, final 85%, stored on Chapter/Course.

---

## PHASE 0 — SIGN-OFFS & DISCOVERY (blocks everything)
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P0-01 | Client sign-off: certificate wording | Lead | ⬜ | "Certificate of Completion — POSH Awareness Training". Blocks Phase 10. |
| P0-02 | Client sign-off: 80% pass threshold | Lead | ⬜ | Explain brute-force problem. Blocks Phase 9. |
| P0-03 | Colour boards A (Deep Teal) + B (Indigo) → client picks | **A** | ✅ | Built `design/colour-boards/index.html` (static, identical layout both boards) + measured `CONTRAST-REPORT.md`. **Awaiting client pick — still blocks P1-02.** |
| P0-04 | Content inventory request — Knowledge Hub section template | **A** | ✅ | Built `client/P0-04-content-inventory-request.md` + `client/knowledge-hub-section-template.md`. Split 35 sections into 3 waves; Wave 1 = 14. **Awaiting send + client reply.** |
| P0-05 | Confirm price, GST registration, coupon codes y/n | Lead | ⬜ | Blocks Phase 7. |
| P0-06 | Decide Instagram: live API vs Sanity-managed grid | Lead | ⬜ | Recommend Sanity grid; API token dies every 60d. |

## PHASE 1 — FOUNDATION  [Dev A — must land Day 3]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P1-01 | Next.js 16 + TS strict + Tailwind v4 repo | **A** | ✅ | Scaffolded in place. `npm run build` / `typecheck` / `lint` all clean. Fonts (Fraunces + Inter) self-hosted via next/font. **No palette committed** — globals.css `@theme` holds typography only. |
| P1-02 | Design tokens → `@theme` in app/globals.css | **A** | ❌ | Blocked on P0-03 board pick. Tailwind v4 is CSS-first — no `tailwind.config.ts`. ⚠️ A **provisional Board A palette is already committed** post-merge because Dev B's lane needs `--brand-*` defined. Edit only the SEMANTIC block. Inputs: ARCHITECTURE §14 + `design/colour-boards/CONTRAST-REPORT.md` |
| P1-02b | Retire legacy colour-named aliases (`--brand-teal` → `--brand-primary`) | **A** | ⬜ | Mechanical sed over 164 refs / 25 Dev B files. Do after P1-02 lands, not before. |
| P1-03 | Layout shell: Header, Footer, WhatsAppFAB, Container | **A** | ❌ | Palette-dependent → blocked on P1-02. **This is the H1 Day-3 commitment.** Note B and C are *no longer hard-blocked* by it — B shipped without it and C has H3/H4. |
| P1-04 | UI primitives (Button, Input, Select, Checkbox, Card, Badge, Modal, Toast, Skeleton, Accordion, Tabs) | **A** | ⬜ | ⚠️ Dev B built ad-hoc form/button markup inline in `components/auth/form-fields.tsx` etc. Reconcile: primitives should absorb those, not duplicate them. |
| P1-05 | Prisma schema initial + first migration | **A** | 🔄 | **Changed from build → REVIEW.** Dev B's `prisma/schema.prisma` (271 lines) + 2 migrations were adopted in the merge. Dev A must review and re-own. Dev B's 5 additions are documented in MERGE-NOTES.md §3. |
| P1-06 | lib/response.ts apiResponse() + Zod schema folder | **A** | 🔄 | **Changed from build → REVIEW.** Dev B's `lib/response.ts`, `lib/db.ts`, `lib/ratelimit.ts` and `lib/schemas/{auth,checkout,certificate}.ts` were adopted. `apiResponse()` matches CONTRACTS.md and adds `paginated()`, `apiError()`, `invalidInput()`. Dev A still owes `lib/schemas/leads.ts`. |
| P1-07 | CI: typecheck → lint → test → build → forbidden-claims grep → Lighthouse | **A** | ⬜ | Grep list from CLAUDE.md §1 |
| P1-08 | Branch protection, PR template, .env.example, README setup docs | **A** | ⬜ | |
| P1-R | /plan-design-review on tokens before any page is built | **A** | ⬜ | |

## PHASE 2 — SANITY CMS  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P2-01 | Schemas: course, chapter, module, question | **A** | ⬜ | → **H2: C unblocked on quiz** |
| P2-02 | Schemas: post, service, poshSection, faq, testimonial, siteSettings | **A** | ⬜ | |
| P2-03 | Studio at /studio + custom desk structure | **A** | ⬜ | Exclude from auth middleware matcher |
| P2-04 | /api/webhooks/sanity — secret verify, structure upsert, revalidate | **A** | ⬜ | |
| P2-05 | Typed GROQ helpers in lib/sanity.ts | **A** | ⬜ | |
| P2-06 | Client-facing "how to edit your site" guide | **A** | ⬜ | Prevents months of support requests |

## PHASE 3 — MARKETING PAGES  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P3-01 | Home page | **A** | ⬜ | Lottie slots stubbed; C fills in Phase 11 |
| P3-02 | About | **A** | ⬜ | Real credentials only |
| P3-03 | Services + /services/[slug] | **A** | ⬜ | 8 services, Sanity-driven |
| P3-04 | Contact + Book Demo + LeadForm + /api/leads | **A** | ⬜ | Unticked consent, honeypot, Turnstile, rate limit |
| P3-05 | **Legal: /privacy, /terms, /refund-policy** | **A** | ⬜ | → **BLOCKS B's Razorpay activation. Week 3, not launch week.** |
| P3-06 | Marketing components (Hero, StatBand, ServiceCard, CourseCard, PostCard, TestimonialSlider, CTABand) | **A** | ⬜ | |

## PHASE 4 — KNOWLEDGE HUB  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P4-01 | /posh-act rendering poshSection grouped + ordered | **A** | ⬜ | 11 groups — see feature-inventory/knowledge-hub.md |
| P4-02 | TocSidebar with scroll-spy + deep anchors | **A** | ⬜ | Anchors are shared links; never rename after launch |
| P4-03 | ReadingProgress + BackToTop + mobile collapsibles | **A** | ⬜ | |
| P4-04 | Inline Sanity-managed CTA bands | **A** | ⬜ | |
| P4-05 | JSON-LD: Article + FAQPage + BreadcrumbList | **A** | ⬜ | |

## PHASE 5 — CONTENT & CONVERSION  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P5-01 | Blog list, detail, category, related, RSS | **A** | ⬜ | |
| P5-02 | FAQ page + FAQPage schema | **A** | ⬜ | |
| P5-03 | Lead magnet: gated checklist PDF + Resend delivery | **A** | ⬜ | E2 |
| P5-04 | /posh-compliance-check — 8 questions, score, emailed report | **A** | ⬜ | E3 — highest-converting asset |
| P5-05 | IC Quick-Reference tables | **A** | ⬜ | E4 |
| P5-R | /qa on the marketing site — **SHIP STAGE 1 HERE** | **A** | ⬜ | Let it start ranking while LMS is built |

## PHASE 6 — AUTH  [Dev B]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P6-01 | Auth.js v5: credentials + Google, Prisma adapter models | **B** | ✅ | Split config: `lib/auth.config.ts` edge-safe, `lib/auth.ts` node-only. Constant-time password compare so login cannot enumerate accounts. |
| P6-02 | Email verification + password reset (Resend + React Email) | **B** | ✅ | Tokens stored as sha256, single-use, atomic claim. Separate `PasswordResetToken` model — reusing `VerificationToken` would be an account-takeover path. |
| P6-03 | /login /signup /verify-email /forgot-password /reset-password | **B** | ✅ | Email confirm is POST-on-click, not GET-on-render — Outlook Safe Links would otherwise burn every token before the learner clicks. |
| P6-04 | Edge middleware for /dashboard /learn /admin | **B** | ✅ | Session + redirect only. `/studio` excluded. Self-check grep for Prisma in middleware: clean. |
| P6-05 | Rate limits: 10/15min per IP, 5/15min per email | **B** | ✅ | Both checked on login; also signup/IP and reset/email. Fails open when Upstash is unset (dev/CI) — it fronts routes that each enforce their own auth. |
| P6-06 | name capture + nameLocked flag | **B** | ✅ | → **H3 PUBLISHED: `lib/session.ts` exports `getSession`/`requireSession`/`requireAdmin`. Dev C can build against it now.** |

## PHASE 7 — COMMERCE  [Dev B]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P7-01 | /api/checkout/create-order — **price from DB** | **B** | ✅ | Body carries `courseId` only — `createOrderSchema` has no amount field to tamper with. Reuses an unpaid order <15min old so abandoned modals don't litter the payments table. |
| P7-02 | Razorpay Checkout on /courses/[slug] | **B** | ✅ | `components/commerce/checkout-button.tsx` — **Dev A must drop this into the course page.** Its success handler only navigates; it never enrols. Script is loaded on click to protect the marketing Lighthouse budget. |
| P7-03 | /api/webhooks/razorpay — timingSafeEqual HMAC, idempotent, replay-safe | **B** | ✅ | → **H4 PUBLISHED: `lib/enrollment.ts` exports `isEnrolled`.** 12 adversarial tests green incl. triple-replay, forged signature, unset secret (fails closed), underpayment. |
| P7-04 | Payment lifecycle CREATED→PAID/FAILED/REFUNDED | **B** | ✅ | `payment.failed` is guarded on `status: CREATED` so a late out-of-order event cannot downgrade a PAID row. **Refund does NOT auto-revoke enrolment — needs a client decision, see OPEN QUESTIONS.** |
| P7-05 | Invoice PDF → R2, GSTIN if registered | **B** | ✅ | Lazy generation on first download, not in the webhook. Invoice numbers atomic per Indian FY via `InvoiceCounter`. GSTIN omitted entirely until P0-05 answers. |
| P7-06 | Razorpay account activation | **B** | ❌ | blocked on P3-05 — **Dev A: this is the long pole.** Razorpay will not leave test mode without live /privacy, /terms, /refund-policy URLs. |
| P7-07 | /dashboard + /dashboard/invoices | **B** | ✅ | Progress read via Dev C's `getCourseProgress()` — not recomputed. `PaymentPendingBanner` polls for the webhook so a paying learner never sees an empty dashboard. |
| P7-R | /cso on payment path — **non-negotiable** | **B** | ⬜ | Ready to run. All 4 commerce self-check greps clean. |

## PHASE 8 — LEARNING ENGINE  [Dev C — critical path]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P8-01 | Cloudflare Stream account + upload workflow + client doc | **C** | ⬜ | |
| P8-02 | /api/video/token/:moduleId — signed ≤5min, re-checks enrol + unlock | **C** | ⬜ | |
| P8-03 | **lib/unlock.ts — truth-table unit tests FIRST, then implementation** | **C** | ⬜ | Test-first is not optional here |
| P8-04 | /api/progress/heartbeat — 15s throttle, **server-clamped delta** | **C** | ⬜ | |
| P8-05 | VideoPlayer (HLS, resume, captions, keyboard) | **C** | ⬜ | |
| P8-06 | CurriculumTree lock states + ProgressRing | **C** | ⬜ | |
| P8-07 | /learn/[courseSlug] + /learn/[courseSlug]/[moduleId] | **C** | ⬜ | |
| P8-R | /cso on unlock + video gating — **non-negotiable** | **C** | ⬜ | |

## PHASE 9 — ASSESSMENTS  [Dev C]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P9-01 | /api/assessment/:chapterId/start — randomize, shuffle, **strip correctOptionId** | **C** | ❌ | blocked on P0-02 sign-off |
| P9-02 | /api/assessment/:attemptId/submit — **server-grade only** | **C** | ⬜ | Return score + topics, never a key |
| P9-03 | Cooldown + attempt caps | **C** | ⬜ | 10min after 2 fails; final 3/24h |
| P9-04 | QuizRunner + ResultPanel with aria-live | **C** | ⬜ | |
| P9-05 | /learn/[courseSlug]/final-test | **C** | ⬜ | → **H5: B unblocked on certs** |

## PHASE 10 — CERTIFICATES  [Dev B]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P10-01 | /api/certificate/issue — **idempotent**, partial unique index | **B** | 🔄 | **Code complete, tested (double-submit + concurrent race both return one certId). Still ❌-gated on P0-01 sign-off before it may SHIP — wording renders exactly as CLAUDE.md §1 locks it.** |
| P10-02 | Certificate PDF (name, course, date, certId, QR, signature) | **B** | ✅ | runtime='nodejs'. QR links /verify/[certId]. Includes an explicit "not a statutory or government-issued qualification" line. Regenerates deterministically on R2 miss. |
| P10-03 | certId generator JSWW-2026-XXXXXX | **B** | ✅ | Crockford base32 via crypto.randomInt (unbiased). 15 tests incl. uniformity-per-position. `normalizeCertId` decodes O→0, I/L→1 for hand-typed ids. |
| P10-04 | /verify/[certId] public page + API | **B** | ✅ | Unknown id → `valid:false` with HTTP **200**, never 404 (anti-enumeration), + 30/h/IP rate limit. Revoked ≠ unknown in the copy. |
| P10-05 | /dashboard/certificates | **B** | ✅ | Download via authenticated `/api/certificate/[certId]/pdf` — R2 objects are private, never direct-linked. |
| P10-06 | /admin — enrolments, payments, progress, revocation, lead CSV | **B** | ✅ | All guarded by `requireAdmin()` (DB re-read, not the 30-day JWT). CSV export is formula-injection-escaped. Revocation is a guarded status transition, never a delete. |

## PHASE 11 — MOTION & EMBEDS  [Dev C]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P11-01 | Lottie A — what counts as harassment | **C** | ⬜ | ≤150 KB |
| P11-02 | Lottie B — complaint journey with timelines | **C** | ⬜ | Highest value; what people search |
| P11-03 | Lottie C — who the Act protects | **C** | ⬜ | |
| P11-04 | LottieLoop wrapper: IntersectionObserver, reduced-motion | **C** | ⬜ | |
| P11-05 | **Static accessible HTML equivalent under each animation** | **C** | ⬜ | SEO value must be in the DOM |
| P11-06 | YouTubeLite façade + /api/youtube/latest cached 6h | **C** | ⬜ | Never the standard iframe |
| P11-07 | InstaGrid from Sanity post URLs | **C** | ⬜ | NOT the Basic Display API |

## PHASE 12 — HARDENING  [all three]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P12-01 | sitemap.xml + robots.txt from Sanity | **A** | ⬜ | |
| P12-02 | Canonicals + per-route OG images + **re-enable `typedRoutes`** | **A** | ⬜ | Uncomment `typedRoutes` in next.config.ts and drive the DANGLING ROUTES table to empty. It was disabled during the A+B merge. |
| P12-03 | All JSON-LD verified in Rich Results Test | **A** | ⬜ | |
| P12-04 | Lighthouse ≥90 mobile on Home, Hub, Course detail | **A** | ⬜ | |
| P12-05 | **Security pass — cross-owner, see review-agent.md** | all | ⬜ | No dev tests their own slice |
| P12-06 | axe-core clean on every public route | all | ⬜ | |
| P12-07 | Playwright E2E: signup→pay→watch→assess→final→cert→verify | all | ⬜ | |

## PHASE 13 — LAUNCH
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P13-01 | Content load into Sanity with client | **A** | ⬜ | |
| P13-02 | Client UAT on staging | all | ⬜ | |
| P13-03 | /ship | Lead | ⬜ | |

---

## BLOCKED TASKS LOG
| ID | Blocked on | Owner | Logged |
|----|-----------|-------|--------|
| P7-06 | P3-05 legal pages live (Razorpay activation requirement) | B | pre-start |
| P9-01 | P0-02 client sign-off on 80% threshold | C | pre-start |
| P10-01 | P0-01 client sign-off on certificate wording | B | pre-start |
| P4-01 | P0-04 client-supplied Knowledge Hub content | A | pre-start |
| P1-02 | P0-03 client pick of colour board — boards delivered 2026-07-25, awaiting decision | A | 2026-07-25 |
| P1-03 | P1-02 tokens (Header/Footer/FAB are palette-dependent) — **this is the H1 Day-3 handoff to B and C** | A | 2026-07-25 |
| **P8-04** | **★ MERGE DEBT — `lib/progress.ts` is Dev B's fail-closed STUB, not a real implementation.** MERGE-NOTES.md §2 said delete it; Dev A kept it because 3 merged Dev B call sites import `getCourseProgress` and deleting it breaks `next build` for all of Phase 8. It returns 0% / no current module / final test NOT passed, so it cannot wrongly unlock anything or show a certificate CTA. **Dev C must overwrite this file, not merge into it.** | C | 2026-07-25 |

---

## DANGLING ROUTES  (found by `typedRoutes` during the A+B merge, 2026-07-25)

Dev B's merged UI links to 7 routes that do not exist yet. These are **not typos** — they
are planned routes whose owners haven't built them. `typedRoutes` was turned OFF in
`next.config.ts` because keeping it on mid-build forces fake stubs or `as Route` casts
that rot. **P12-02 must re-enable it and drive this table to empty before launch.**

| Route | Linked from | Owner | Lands in |
|---|---|---|---|
| `/privacy` | `app/(auth)/layout.tsx`, `components/auth/signup-form.tsx` | A | P3-05 |
| `/terms` | `app/(auth)/layout.tsx`, `components/auth/signup-form.tsx` | A | P3-05 |
| `/refund-policy` | footer links | A | P3-05 |
| `/contact` | `app/(auth)/layout.tsx`, `verify/[certId]`, `certificate-card` | A | P3-04 |
| `/courses` | `app/(learner)/dashboard/page.tsx` | A | P3 |
| `/posh-act` | `app/(learner)/dashboard/page.tsx` | A | P4-01 |
| `/learn/[courseSlug]` | dashboard, `checkout-button` | C | P8-07 |

---

## OPEN BUGS
None — nothing built yet.

---

## DECISIONS LOG
| Date | Decision | Rationale |
|---|---|---|
| pre-start | B2C only for v1 | Client answer. Enrollment kept as a join table so B2B can be added later without migration. |
| pre-start | Cloudflare Stream over S3/Mux/YouTube | ABR on Indian mobile networks; ~₹500–1500/mo at expected volume; S3 needs a transcoding pipeline; YouTube cannot be payment-gated. |
| pre-start | Sanity full CMS | Client answer — she edits blogs, POSH content, services, and quiz questions herself. |
| pre-start | Assessment 80% not 100% | 100% + unlimited instant retries is brute-forced in two attempts. Pending client sign-off (P0-02). |
| pre-start | Instagram = Sanity grid, not API | Basic Display token expires every 60 days and fails silently on a weekend. |
| pre-start | Plausible over GA4 | Cookieless — no DPDP consent banner needed. |
| pre-start | Ship marketing site before LMS | SEO compounds over months; content should not wait on a video player. |
| 2026-07-25 | Ink `#101828` on Amber fills, never white | **Measured:** white-on-Amber `#C77D26` = 3.29:1, fails AA. Ink-on-Amber = 5.40:1, passes at any size. Keeps the client-approved accent unchanged; only the label colour moves. See `design/colour-boards/CONTRAST-REPORT.md` Finding 2. |
| 2026-07-25 | Add Amber 700 `#9C5D1C` for amber TEXT | Amber 500 is unusable below 18px (3.13:1). Without a compliant darker step the palette gets improvised at build time. 5.00:1 on Sand. Finding 3. |
| 2026-07-25 | Focus ring = Deep Teal, not Amber | Non-text UI needs 3:1. Amber on Sand is 3.13:1 — too thin a margin for a focus indicator. Deep Teal is 8.44:1. |
| 2026-07-25 | Knowledge Hub content requested in 3 waves | 35 sections in one ask is the likeliest way to get nothing. Wave 1 (14 sections) covers 6 of 8 target long-tail terms and unblocks the Phase 4 build on its own. Voice-note and interview routes offered as first-class alternatives. |
| 2026-07-25 | Board B's Indigo 600 / Indigo 50 are **ours, not the client's** | `DETAILED-PLAN.md` §4.1 specifies only Indigo/Clay/Cream. A palette needs an interactive state and a tint to be presentable, so Dev A derived them. Flagged in the comp; needs explicit confirmation if Board B wins. |
| 2026-07-25 | **Next 16 + Sanity 6 + Tailwind 4**, raising CLAUDE.md's Next 15 / Sanity v3 pins | Forced, not preference: `next-sanity@13` declares `next: ^16.0.0-0`. Next 15 caps us at `next-sanity@11` + Sanity v4/v5, and Sanity v3 is unreachable from any current `next-sanity`. Auth.js v5 supports `^14 \|\| ^15 \|\| ^16` so it didn't constrain the choice. Raised at zero app code — the cheapest moment. Signed off by lead. |
| 2026-07-25 | Tailwind v4 → **no `tailwind.config.ts`** | v4 is CSS-first; tokens live in the `@theme` block in `app/globals.css`. This matches what codebase.md already said ("globals.css ← CSS variables from design tokens"). Doc references to `tailwind.config.ts` were corrected. |
| 2026-07-25 | `noUncheckedIndexedAccess` on in tsconfig | Beyond plain `strict`. `lib/unlock.ts` indexes chapters and modules by order; an unchecked undefined there is a *gating* bug, not a crash. Costs Dev B and C a few non-null narrowings; buys compile-time safety on the correctness core. |
| 2026-07-25 | `typedRoutes: true` in next.config.ts | The route namespacing table is a contract between three devs. This turns a mistyped `href` into a compile error instead of a 404 found in QA. |
| 2026-07-25 | **A+B merge:** 6 borrowed files replaced with Dev A's, **4 adopted** | Dev B transcribed 10 Dev-A-owned files to work offline. Replaced: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`. Adopted as-is because Dev A had not built them and Dev B's versions are correct and load-bearing: `lib/db.ts`, `lib/response.ts`, `lib/ratelimit.ts`, `prisma/schema.prisma`. "Borrowed" only means "wrong owner", not "wrong code" — deleting working code to rebuild it identically is waste. P1-05/P1-06 became review tasks. |
| 2026-07-25 | **Kept `lib/progress.ts`, against MERGE-NOTES.md §2** | Dev B said delete it. Three merged Dev B call sites import `getCourseProgress`, and Dev C's lane has not started, so deleting it breaks `next build` for the whole of Phase 8. The stub is fail-closed (0%, final test NOT passed) so it cannot wrongly unlock content. Logged as merge debt against P8-04 instead. A tree that does not compile is not a merged tree. |
| 2026-07-25 | **Provisional Board A palette committed to `globals.css`** — reversing the "no palette before P0-03" rule | Forced by the merge: Dev B's lane carries **164 `var(--brand-*)` references across 25 files**. Leaving them undefined ships a colourless UI. Mitigated by splitting the file into a SEMANTIC block (`--brand-primary`, `--brand-accent`, …) that P1-02 edits, plus colour-named aliases (`--brand-teal` → `--brand-primary`) so Dev B's files never change. If Board B (Indigo) wins, only this one file moves. |
| 2026-07-25 | Corrected Dev B's placeholder token values back to spec | Dev B's transcription had drifted warm: ink `#1c1a17` (spec `#101828`), muted `#5f5a52` (spec Slate `#475467`), line `#e4ded4` (spec Border `#E4E7EC`), plus non-spec success/danger. Restored to the CLAUDE.md values. |
| 2026-07-25 | **Fixed white-on-amber in Dev B's `.cta-amber`** | Dev B's placeholder set `color: #fff` on an amber fill — 3.29:1, fails AA. Exactly the P0-03 Finding 2 defect. Now `var(--brand-accent-on)` = Ink, 5.40:1. The class is currently unused, so this was a latent trap rather than a live bug. |
| 2026-07-25 | Fixed fonts silently breaking across the merge | Dev B's `globals.css` set `--font-heading: 'Fraunces'` by family *name*, and 3 merged files use it via `font-[family-name:var(--font-heading)]`. next/font self-hosts under generated names and never registers `'Fraunces'`, so post-merge those headings would have silently fallen back to Georgia. `--font-heading` / `--font-body` now point at Dev A's `--font-fraunces` / `--font-inter`. |
| 2026-07-25 | `npm audit` high-severity findings **accepted, not fixed** | 12 highs, all transitive through `next` itself (postcss, sharp) and the eslint chain (brace-expansion→minimatch). `npm audit fix --force` resolves them by installing **next@9.3.3**. Nothing is exploitable in our usage — build-time tooling, not request path. Revisit when Next ships bumped deps; do not run `--force`. |
