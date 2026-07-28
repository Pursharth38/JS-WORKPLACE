# JS Workplace Wellness — Master Memory
> Claude Code reads this file at the start of EVERY session, before touching anything.
> Every agent, every sub-session, every task — read this first.
> Full reference: ARCHITECTURE.md · Schemas: orchestrate/data-model.md · API: CONTRACTS.md · Board: orchestrate/tasks.md

---

## WORKING PRACTICES

- **COMPULSORY — per-todo discipline:** After completing EACH todo/phase, (1) update the relevant
  `.claude/` files and memory **first**, then (2) run `/compact`, THEN move to the next todo.
  Never batch documentation to the end and never advance to the next todo before the doc+compact step.
- **COMPULSORY — clean up processes:** When work completes (or a task that started servers/background
  jobs ends), KILL every terminal process and background task you launched — the Next dev server (3000),
  Sanity Studio, `run_in_background` Bash tasks, watchers. Leftover next-dev zombies serve hung
  responses. Verify nothing is left listening before ending.
- **COMPULSORY — Read before Edit:** ALWAYS `Read` the exact file (the relevant section is enough)
  IMMEDIATELY before every `Edit`/`Write`. The Edit tool matches against a tracked in-memory snapshot
  that goes STALE after several edits, a `/compact`, or a system event — it returns `String not found`
  on text that is verifiably present. A fresh Read re-syncs the snapshot. If an Edit still fails on a
  verbatim string you just Read, fall back to a Python byte-level replace (read→replace→write utf-8).
- **Context compaction:** After any heavy task (full QA pass, multi-file fix session, long doc update) —
  update `.claude/` files and memory **first**, then `/compact`, then continue.
- **One dev server at a time.** Next dev + Sanity Studio together are memory-hungry. Kill port 3000
  before restarting.

---

## WHAT WE ARE BUILDING

A **POSH awareness platform and self-paced course store** for Jyoti Solaria, a certified POSH trainer.

Two products in one site:
1. **An awareness engine** — a deep, original POSH Act knowledge hub plus blog, services, and lead
   capture. This is what ranks, and it is what generates her corporate training enquiries.
2. **A B2C course platform** — chapters → modules → one video each, sequential unlock, chapter
   assessments, a final test, and a Certificate of Completion.

### The business reality in one picture
```
        JYOTI SOLARIA  (certified POSH trainer — the actual business)
                 │
   ┌─────────────┴──────────────────────────────┐
   ▼                                             ▼
CORPORATE TRAINING PRACTICE              B2C COURSE STORE
(sessions, IC training, policy           (individual learners buy,
 drafting, POSH audits)                   complete, get certificate)
   ▲                                             │
   │  enquiries                                  │  revenue
   │                                             │
   └──────── KNOWLEDGE HUB + BLOG + DEMO ────────┘
             (the SEO engine — the real asset)
```

**The site is a lead-generation engine for her training practice FIRST, and a course store SECOND.**
Individual certificate buyers are a thin market — most people take POSH training because an employer
mandates it, and the employer pays. If a phase must be cut, cut LMS polish before cutting content depth.

---

## NON-NEGOTIABLE FIRST PRINCIPLES

1. **NO FALSE AUTHORITY.** Jyoti Solaria is **not** empanelled by the Ministry of Women and Child
   Development. The reference competitor (eLearnPOSH) is. These strings must NEVER appear anywhere in
   the codebase, content, or built output:
   `POSH Certified` · `certified under the POSH Act` · `government recognized` · `government approved` ·
   `MWCD empanelled` · `Ministry empanelled`.
   Certificate wording is exactly: **"Certificate of Completion — POSH Awareness Training"**.
   CI greps the build for these strings and fails on any hit.

2. **SERVER IS THE ONLY AUTHORITY ON ACCESS.** Unlock state, grading, pricing, and enrolment are
   computed server-side, always. A locked module's content — including its Cloudflare Stream UID —
   must never appear in any RSC payload or JSON response. The client is never trusted with a gate.

3. **PRICE COMES FROM THE DATABASE.** `/api/checkout/create-order` reads the amount from `Course` by
   `courseId`. Never from the request body. A client sending `amount: 100` for a ₹4999 course must fail.

4. **ENROLMENT IS WEBHOOK-ONLY.** `Enrollment` rows are created exclusively by the HMAC-verified
   Razorpay webhook. Never by the client-side checkout success callback — the attacker controls that
   code path entirely.

