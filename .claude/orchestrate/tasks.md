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
**State:** PRE-PHASE-0. Nothing built. Three client sign-offs outstanding (see BLOCKED TASKS).
**Next action:** get the Phase 0 sign-offs, then Dev A ships the foundation by Day 3 — B and C are
genuinely blocked until it lands.
**Blocking dependency:** client must supply original Knowledge Hub content. This is the single highest
risk in the project; the SEO strategy has no fallback if it does not arrive.

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
| P0-03 | Colour boards A (Deep Teal) + B (Indigo) → client picks | **A** | ⬜ | Static comps, not a live site. Blocks Phase 1. |
| P0-04 | Content inventory request — Knowledge Hub section template | **A** | ⬜ | Send Week 1. Highest project risk. |
| P0-05 | Confirm price, GST registration, coupon codes y/n | Lead | ⬜ | Blocks Phase 7. |
| P0-06 | Decide Instagram: live API vs Sanity-managed grid | Lead | ⬜ | Recommend Sanity grid; API token dies every 60d. |

## PHASE 1 — FOUNDATION  [Dev A — must land Day 3]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P1-01 | Next.js 15 + TS strict + Tailwind repo | **A** | ⬜ | |
| P1-02 | Design tokens → Tailwind theme extension | **A** | ⬜ | From ARCHITECTURE §14 |
| P1-03 | Layout shell: Header, Footer, WhatsAppFAB, Container | **A** | ⬜ | → **H1: B and C unblocked** |
| P1-04 | UI primitives (Button, Input, Select, Checkbox, Card, Badge, Modal, Toast, Skeleton, Accordion, Tabs) | **A** | ⬜ | |
| P1-05 | Prisma schema initial + first migration | **A** | ⬜ | Reviewed by B and C before applying |
| P1-06 | lib/response.ts apiResponse() + Zod schema folder | **A** | ⬜ | |
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
| P6-01 | Auth.js v5: credentials + Google, Prisma adapter models | **B** | ⬜ | |
| P6-02 | Email verification + password reset (Resend + React Email) | **B** | ⬜ | |
| P6-03 | /login /signup /verify-email /forgot-password /reset-password | **B** | ⬜ | |
| P6-04 | Edge middleware for /dashboard /learn /admin | **B** | ⬜ | Session only — NO Prisma in middleware |
| P6-05 | Rate limits: 10/15min per IP, 5/15min per email | **B** | ⬜ | |
| P6-06 | name capture + nameLocked flag | **B** | ⬜ | → **H3: C unblocked** |

## PHASE 7 — COMMERCE  [Dev B]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P7-01 | /api/checkout/create-order — **price from DB** | **B** | ⬜ | |
| P7-02 | Razorpay Checkout on /courses/[slug] | **B** | ⬜ | |
| P7-03 | /api/webhooks/razorpay — timingSafeEqual HMAC, idempotent, replay-safe | **B** | ⬜ | → **H4: C unblocked on gating** |
| P7-04 | Payment lifecycle CREATED→PAID/FAILED/REFUNDED | **B** | ⬜ | |
| P7-05 | Invoice PDF → R2, GSTIN if registered | **B** | ⬜ | E8 |
| P7-06 | Razorpay account activation | **B** | ❌ | blocked on P3-05 |
| P7-07 | /dashboard + /dashboard/invoices | **B** | ⬜ | Progress read shape agreed with C |
| P7-R | /cso on payment path — **non-negotiable** | **B** | ⬜ | |

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
| P10-01 | /api/certificate/issue — **idempotent**, partial unique index | **B** | ❌ | blocked on P0-01 sign-off |
| P10-02 | Certificate PDF (name, course, date, certId, QR, signature) | **B** | ⬜ | runtime='nodejs' |
| P10-03 | certId generator JSWW-2026-XXXXXX | **B** | ⬜ | Non-sequential, non-guessable |
| P10-04 | /verify/[certId] public page + API | **B** | ⬜ | E1 — makes the cert worth anything |
| P10-05 | /dashboard/certificates | **B** | ⬜ | |
| P10-06 | /admin — enrolments, payments, progress, revocation, lead CSV | **B** | ⬜ | |

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
| P12-02 | Canonicals + per-route OG images | **A** | ⬜ | |
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
