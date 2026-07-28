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
**State:** **DEV A IS COMPLETE** except SEO (deferred by direction) and two gstack gates that
need a Claude Code restart. Dev A + Dev B are merged and green on `integration-a-b`:
build (36 routes), typecheck, lint, 57 tests, and all four CI grep gates pass.
Dev C's Learning Engine lane (Phase 8/9 — unlock engine, video gating, assessments) has NOT
started and is out of scope for this project's two active developers. **Phase 11 (motion &
embeds) is now done**, per team-division.md §11's own guidance for a two-developer drop
("merge C's motion work into A") — done this session instead by Dev B, in Dev A's stead, since
neither A nor B was otherwise occupied with it and it does not touch the correctness core.
**2026-07-26 session (Dev B):** pulled `origin/integration-a-b` into local `main`
(fast-forward, unpushed pending user decision) and re-verified green: typecheck, lint, 57/57
tests, 42-route build, forbidden-claims grep, gated-content leak grep all clean. Closed out the
small leftover items from MERGE-NOTES.md §7: `middleware.ts` → `proxy.ts` (Next 16 deprecation,
confirmed the build warning is gone), `CONTRACTS.md` now documents `/api/invoice/[paymentId]`
and `/api/certificate/[certId]/pdf`, and P1-05a is half-decided — `Certificate.user` /
`Payment.user` (Dev B's models) now declare explicit `onDelete: Restrict` (confirmed a no-op at
the DB level via `prisma migrate diff`, so no migration needed). `ARCHITECTURE.md §5`
`lastHeartbeatAt` and the `.env.example` WhatsApp note turned out already fixed — those two
MERGE-NOTES.md §7 bullets were stale.
**2026-07-26 session, part 2 (Phase 11):** built all seven P11 tasks — see the Phase 11 table
below for the file-by-file breakdown and the DECISIONS LOG for why none of it is a literal
Lottie JSON file. New: `components/marketing/{harassment-spectrum,workplace-protection,
youtube-lite,insta-grid}.tsx`, `lib/youtube.ts`, `app/api/youtube/latest/route.ts`,
`sanity/schemas/instagramPost.ts`. Wired into `app/(marketing)/page.tsx`. Full verification
(typecheck/lint/57 tests/46-route build + both security greps) clean, plus live visual QA via
gstack `/browse` at 1280px and 375px viewports — no overlap, no clipping, both new sections
render correctly, and the YouTube/Instagram strip correctly renders nothing when unconfigured.
**2026-07-26 session, part 3 (client-directed redesign):** full palette repalette (Deep
Teal/Amber → warm cream/bronze light theme + navy/gold dark theme, see CLAUDE.md "Frontend"
and `app/globals.css` header), a real dark mode with a `<html data-theme>` toggle
(`components/ui/theme-toggle.tsx`) including a View Transitions API circular-reveal animation
on flip, `components/motion/border-beam.tsx` (rotating gradient hover ring, applied to
ServiceCard/CourseCard), a new `HowItWorks` sequential connection-diagram section
(`components/marketing/how-it-works.tsx`) answering the "animated cards popping in one after
another" request, a dark navy/gold `ComplianceStatBand` (statutory facts, not business metrics
— see its own header comment on why it's exempt from the never-invent-a-number rule that
governs StatBand), orbiting decorative motion in the Hero background, and
`NEXT_PUBLIC_FORCE_DEMO` for previewing the redesign against placeholder content without
touching the real seeded Sanity project. **Found and fixed a real contrast bug class while
repaletting**: making `--brand-accent`/`--brand-danger`/`--brand-warning`/`--brand-success`
theme-aware broke ~10 components that paired them with a hardcoded `text-white` or a hardcoded
pale hex background — see `app/globals.css`'s `-on` and `-soft` token comments for the full
list of what was fixed and why `--brand-primary` deliberately stays theme-constant. Also wrote
`.claude/documentation/CMS-MIGRATION-PLAN.md` — a proposed (not approved, not started)
architecture for moving blog/course/service content off Sanity into a custom `/admin` UI over
Postgres, requested in the same session. `CLAUDE.md`'s "Sanity owns content" rule is unchanged
until that plan is reviewed.
**Dev A remaining:** P1-R and P5-R (both gstack — `/plan-design-review`, `/qa` — blocked on a
restart), P4-05 + P12-01..04 (SEO, deferred by direction), P13-01 (needs client content).
**Dev B remaining:** P7-R (`/cso` on the payment path, non-negotiable per CLAUDE.md — ready to
run, not run this session), P7-06 Razorpay activation (external KYC on Razorpay's dashboard —
not something a coding session can do), ModuleProgress/AssessmentAttempt and Enrollment halves
of P1-05a (owner: Dev C / undecided — do not touch, see prisma/schema.prisma header).
**Unblocked by Dev A this session:** P7-06 Razorpay activation (legal pages are live) and
H2 for Dev C (Sanity question schema).
**Blocking dependency:** client must supply original Knowledge Hub content. Largely superseded —
see the 2026-07-26 CMS migration entry below: 8 real POSH Hub sections now exist and are ready
to migrate off Sanity, so this is no longer a zero-content blocker, though more sections are
still welcome.
**Merge note:** `MERGE-NOTES.md` at repo root is Dev B's handover; its `## MERGE RESOLUTION`
section records what Dev A actually did, including three deliberate deviations.
**Environment note:** gstack was missing and is now installed globally (`~/.claude/skills/gstack`, team
mode). It needs `bun`, which was also installed. Skills require a Claude Code restart to register.

