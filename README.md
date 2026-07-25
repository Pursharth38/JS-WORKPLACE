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

```bash
cp .env.example .env      # fill in — see documentation/DEPLOY.md §1 for account order
npm install
npx prisma migrate dev
npm run dev
```

## Current status

Pre-Phase-0. Nothing built. Four blockers open — see `orchestrate/tasks.md` BLOCKED TASKS.