5. **CORRECT ANSWERS NEVER LEAVE THE SERVER.** `/assessment/start` strips `correctOptionId` before
   serialization. Grading happens only in `/assessment/submit`. Responses return score and topic-level
   feedback — never a per-question answer key.

6. **CONTENT IS THE CLIENT'S, NOT OURS.** Anything she would reasonably want to change lives in Sanity:
   copy, blog, services, POSH sections, quiz questions, testimonials, contact details. Hardcoded strings
   that should be CMS-managed are a review failure.

7. **ORIGINAL CONTENT ONLY.** Never copy text from elearnposh.com or any competitor. Duplicate content
   does not rank and is copyright exposure. We mirror information *architecture*, never wording.

---

## ACTIVE DEVELOPER ROLE

**Three developers, split by vertical slice — not by layer.** Each owns schema → API → UI for their
domain and integrates at defined contract points. Full detail: `team-division.md` at repo root.

| Dev | Agent identity | Domain |
|---|---|---|
| **A** | `orchestrate/agents/platform-agent.md` | Foundation, Sanity CMS, marketing pages, Knowledge Hub, SEO |
| **B** | `orchestrate/agents/commerce-agent.md` | Auth, Razorpay, enrolment, dashboard, certificates, admin |
| **C** | `orchestrate/agents/learning-agent.md` | Cloudflare Stream, progress, unlock engine, assessments, motion |
| all | `orchestrate/agents/review-agent.md` | Cross-cutting security + QA review (no dev owns their own review) |

> **Assign your strongest developer to Dev C.** The unlock engine is the correctness core — every
> gating decision and anti-gaming clamp flows through it. Second-strongest to Dev B, because that is
> where money is lost.

---

## TECH STACK (do not substitute)

```
Framework:   Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind v4
Auth:        Auth.js v5 — credentials + Google OAuth, JWT sessions, httpOnly cookies
Database:    PostgreSQL (Neon serverless) + Prisma ORM
CMS:         Sanity v6 + next-sanity 13, Studio embedded at /studio
Video:       Cloudflare Stream, signed playback tokens (≤5 min TTL)
Payments:    Razorpay Orders API + HMAC-verified webhooks
Email:       Resend + React Email
Object store:Cloudflare R2 (certificates, invoices, lead magnets)
PDF:         @react-pdf/renderer (Node runtime, NOT Edge)
Animation:   `motion` (Framer Motion's successor package) + lucide-react icons.
             lottie-react is NOT a dependency — see the note under "Frontend" below.
Validation:  Zod at every API boundary
Rate limit:  Upstash Redis
Analytics:   Plausible (cookieless — avoids a DPDP consent banner)
Hosting:     Vercel
```

**Rejected, do not reintroduce:** separate Express/Nest backend · Supabase · Mux · direct S3 MP4
playback · unlisted YouTube for paid content · Redux/Zustand · Three.js for the home animations ·
Instagram Basic Display API. Reasons are in ARCHITECTURE.md §1.1.

> **Version pins were raised at P1-01 (2026-07-25), with sign-off.** This file previously said Next 15
> and Sanity v3. Both were stale: `next-sanity@13` declares `next: ^16.0.0-0`, so staying on Next 15
> would have capped us at `next-sanity@11` and Sanity v4/v5 — and Sanity v3 as literally written is
> unreachable from *any* current `next-sanity`. Raised while zero app code existed, which was the
> cheapest possible moment. "Do not substitute" still applies to *swapping* a technology (no Supabase
> for Neon, no Mux for Stream); it is not a freeze on version numbers.
>
> **Tailwind v4 changes where tokens live.** There is no `tailwind.config.ts`. The design tokens go in
> the `@theme` block in `app/globals.css`, and config is CSS-first. Any doc still pointing at
> `tailwind.config.ts` means `app/globals.css`.

---

## ROUTE NAMESPACING

```
/                          Home
/posh-act                  Knowledge Hub — the SEO centerpiece
/services  /services/:slug
/courses   /courses/:slug
/blog      /blog/:slug     /blog/category/:cat
/faq  /about  /contact  /book-demo  /posh-compliance-check
/verify/:certId            PUBLIC certificate verification
/privacy  /terms  /refund-policy
/login /signup /verify-email /forgot-password /reset-password
/dashboard                 learner (middleware-protected)
/learn/:courseSlug/:moduleId
/learn/:courseSlug/chapter/:n/assessment
/learn/:courseSlug/final-test
/studio                    Sanity Studio (excluded from auth middleware)
/admin                     role=ADMIN only
```

---

## SOURCE-OF-TRUTH SPLIT (most important concept in the system)