**2026-07-28 session (admin publish toggles + entry animation + About section):** three
client-directed changes on `integration-a-b`.
1. **Publish toggles.** `/admin/courses`, `/admin/faq` and `/admin/testimonials` showed a static
   `PublishBadge` where `/admin/blog` had a working switch. Added a `togglePublish` server action
   to each (`toggleCoursePublish` on courses, to avoid colliding with the chapter/module exports
   in the same file) and swapped in `PublishToggle`. `PublishToggle` gained `disabled` +
   `disabledReason`: a testimonial with no written permission on file cannot be published from the
   list, and the server action refuses it independently — the list view bypasses the form, so the
   consent rule `saveTestimonial` enforces had to be restated on that path.
2. **Entry animation** (`components/marketing/site-intro.tsx` + the `SITE INTRO CURTAIN` block in
   `app/globals.css`), ported from the `Pursharth38/JS-workplace-wellness` Vite prototype's
   `Loader.jsx`. Mounted in `app/(marketing)/layout.tsx` — public pages only, never over
   `/dashboard` or `/learn`. **Rebuilt as pure CSS on a server component.** The prototype gated the
   entire router behind `{loaderDone && <Routes/>}`, so a 3.2s JS timer withheld every pixel of
   content from users and crawlers alike and a failed bundle meant a permanently blank page. Here
   the page server-renders underneath from the first byte and the curtain is `pointer-events: none`
   + `aria-hidden` decoration lifted by an `animation-fill-mode: forwards` keyframe — no JS can fail
   to un-render it. Colour comes from `color-mix()` over the semantic tokens, so the mesh follows
   light/dark automatically instead of pinning one theme's hexes. `prefers-reduced-motion` removes
   it entirely; a `sessionStorage` script in `app/layout.tsx` (same shape and rationale as the
   existing theme no-flash script) stamps `data-intro="seen"` so it plays once per visit.
3. **About section** (`components/marketing/about-intro.tsx`, copy in `lib/about.ts`), ported from
   the same prototype's `About.jsx` — portrait, biography, credential chips, on the home page and
   as the `<h1>` block of `/about`. Photo: the prototype's `public/jyoti.jpg`, which is actually a
   **PNG with alpha** despite the extension; copied in as `public/jyoti-solaria.png` so Next serves
   the right `Content-Type`. Choreography (photo from the left, text from the right a beat later,
   chips staggering, desktop-only parallax) is the prototype's; the implementation is `motion` +
   `useInView`/`useScroll`, **not** GSAP + ScrollTrigger — CLAUDE.md pins the animation library and
   a second scroll-animation runtime would be the largest dependency on the marketing bundle.
   **The prototype's copy was deliberately NOT imported:** "India's Leading PoSH Law Expert",
   "certified PoSH law practitioner", and the chips "10+ Years Experience / 500+ Workshops / 50+
   Companies Trained" were all tagged `COPY: client to review` in that repo, i.e. never verified,
   and shipping them would invent credentials and trained-employee counts against CLAUDE.md §1.
   `lib/about.ts` carries the already-reviewed /about wording in the prototype's three-paragraph
   shape, and chips render only under `NEXT_PUBLIC_FORCE_DEMO` as visible `[00]` placeholders —
   the same convention as `DEMO_STATS`. Real headline figures still block on P0-04.
   Verified: typecheck, lint, full production build, both security greps, and `curl` against the
   dev server (curtain SSR'd with the right step count, About section present on both pages,
   portrait served and optimised). **Not visually confirmed** — gstack `/browse` will not start on
   this machine, see the gstack memory note.

