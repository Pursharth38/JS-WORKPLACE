---
name: project-jsww
description: JS Workplace Wellness — POSH awareness platform and B2C course store for trainer Jyoti Solaria; locked architecture decisions and non-negotiable rules
metadata:
  type: project
---

# JS Workplace Wellness

> Canonical, always-current specs live in `.claude/`: CLAUDE.md (bootstrap), ARCHITECTURE.md
> (full reference), orchestrate/data-model.md (schemas), CONTRACTS.md (API),
> orchestrate/tasks.md (board). This file is a short orientation — if it disagrees with those,
> those win.

## What We're Building
A **POSH awareness platform** plus a **B2C self-paced course store** for Jyoti Solaria, a certified
POSH trainer. Reference competitor: elearnposh.com — we mirror its information *architecture* only,
never its wording.

**Why the ordering matters:** her actual business is corporate POSH training. Individual certificate
buyers are a thin market — most people take POSH training because an employer mandates it, and the
employer pays. **The site is a lead-generation engine for her training practice first, and a course
store second.** The Knowledge Hub will likely out-earn the course. If a phase must be cut, cut LMS
polish before content depth.

## The two dominant rules
1. **Server-only authority.** Unlock state, price, grading, and enrolment are computed server-side.
   A locked module's Stream UID and a question's `correctOptionId` must never reach a client.
2. **No false authority.** She is not MWCD-empanelled; the competitor is. Copying their claim
   structure is a misrepresentation risk for her and for us as the people who wrote the copy.
   Certificate wording is fixed: "Certificate of Completion — POSH Awareness Training".

## Locked decisions
| Decision | Choice |
|---|---|
| Customer | B2C individuals only (v1) |
| Video | Cloudflare Stream, signed tokens ≤5 min |
| CMS | Sanity v3, full self-serve editing |
| DB | Neon Postgres + Prisma |
| Payments | Razorpay, webhook-only enrolment |
| Assessment | 80% chapter / 85% final (overrides the client's 100% request) |
| Instagram | Sanity-managed grid, not the Basic Display API |
| Analytics | Plausible (cookieless — no DPDP banner) |

## Tech Stack
```
Next.js 15 App Router · TypeScript strict · Tailwind
Auth.js v5 (httpOnly cookies, NEVER localStorage) · Prisma + Neon Postgres
Sanity v3 CMS · Cloudflare Stream + R2 · Razorpay · Resend · Upstash · Vercel
```

## Team
Three developers, split by vertical slice — not by layer.
A = Platform & Content · B = Identity & Commerce · C = Learning Engine & Motion.
Agent identities: `.claude/orchestrate/agents/`. Full split: `/team-division.md`.

## Current status
PRE-PHASE-0. Nothing built. Four blockers open: certificate wording sign-off, 80% threshold
sign-off, colour board selection, and client-supplied Knowledge Hub content.