- **Sanity owns content** — titles, body copy, quiz question text, options, correct answers, ordering.
- **Postgres owns state and identity** — users, enrolments, payments, progress, attempts, certificates.
- **Postgres mirrors only the structural IDs needed to enforce gating** — `Course`, `Chapter`, `Module`
  rows carrying `sanityId`, `order`, `videoUid`. Nothing else.

A Sanity publish webhook hits `/api/webhooks/sanity` → upserts the structural mirror → revalidates
cache tags. Content changes never require a deploy. Get this wrong and two systems disagree about
what a course contains.

> **PLANNED, NOT YET DECIDED OR EXECUTED (raised 2026-07-26):** the client has asked whether
> blog/course/service content editing should move off Sanity Studio entirely and into a custom
> admin UI merged into `/admin`, on the reasoning that a second CMS login is one login too many
> for a non-technical owner. A migration architecture is written up at
> `.claude/documentation/CMS-MIGRATION-PLAN.md` — mapping every current Sanity-owned feature to
> its Postgres+admin-UI equivalent, phased, with tradeoffs. **This rule (Sanity owns content) is
> still in force until that plan is reviewed and approved.** Do not start migrating content off
> Sanity based on this note alone.

---

## MIDDLEWARE + GATING CHAIN

```
public route:     (none)
learner route:    edge middleware (session only) → route handler → computeUnlockState() → render
video token:      session → isEnrolled() → computeUnlockState() → sign Stream token (≤5 min)
assessment start: session → isEnrolled() → unlock check → strip correctOptionId → serve
assessment submit:session → attempt ownership → server-grade → persist → return score+topics
certificate:      session → finalTestPassed() → idempotent issue → R2 → return certId
```

- **Edge middleware does session checks and redirects ONLY.** No Prisma calls in middleware.
- `/studio` is excluded from the auth middleware matcher — Sanity handles its own auth.
- PDF routes must declare `export const runtime = 'nodejs'`.

---

## UNLOCK RULES (single source: lib/unlock.ts)

1. Module `n` in chapter `c` unlocks when module `n-1` in chapter `c` has `completedAt != null`.
2. Module 1 of chapter `c` unlocks when chapter `c-1`'s assessment has a passing attempt.
3. Chapter 1, module 1 unlocks on enrolment.
4. A chapter's assessment unlocks when all modules in that chapter are complete.
5. The final test unlocks when every chapter has a passing assessment attempt.
6. Modules flagged `isFreePreview` are unlocked for everyone, enrolled or not.
7. A module completes at **≥90% of `durationSeconds`** cumulative watched (not position).

**Assessment thresholds** — chapter 80%, final 85%. Questions randomized per attempt from a larger
Sanity pool, options shuffled, unlimited retries with a 10-minute cooldown after two consecutive
failures, final test capped at 3 attempts per 24h.

> **Client originally asked for 100%-correct-to-pass.** Overridden to 80% because a 100% gate with
> unlimited instant retries is brute-forced in two attempts — the learner memorises the key, not the
> content, and the pass record stops being evidence that training happened. **Requires written client
> sign-off before Phase 9.** Thresholds are columns on `Course`/`Chapter`, so reverting is a value
> change, not a rewrite.

---

## STANDARD RESPONSE FORMAT

All API responses go through `apiResponse()` in `lib/response.ts` — never bare `NextResponse.json()`.
```
{ success: true|false, message: "...", data: {...} | null }
```
List endpoints: `data: { items: [...], pagination: { page, limit, total, pages } }`.
Never expose `err.message` or stack traces. Never return `passwordHash`, `correctOptionId`, or any
Stream UID for a locked module.

---

## KEY DOMAIN RULES

- **Certificate name is legal name.** Captured at signup; `nameLocked` flips true on first issue.
  Changes after that go through a support request, not a self-serve edit.
- **Certificate IDs** are `JSWW-2026-A7K2P9` — human-readable, non-sequential, non-guessable.
- **Certificate issuance is idempotent** — partial unique index on `(userId, courseId)` WHERE
  `revokedAt IS NULL`. Double-submit returns the same `certId`.
- **Progress heartbeat is server-clamped**: `delta ≤ elapsedWallClock × 1.5`, computed from a
  server-stored `lastHeartbeatAt`. Otherwise a learner POSTs `delta: 999999` and completes a
  45-minute module instantly.
- **Every lead form** carries an explicit, **unticked** consent checkbox (DPDP Act).
- **Razorpay will not activate the account** without live Terms and Refund Policy pages. Those are a
  Phase 3 deliverable, not a launch-week task.