**2026-07-26 session, part 4 (CMS migration, branch `cms-migration`):** executed
CMS-MIGRATION-PLAN.md phases M0–M5 plus M6-prep, per the user's approval and the two amendments
recorded above in the DECISIONS LOG (Tiptap JSON storage, not sanitized HTML; stop before
cutover). Summary — full detail is in the plan document's own status header and in the M0–M6
commit history on this branch:
- **M0:** `lib/content.ts` façade created; all 30 non-webhook Sanity import sites rewritten to
  `@/lib/content`. Nothing behind the façade changed yet — purely a seam so every later phase is
  a one-getter swap with zero page churn.
- **M1 (a–e):** Prisma content models for every migrated type (`BlogPost`, `BlogCategory`,
  `Service`, `PoshSection`, `QuickReference`, `Faq`, `Testimonial`, `InstagramPost`,
  `SiteSettingsRow`, `Question`, plus content fields on `Course`/`Chapter`/`Module`) — migration
  `20260726063709_cms_content_models`, applied to Neon. `lib/richtext.ts`: a strict Zod schema is
  the write-side security gate for Tiptap JSON (rejects unknown node types, `javascript:`/`data:`
  hrefs — no sanitizer needed because storage is structured data, not HTML).
  `components/marketing/rich-text.tsx` is the React renderer, reusing `CalloutBox`/`DataTable` so
  those stay real components, not injected markup. `lib/portable-text-to-tiptap.ts` converts with
  warnings instead of silent data loss. Tiptap editor with custom callout/table nodes
  (`components/admin/rich-text-editor.tsx` + `editor/*`). Image pipeline:
  `POST /api/admin/upload` (ADMIN-only, magic-byte sniffed, SVG rejected) +
  `GET /api/images/[...key]` (public, but ONLY serves the `content/` prefix — certificates and
  invoices in the same private R2 bucket stay unreachable by construction). Admin shell:
  `app/admin/layout.tsx` with nav tabs, shared CRUD kit (`components/admin/crud/*`) — fields,
  `SaveBar` with two-step delete (no browser `confirm()`), `ReorderButtons`.
- **M2–M5:** all nine content types migrated with the same **flip rule** everywhere: a type
  serves from Postgres once it has rows there (courses: once *content* exists, since structural
  rows always lived in Postgres from Phase 2), and falls through to the existing Sanity getter
  until then — so the site never had a moment of missing content, and both systems can coexist
  indefinitely. `ProseBlock` now format-detects (Portable Text array vs. Tiptap doc) so pages
  didn't need to change at all. `urlForImage()` now has **zero call sites in components** — every
  image getter resolves to a plain URL before the page ever sees it. Full admin CRUD for all nine
  types plus the course/chapter/module/question tree (`/admin/courses/[id]/[chapterId]/...`).
  Two extra security disciplines worth flagging: (1) POSH Hub/Quick-Reference **anchors are
  permanent public deep links** — the `SlugField` locks them behind an explicit unlock, and the
  server action independently refuses an anchor change on a published row without that unlock's
  confirm flag; (2) the **question editor is the only surface that ever renders `isCorrect`**
  (server-rendered, `requireAdmin`-gated) — list views show counts only, and `videoUid` /
  `correctOptionId` were re-grepped clean outside `lib/unlock`, `api/video`, `api/assessment`,
  and the now-admin-only edit surfaces.
