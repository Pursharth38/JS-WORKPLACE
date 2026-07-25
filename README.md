# JS Workplace Wellness

POSH awareness platform and B2C course store for Jyoti Solaria, certified POSH trainer.

## Start here

**Claude Code reads `.claude/CLAUDE.md` at the start of every session.** Humans should read it too —
it is the project brain and it holds the non-negotiable rules.

```
.claude/
├── CLAUDE.md                     ★ Master memory — read first, every session
├── ARCHITECTURE.md                 Full technical reference
├── CONTRACTS.md                    Every API endpoint, owner, guard, and shape
├── GSTACK.md                       Which gstack skill to run at which phase
├── AUDIT.md                        Review + security findings, with evidence
├── orchestrate/
│   ├── tasks.md                  ★ Live task board — ⬜🔄✅❌
│   ├── codebase.md                 Where every file lives and who owns it
│   ├── data-model.md               Prisma models + Sanity documents
│   └── agents/
│       ├── platform-agent.md       Dev A — foundation, CMS, marketing, Hub, SEO
│       ├── commerce-agent.md       Dev B — auth, payments, certificates, admin
│       ├── learning-agent.md       Dev C — video, unlock engine, assessments, motion
│       └── review-agent.md         Cross-cutting review; nobody reviews their own slice
└── documentation/
    ├── MEMORY.md                   Memory index
    ├── DETAILED-PLAN.md            Feature spec, design system, phases, SEO
    ├── DEPLOY.md                   Vercel + Neon + Sanity + Cloudflare + Razorpay
    ├── project_jsww.md             Short project orientation
    ├── reference_gstack.md         gstack skills reference
    └── feature-inventory/          Surface map + QA spine
team-division.md                    Who builds what, timeline, integration contracts
```

## Working with agents

```bash
claude code --agent platform-agent     # Dev A
claude code --agent commerce-agent     # Dev B
claude code --agent learning-agent     # Dev C
claude code --agent review-agent       # review passes
```

Each agent reads `CLAUDE.md`, then `orchestrate/tasks.md`, then `orchestrate/codebase.md` before
touching a file. Task discipline: mark 🔄 before writing, ✅ after, ❌ + log if blocked.

## The four rules that matter most

1. **The server is the only authority** on unlock state, price, grading, and enrolment.
2. **Price comes from the database**, never from a request body.
3. **Enrolment is created only by the verified Razorpay webhook.**
4. **No false authority claims.** She is not MWCD-empanelled. CI fails the build on the forbidden
   strings listed in `CLAUDE.md` §1.

## Setup

Requires **Node 20.9+** (CI runs 22) and npm.

```bash
git clone <this repo> && cd JS-WORKPLACE
cp .env.example .env
npm install
npx prisma generate        # Prisma Client is generated, not committed
npm run dev                # http://localhost:3000
```

### What you actually need in `.env` to get started

Most of `.env.example` is optional. The app is built to degrade rather than crash
when a third-party service is missing, so you can run the whole marketing site
with almost nothing configured.

| Want to… | You need |
|---|---|
| Run the marketing site | nothing — it renders with empty-state copy |
| Run auth, dashboard, or anything DB-backed | `DATABASE_URL`, `NEXTAUTH_SECRET` |
| See real content, or open `/studio` | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` |
| Receive emails locally | `RESEND_API_KEY` — without it, links are printed to the server console instead |
| Test checkout | `RAZORPAY_*` test keys |

With `DATABASE_URL` set, create the schema:

```bash
npx prisma migrate dev     # first run creates the local database
```

**Deliberate degradations** — these are design decisions, not bugs:

- **No Sanity project** → every content read returns empty and pages render their
  empty states. The build stays green, which is what lets Phases 1–3 proceed
  before the client's CMS exists.
- **No `RESEND_API_KEY`** → emails are not sent; the verification / reset /
  download link is logged to the console so you can still walk the flow end to end.
- **No `TURNSTILE_SECRET_KEY`** → bot verification is skipped with a warning. The
  honeypot and rate limiter still apply. ⚠️ Must be set before launch.
- **No `UPSTASH_*`** → rate limiting uses an in-memory sliding window instead of
  Redis. Correct for a single instance; set Upstash only if you need limits shared
  across serverless instances.

### Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
```

### Before opening a PR

CI runs typecheck, lint, test, build and four grep gates (forbidden claims,
gated-content leaks, response envelope, consent checkbox). Run the first four
locally first — the greps are in `.github/workflows/ci.yml` if you want to check
them by hand.

Branch protection settings are documented in `.github/BRANCH_PROTECTION.md`.

## Current status

**Dev A** (foundation, CMS, marketing, Knowledge Hub) and **Dev B** (auth,
commerce, certificates, admin) are merged and green. **Dev C** (video, unlock
engine, assessments) has not started.

Live board: `.claude/orchestrate/tasks.md`. Integration history and the reasoning
behind the A+B merge: `MERGE-NOTES.md`.

Open blockers are all **client-side** — colour board pick, Knowledge Hub content,
and four sign-offs. See BLOCKED TASKS in `tasks.md`.