---

## WHAT NOT TO DO (HARD RULES)

**Security:**
- Never read a price, amount, or `courseId`-to-price mapping from a request body.
- Never create an `Enrollment` outside the verified Razorpay webhook.
- Never emit `correctOptionId` to the client, in any route, at any time.
- Never emit a locked module's `videoUid` in an RSC payload or JSON response.
- Never trust a client-reported watch delta without clamping.
- Never call Prisma from edge middleware.
- Never expose stack traces or `passwordHash`.

**Legal / brand:**
- Never use the forbidden claim strings in §1. CI fails the build on any hit.
- Never copy text, structure-for-structure paraphrase, or lift statistics from elearnposh.com.
- Never invent testimonials, client logos, or trained-employee counts.

**Architecture:**
- Business logic in route handlers and `lib/`; auth in Auth.js config and middleware; components render.
- Zod validation on every API boundary — no exceptions.
- Content the client would want to edit belongs in Sanity, not in JSX.
- No `any`, no `@ts-ignore`.

**Frontend:**
> **BRAND PIVOT, 2026-07-26 (client-directed) — supersedes the original Deep Teal/Amber
> rule below.** Brand is now a warm, Apple-adjacent **cream/bronze** palette in light mode —
> **Cream `#F7F3EC`** surface, **Ink `#1D1D1F`** text, **Bronze `#7A5D2E`** primary, **Gold
> `#B8863D`** accent — with a matching **dark theme** (**Navy `#12151B`** surface, **bright
> Gold `#D4A24C`** accent), toggled by `components/ui/theme-toggle.tsx` and persisted to
> `localStorage`. Full token set and the reasoning for which colours stay constant across
> themes vs. which flip: `app/globals.css`'s header comment. Still NO pink, NO purple — the
> "soft undermines legal authority" reasoning survives the repalette even though the exact
> hexes don't. Old rule, kept for history: ~~Brand is Deep Teal `#0F5257` with Amber
> `#C77D26` accent on Sand `#FBF9F5`~~.
- Headings **Fraunces** (serif, 600), body **Inter** 17px/1.7, measure 68ch on the Knowledge Hub.
- YouTube uses a **lite click-to-load façade**, never the standard iframe (~1.5 MB).
- The three Phase 11 explainer animations are **DOM + `motion`, not Lottie JSON** — see
  `components/marketing/complaint-journey.tsx`'s header comment for why, and
  `orchestrate/tasks.md` DECISIONS LOG (2026-07-26) for the full record. `IntersectionObserver`
  (via `useInView`)-gated, skipped under `prefers-reduced-motion`, and the explanation is real
  DOM text by construction — no separate "static accessible equivalent" to bolt on.
- Hover/ambient motion (`components/motion/border-beam.tsx`, the Hero's orbiting background
  circles, the "How it works" connector beams) is decoration on top of already-complete content,
  never required to understand the page, and freezes under `prefers-reduced-motion`.
- Gold/bronze accent contrast varies by exact shade and theme — see `app/globals.css`'s
  per-token comments before assuming a pairing is safe; this has not had the CONTRAST-REPORT.md
  treatment (a measured, per-pair WCAG audit) that the original palette got. Treat as an open
  follow-up, not settled.
- **The entry curtain (`components/marketing/site-intro.tsx`) must never gate rendering.** It is a
  server component + CSS keyframes on purpose: the page server-renders underneath it from the
  first byte, and it lifts itself with `animation-fill-mode: forwards`. Do not "improve" it into a
  client component that holds children behind a timer or a `loaderDone` flag — that is the exact
  pattern it was rewritten to avoid, and it costs LCP, crawlability and every no-JS visitor. It is
  mounted in the marketing layout only; a curtain over `/dashboard` or `/learn` sits between a
  paying learner and their module.

**Local preview:** `NEXT_PUBLIC_FORCE_DEMO=true` in `.env` renders the marketing site against
demo/placeholder content instead of the real, seeded Sanity project — for checking what a design
change looks like without touching real content. Never set it in production. See `.env.example`
and `sanity/env.ts`.

**Self-check after every gated route:**
```
grep -rnE "videoUid|correctOptionId" app/ components/ lib/ --include=*.tsx --include=*.ts \
  | grep -vE "lib/unlock|api/video|api/assessment|api/webhooks/sanity|lib/schemas/sanity-webhook" \
  | grep -vE '^[^:]+:[0-9]+: *(\*|//|/\*)'
```
Any hit outside the **five** authorised files is a leak. Fix before ✅.