- **M6-prep:** `scripts/migrate-sanity-to-postgres.mts` — reads the live Sanity project over its
  HTTP query API, converts bodies through the *same* `parseRichText` gate the admin editor uses,
  plans/uploads image assets to R2, upserts everything by `sanityId` (idempotent re-runs). Dry
  run is the default and writes nothing; `--execute` refuses to start without R2 configured.
  **Dry run against the live project (`7h7vbi97`) results: 26/26 documents ready, 0 skipped, 0
  warnings** — 1 siteSettings, 3 FAQs, 6 services, 3 posts + 3 categories, 8 POSH sections, 2
  quick-reference cards. 0 testimonials/instagram/courses exist yet in Sanity, so nothing to skip
  there either.
- **Full verification:** `tsc --noEmit` clean, ESLint clean (0 errors, 0 warnings after removing
  3 now-dead imports), 78/78 tests green (were 57 pre-migration; +21 new: richtext write-gate,
  PT→Tiptap converter, image sniffing/prefix-boundary), production `next build` succeeds on every
  route including the new `/admin/*` tree and `/api/images/[...key]`, both mandatory security
  greps (forbidden-claims, gated-content leak) clean.
- **What did NOT happen, deliberately:** the real `--execute` migration run, Sanity Studio
  deletion, the `/api/webhooks/sanity` deletion, and the `sanity`/`@sanity/*` dependency removal.
  Per the approved stop-before-cutover scope, Sanity remains fully live and authoritative for any
  type with zero Postgres rows. Cutover is a separate, explicitly-approved future step.
**Next action (CMS migration):** (1) user reviews the branch and clicks around `/admin`;
(2) when satisfied, run `npx tsx --env-file=.env scripts/migrate-sanity-to-postgres.mts --execute`
to perform the real migration (idempotent — safe to re-run); (3) spot-check the migrated content
on the live site; (4) only then, as an explicit separate decision, decommission Sanity Studio and
the sync webhook and merge `cms-migration` into `main`/`integration-a-b`.

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
| P1-02 | Design tokens → `@theme` in app/globals.css | **A** | ✅ | Full token set: colour, 1.25 type scale, spacing, radius, elevation. ⚠️ Colour values remain PROVISIONAL Board A pending P0-03 — but behind a SEMANTIC block, so the board pick is now a values-only edit of one file. Was blocked on P0-03 board pick; Tailwind v4 is CSS-first — no `tailwind.config.ts`. ⚠️ A **provisional Board A palette is already committed** post-merge because Dev B's lane needs `--brand-*` defined. Edit only the SEMANTIC block. Inputs: ARCHITECTURE §14 + `design/colour-boards/CONTRAST-REPORT.md` |
| P1-02b | Retire legacy colour-named aliases (`--brand-teal` → `--brand-primary`) | **A** | ✅ | Done. 67 refs across 23 files rewritten to the semantic names; alias block removed from globals.css. `--brand-teal` would have become a lie the moment Board B won. |
| P1-03 | Layout shell: Header, Footer, WhatsAppFAB, Container | **A** | ✅ | Container, sticky Header + mobile drawer, Footer, WhatsAppFAB. All contact details from Sanity `siteSettings` — nothing hardcoded. Home moved into `(marketing)` to inherit the shell. **H1 satisfied.** Formerly blocked on P1-02. **This is the H1 Day-3 commitment.** Note B and C are *no longer hard-blocked* by it — B shipped without it and C has H3/H4. |
| P1-04 | UI primitives (Button, Input, Select, Checkbox, Card, Badge, Modal, Toast, Skeleton, Accordion, Tabs) | **A** | ✅ | + Field, Textarea, Honeypot, ConsentCheckbox, Turnstile. Button's `accent` variant is forced to 18px (amber below that fails AA); ConsentCheckbox cannot be pre-ticked. |
| P1-05 | Prisma schema initial + first migration | **A** | ✅ | **REVIEW DONE.** Conforms to ARCHITECTURE §5 + data-model.md, including all 5 Dev B additions. Also CORRECTED ARCHITECTURE.md §5, which was missing `ModuleProgress.lastHeartbeatAt` (Dev B flagged this; it is Dev C's clamp basis). ⚠️ One open finding → **P1-05a**. |
| P1-05a | Referential actions: 8 relations default to `Restrict` | **B**+**C** | 🔄 | Dev A review finding. `db.user.delete()` throws for any learner with progress — and /privacy commits to honouring deletion requests. NOT a blanket fix. **B's half DECIDED 2026-07-26:** `Certificate.user` and `Payment.user` now declare explicit `onDelete: Restrict` (verifiability + GST retention) — confirmed a no-op at the DB level (`prisma migrate diff` against the old schema produced an empty script), so no migration needed. A `/privacy` deletion request must anonymize the `User` row rather than call `db.user.delete()` while certificates/payments exist — no such deletion path is built yet. **Still open:** `ModuleProgress`/`AssessmentAttempt` (Dev C's models — C's lane hasn't started) and `Enrollment` (no clear decision owner). Reasoning is written into prisma/schema.prisma's header. |
| P1-06 | lib/response.ts apiResponse() + Zod schema folder | **A** | ✅ | **Was REVIEW after the merge.** Dev B's `response.ts`/`db.ts`/`ratelimit.ts` adopted; Dev A added `schemas/leads.ts`, `schemas/sanity-webhook.ts`, `lib/turnstile.ts`, `lib/cn.ts`, `lib/posh-groups.ts` and `rateLimit.leadsIp`. |
| P1-07 | CI: typecheck → lint → test → build → forbidden-claims grep → Lighthouse | **A** | ✅ | CI at `.github/workflows/ci.yml`: typecheck → lint → test → build, then FOUR grep gates — forbidden claims (source **and** `.next/server`), gated-content leak, apiResponse envelope, consent pre-tick. All four verified passing locally. Lighthouse deliberately deferred to P12-04: it needs a deployed preview URL, and auditing localhost would produce numbers everyone learns to ignore. |
| P1-08 | Branch protection, PR template, .env.example, README setup docs | **A** | ✅ | PR template with ownership/security/legal/content checklists · `.github/BRANCH_PROTECTION.md` (settings live in GitHub, so they are documented to be reproducible) · `.env.example` rewritten with what is actually optional and why · README setup + deliberate-degradations table. **Removed `NEXT_PUBLIC_WHATSAPP_NUMBER`** — an env var is just a slower hardcode; it lives in Sanity `siteSettings`. |
| P1-R | /plan-design-review on tokens before any page is built | **A** | ⬜ | |

## PHASE 2 — SANITY CMS  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P2-01 | Schemas: course, chapter, module, question | **A** | ✅ | → **H2: C UNBLOCKED on quiz.** `question.options[].isCorrect` documented as never leaving the server; exactly-one-correct is schema-validated. |
| P2-02 | Schemas: post, service, poshSection, faq, testimonial, siteSettings | **A** | ✅ | + category, and reusable `calloutBox` / `dataTable` / `ctaBand` objects. Testimonials require `consentOnFile` — real ones only. |
| P2-03 | Studio at /studio + custom desk structure | **A** | ✅ | Task-shaped nav; `siteSettings` pinned as a singleton so a duplicate can't be created. Confirmed absent from the middleware matcher. |
| P2-04 | /api/webhooks/sanity — secret verify, structure upsert, revalidate | **A** | ✅ | `timingSafeEqual` secret check, structure-only upsert, 409 when a parent isn't synced yet, `revalidateTag`. Node runtime. |
| P2-05 | Typed GROQ helpers in lib/sanity.ts | **A** | ✅ | Typed helpers + cache tags. Degrades to empty content when Sanity is unconfigured so the build stays green pre-launch. |
| P2-06 | Client-facing "how to edit your site" guide | **A** | ✅ | `client/how-to-edit-your-site.md`. Written for her, not for us. Leads with the two irreversible things (Link IDs, testimonial permission) and the two that affect money (price in paise, video length). |