| Authorised file | Why | Owner |
|---|---|---|
| `lib/unlock.ts` | the gating engine itself | C |
| `app/api/video/token/*` | mints the signed token; selects the uid internally, never returns it | C |
| `app/api/assessment/*` | grades server-side and strips `correctOptionId` | C |
| `app/api/webhooks/sanity` | writes `videoUid` **into** Postgres — this is the structural mirror | A |
| `lib/schemas/sanity-webhook.ts` | the Zod schema for that payload | A |

> The last two were added on 2026-07-25 when the Sanity sync landed; the original
> three-file list predated it. Widening this allowlist weakens a security gate, so any
> further addition needs the same written justification. Comment lines are stripped so a
> comment *explaining* the rule does not trip it. **CI enforces exactly this list** —
> `.github/workflows/ci.yml`, "Gated-content leak check".

---

## IMPLEMENTATION PHASES (live board: orchestrate/tasks.md)
```
Phase 0  — Sign-offs + colour boards + content inventory   ⬜  BLOCKS EVERYTHING
Phase 1  — Repo, tokens, layout shell, CI                  ⬜  [A]  blocks B and C
Phase 2  — Sanity schemas + Studio + sync webhook          ⬜  [A]  blocks C's quiz work
Phase 3  — Marketing pages + LEGAL PAGES                   ⬜  [A]  legal blocks B's Razorpay
Phase 4  — Knowledge Hub + TOC + schema markup             ⬜  [A]
Phase 5  — Blog, FAQ, lead magnet, compliance self-check   ⬜  [A]
Phase 6  — Auth + dashboard shell                          ⬜  [B]  blocks C
Phase 7  — Razorpay + webhook + enrolment + invoices       ⬜  [B]  blocks C's gating
Phase 8  — Player + Stream tokens + progress + UNLOCK      ⬜  [C]  critical path
Phase 9  — Assessment engine + final test                  ⬜  [C]  blocks B's certs
Phase 10 — Certificate PDF + verification page             ⬜  [B]
Phase 11 — Lottie animations + YouTube/Instagram           ⬜  [C]
Phase 12 — SEO, sitemap, schema, Lighthouse, SECURITY PASS ⬜  all three
Phase 13 — Content load, UAT, launch                       ⬜  all three
```

**Ship in two stages.** Phases 0–5 are a shippable standalone marketing site. Ship that first and let
it start ranking while the LMS is built. SEO compounds over months; there is no reason for content to
wait on a video player.

Handoffs: H1 foundation (A→B,C, Day 3) · H2 Sanity question schema (A→C, end W2) ·
H3 auth/session (B→C, end W2) · H4 enrolment (B→C, W4) · H5 finalTestPassed (C→B, W6).

---

## GSTACK

**REQUIRED — global install, enforced.** Before doing ANY work, verify gstack is installed:
```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```
If `GSTACK_MISSING`: STOP. Do not proceed. Tell the user:
> gstack is required for all AI-assisted work in this repo. Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack. A `PreToolUse` hook at
`.claude/hooks/check-gstack.sh` (registered in `.claude/settings.json`) enforces this automatically
for every developer's session — see `orchestrate/agents/*.md` for which of Dev A/B/C runs which skill.

Gstack skills are installed at `~/.claude/skills/gstack`. Full reference: `GSTACK.md`.

### Web browsing
Use `/browse` from gstack for ALL web browsing. **Never use `mcp__claude-in-chrome__*` tools.**

### Available skills
`/office-hours` · `/plan-ceo-review` · `/plan-eng-review` · `/plan-design-review` ·
`/design-consultation` · `/design-shotgun` · `/design-html` · `/review` · `/ship` ·
`/land-and-deploy` · `/canary` · `/benchmark` · `/browse` · `/connect-chrome` ·
`/qa` · `/qa-only` · `/design-review` · `/setup-browser-cookies` · `/setup-deploy` ·
`/setup-gbrain` · `/retro` · `/investigate` · `/document-release` · `/document-generate` ·
`/codex` · `/cso` · `/autoplan` · `/plan-devex-review` · `/devex-review` ·
`/careful` · `/freeze` · `/guard` · `/unfreeze` · `/gstack-upgrade` · `/learn`

### Mandatory checkpoints (exact context to feed each skill: GSTACK.md)
`/cso` after Phase 7 (payments) and Phase 8 (unlock engine + video gating) — non-negotiable.
`/qa` after Phase 5 (marketing site pre-ship) and Phase 12 (full E2E before launch).
`/plan-design-review` after Phase 1 tokens, before any page is built.