## PHASE 3 — MARKETING PAGES  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P3-01 | Home page | **A** | ✅ | Sanity-driven. **No StatBand wired** — CLAUDE.md forbids invented trained-employee counts and the client hasn't supplied real figures. Lottie slots for C in Phase 11. |
| P3-02 | About | **A** | ✅ | Structure only — the credentials block is a VISIBLE placeholder, not invented. Real credentials load at P13-01. |
| P3-03 | Services + /services/[slug] | **A** | ✅ | List + detail, Sanity-driven, `generateStaticParams`. |
| P3-04 | Contact + Book Demo + LeadForm + /api/leads | **A** | ✅ | LeadForm + NewsletterForm + `/api/leads`. Guard order: rate limit → parse → honeypot (silent 200) → consent → Turnstile. Notification is fire-and-forget. |
| P3-05 | **Legal: /privacy, /terms, /refund-policy** | **A** | ✅ | → **UNBLOCKS B's P7-06 Razorpay activation.** All three live. Drafts carry a visible `LegalReviewNote` until the client signs off; the refund windows (7d / 20%) are a business decision awaiting confirmation. |
| P3-06 | Marketing components (Hero, StatBand, ServiceCard, CourseCard, PostCard, TestimonialSlider, CTABand) | **A** | ✅ | + ProseBlock, CalloutBox, DataTable, LeadForm, NewsletterForm, Container, nav-links. |

## PHASE 4 — KNOWLEDGE HUB  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P4-01 | /posh-act rendering poshSection grouped + ordered | **A** | ✅ | 11 groups in canonical order; empty groups dropped so a partial content delivery still reads as finished. Renders ZERO POSH content of its own — all client-supplied via Sanity. |
| P4-02 | TocSidebar with scroll-spy + deep anchors | **A** | ✅ | IntersectionObserver scroll-spy banded under the sticky header. Deep anchors on every heading with a hover `#` link. |
| P4-03 | ReadingProgress + BackToTop + mobile collapsibles | **A** | ✅ | Both built. TOC collapses on mobile; BackToTop sits left of the WhatsApp FAB so they never overlap. |
| P4-04 | Inline Sanity-managed CTA bands | **A** | ✅ | `ctaBand` documents place themselves by `afterGroup`. |
| P4-05 | JSON-LD: Article + FAQPage + BreadcrumbList | **A** | ⏸️ | **DEFERRED — SEO, excluded from current build scope at the user's direction (2026-07-25).** Same for P12-01..04. |

## PHASE 5 — CONTENT & CONVERSION  [Dev A]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P5-01 | Blog list, detail, category, related, RSS | **A** | ✅ | List, detail (+ reading time, tags, related), category pages, and RSS at `/feed.xml` with XML escaping. Posts link back to Hub anchors via a first-class Sanity field — cluster→pillar linking is the content strategy, not an afterthought. |
| P5-02 | FAQ page + FAQPage schema | **A** | ✅ | Accordion-based, grouped by the client's own category order. `FAQPage` JSON-LD deferred with the rest of SEO; markup is structured so adding it later is a pure addition. |
| P5-03 | Lead magnet: gated checklist PDF + Resend delivery | **A** | ✅ | E2. `@react-pdf/renderer` checklist built from the SAME `QUESTIONS` list as the self-check, so PDF and web tool cannot drift. Delivered by email via an HMAC-signed, 7-day expiring link. Placed inline at the foot of /posh-act and on /ic-quick-reference — deliberately NOT a timed pop-up. |
| P5-04 | /posh-compliance-check — 8 questions, score, emailed report | **A** | ✅ | E3. 8 questions, scored by ONE shared `lib/compliance-check.ts` used by both browser and server, so the on-screen result and the emailed report can never disagree. Result shows BEFORE the email gate. 'Not sure' scores zero — an unevidenced arrangement is a real gap. |
| P5-05 | IC Quick-Reference tables | **A** | ✅ | E4. New Sanity `quickReference` type at /ic-quick-reference. No timeline or penalty figure is hardcoded — they are the client's to state and keep current. |
| P5-R | /qa on the marketing site — **SHIP STAGE 1 HERE** | **A** | ⬜ | **Cannot run — `/qa` is a gstack skill and gstack skills need a Claude Code restart to register.** Run after restarting. This is the Ship-Stage-1 gate. |

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

## PHASE 11 — MOTION & EMBEDS  [Dev C — done this session in Dev C's absence, see note below]
| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| P11-01 | Lottie A — what counts as harassment | **C** | ✅ | **Built as DOM + `motion` instead of Lottie** — see DECISIONS LOG 2026-07-26. `components/marketing/harassment-spectrum.tsx`. Five acts from POSH Act §2(n), converging into a cited "Section 2(n)" hub. Visually verified via `/browse` at 1280px and 375px — clean, no overlap. |
| P11-02 | Lottie B — complaint journey with timelines | **C** | ✅ | **Already built** by Dev A during Phase 3 (commit `7071eb8`) as `components/marketing/complaint-journey.tsx`, DOM + `motion`, live in the Hero aside. This board was never updated to reflect it until now — first deviation from the Lottie spec, and the precedent this session's A/C follow. |
| P11-03 | Lottie C — who the Act protects | **C** | ✅ | **Built as DOM + `motion` instead of Lottie**, same reasoning as P11-01. `components/marketing/workplace-protection.tsx`. Six roles orbiting a "Workplace" hub, positioned by trigonometry (percent-based radius, so it scales at every breakpoint without recomputation) rather than a grid, so it actually reads as orbiting. Legal content hedged carefully — see the file's own header comment. Verified via `/browse` at 1280px and 375px. |
| P11-04 | LottieLoop wrapper: IntersectionObserver, reduced-motion | **C** | ✅ | **No LottieLoop exists — by design**, following from P11-01/02/03 not being Lottie. Each animation instead uses `useInView` + `useReducedMotion` inline (same pattern as `components/motion/*`); `public/lottie/` was never created. |
| P11-05 | **Static accessible HTML equivalent under each animation** | **C** | ✅ | Satisfied BY CONSTRUCTION, not bolted on — real DOM text/headings, not a second render path under a canvas. Same reasoning as `components/motion/index.ts`'s house rules. |
| P11-06 | YouTubeLite façade + /api/youtube/latest cached 6h | **C** | ✅ | `lib/youtube.ts` + `app/api/youtube/latest/route.ts` (public, no auth) + `components/marketing/youtube-lite.tsx`. Click-to-load poster; real `<iframe>` (youtube-nocookie.com) only after click. 6h cache via Next's fetch Data Cache (`next: { revalidate }`), which also gives the "serve last-cached payload on failure" behaviour for free on a background-revalidation error. Degrades to an empty list (section doesn't render) when `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` are unset — added `YOUTUBE_CHANNEL_ID` to `.env.example`, matching the existing `YOUTUBE_API_KEY`. |
| P11-07 | InstaGrid from Sanity post URLs | **C** | ✅ | New Sanity document `instagramPost` (image, permalink, caption, order) — registered in `sanity/schemas/index.ts` and `sanity/desk-structure.ts`. `getInstagramPosts()` in `lib/sanity.ts`, **no demo-content fallback** — CLAUDE.md's "never invent testimonials" extends to a grid of fake posts; empty renders nothing. `components/marketing/insta-grid.tsx`. |
| P11-R | Home page wiring + full verification | — | ✅ | Wired into `app/(marketing)/page.tsx` per DETAILED-PLAN.md §F2 order. `npm run typecheck` / `lint` / `test` (57/57) / `build` (46 routes) all clean; both CLAUDE.md security greps clean. Visually verified live via gstack `/browse` (not Chrome MCP, per CLAUDE.md) at 1280px and 375px — no overlap, no clipping, graceful hide when YouTube/Instagram unconfigured. |

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
| P13-01 | Content load into Sanity with client | **A** | 🔄 | **Sanity project `7h7vbi97` is LIVE and connected.** Seeded 26 starter documents via `npm run seed:sanity` (idempotent). Site now reads real CMS content, demo fallback retired. ⚠️ `siteSettings` contact email/phone/WhatsApp seeded EMPTY on purpose — Studio flags them red until the client fills them, because a fake address on a live-looking site is worse than none. Testimonials deliberately NOT seeded. Remaining: Jyoti replaces the 8 sample POSH sections (that is P0-04). |
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
| 2026-07-26 | **Honeypot field renamed `website` → `refCode`** across all 5 forms, 3 schemas, 3 routes + `signupAction`; every hit now logged | Found from a live report: a real self-check submission returned a green "Received" and vanished. `Received` is only ever returned by the honeypot branch, and no `Lead` row was written — confirming the trap fired on a human. `website` is a first-class password-manager vault field and a Chrome autofill category, so 1Password/LastPass/Bitwarden filled the hidden input; `autocomplete="off"` does not stop them. Added `data-1p-ignore`/`data-lpignore`/`data-bwignore`/`data-form-type="other"` as belt-and-braces. Regression guard: `tests/unit/honeypot.test.ts` (verified it fails when the old name/`.max(0)` is reintroduced). |
| 2026-07-26 | **`signupSchema` honeypot loosened from `.max(0)` to `.max(200).optional()`** | Two bugs in one line. `.max(0)` rejected a filled honeypot at the *validation* layer, so (a) `signupAction`'s own honeypot branch was unreachable dead code, and (b) any human whose password manager filled the field got a generic "Invalid input" and **could not create an account at all** — a hard conversion blocker on the paid product. The route, not the schema, must decide, so the reply stays indistinguishable from success and teaches a bot nothing. |
| 2026-07-26 | **Explicit `replyTo` on every email**, defaulting to `settings.email`; `sendLeadNotification` replies to the *enquirer* | `EMAIL_FROM` is `noreply@`, which has no mailbox — replies to a report, receipt or verification mail were silently lost. Resolved from site settings (already `unstable_cache`d, so no per-send query) so the client can change it in `/admin` without a deploy, with an `EMAIL_REPLY_TO` env override for CI/preview. Wrapped so a settings failure degrades to no Reply-To: `lib/email.ts`'s contract is that delivery is fail-soft. Diagnosis originally from Dev B; implemented here at his request. |
| 2026-07-26 | **`jsworkplacewellness.com` verified in Resend; `EMAIL_FROM` off the sandbox sender** | `onboarding@resend.dev` only ever delivers to the Resend account owner's own inbox, so every send to anyone else was rejected — a feature that looked like it worked and didn't. DKIM (`resend._domainkey`) + SPF (`send`) + MX (`send` → `feedback-smtp.ap-northeast-1.amazonses.com`) confirmed live in public DNS. Kept GoDaddy's pre-existing `_dmarc` (`p=quarantine; adkim=r; aspf=r`) rather than adding Resend's — two `_dmarc` records invalidate DMARC entirely, and both mechanisms align as-is. **Open:** the Resend account is still on a developer's email; production should move to a client-owned account, which means redoing the DNS (DKIM keys are per-account). |
| 2026-07-26 | **CMS migration APPROVED** — execute CMS-MIGRATION-PLAN.md M1–M5 + M6 dry-run on branch `cms-migration` | User decision after reviewing the plan. Supersedes "Sanity owns content" for the migrated types, one getter at a time via `lib/content.ts`. |
| 2026-07-26 | Rich text = **Tiptap JSON**, not sanitized HTML | Keeps CalloutBox/DataTable as real React components, eliminates the XSS surface (structured data → React renderer, no `dangerouslySetInnerHTML`, no DOMPurify to mis-configure), and makes the Portable Text migration a shape transform. Amends plan §4/§5.2. |
| 2026-07-26 | Migration **stops before cutover** | M6's real run, Studio/webhook deletion and Sanity decommission wait for explicit user go-ahead after they use the new admin. Everything stays reversible; both systems coexist via per-type getter swaps. |
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
| 2026-07-26 | **Phase 11's three animations built as DOM + `motion`, not Lottie JSON** — extends a precedent, doesn't set a new one | `complaint-journey.tsx` (Animation B) already made this call during Phase 3, with reasoning in its header comment: real DOM text is indexable and screen-reader-readable by construction (satisfies P11-05 without a second render path), no 150 KB JSON asset to go missing, and — the load-bearing reason — there is no After Effects/LottieFiles pipeline on this team for a designer to receive a hand-off from. That board entry was never marked done, so this was easy to miss; applying it consistently to Animations A and C (rather than one Lottie + two DOM, which would look and behave inconsistently) is the more defensible outcome. `lottie-react` was deliberately NOT added as a dependency; `public/lottie/` was never created. If a real After Effects pipeline exists later, this is reversible per-animation without touching the other two. |
