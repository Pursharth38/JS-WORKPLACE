# gstack — How to Use It on This Project
> Skills live at `~/.claude/skills/gstack`. This file records WHICH skill to run WHEN on
> JS Workplace Wellness, and exactly what context to paste in. Bootstrap: CLAUDE.md

## What gstack actually is
A pack of Claude Code slash-command skills for planning, review, QA, security, and deploy. The
skills are generic; the value comes from feeding them the right project context. This file is that
context, phase by phase.

## Claude Pro constraint
On Pro, run skills **sequentially**. Parallel sub-agents burn the quota fast, and a half-finished
`/cso` is worse than none. On Max, parallel agents are viable — follow the identity files.

## How to feed project context to gstack skills
Paste this preamble before any skill command inside a Claude Code session:

```
Project: JS Workplace Wellness — POSH awareness site + B2C course platform for a POSH trainer.
Stack: Next.js 15 App Router, TS strict, Prisma/Neon Postgres, Sanity CMS, Cloudflare Stream,
Razorpay, Auth.js v5, Vercel.
Read first: .claude/CLAUDE.md, .claude/ARCHITECTURE.md, .claude/CONTRACTS.md
Non-negotiables: server-only gating · price from DB · enrolment webhook-only ·
correctOptionId never leaves the server · no false authority claims (see CLAUDE.md §1).
```

---

## WHICH SKILL, WHEN

### After Phase 1 — design tokens landed, before any page is built
```
/plan-design-review
```
Feed: the token block from `orchestrate/agents/platform-agent.md` + both colour boards.
Ask specifically: does Amber `#C77D26` on Sand `#FBF9F5` clear 4.5:1 at body size? (It does not —
the expected answer is "large text only". If the skill says otherwise, the contrast maths is wrong.)

### After Phase 5 — marketing site complete, BEFORE SHIPPING STAGE 1
```
/qa
```
Feed: route list from `orchestrate/codebase.md` §app. Focus:
- Forbidden-claim strings in the **built output**, not just source
- Every Knowledge Hub anchor resolves and scroll-spy tracks it
- Lead forms: unticked consent, honeypot, Turnstile, rate limit
- Lighthouse ≥90 mobile on `/`, `/posh-act`, `/courses/[slug]`

### After Phase 7 — payment path complete  ★ NON-NEGOTIABLE
```
/cso
```
Feed: `app/api/checkout/`, `app/api/webhooks/razorpay/`, `lib/razorpay.ts`, plus CONTRACTS.md
§COMMERCE. Five checkpoint questions the run must answer explicitly:
1. Can a tampered `amount` in the request body change what the user is charged?
2. Can an `Enrollment` be created without a verified webhook?
3. Is the HMAC comparison timing-safe, and computed over the **raw** body?
4. Is a replayed webhook idempotent?
5. Does any response leak `passwordHash`, `err.message`, or a stack trace?

```bash
# Zero output = safe. Any output = fix before calling /cso done.
grep -rn "body.amount\|body\.price" app/api/checkout/
grep -rn "enrollment.create\|enrollment.upsert" app/ lib/ | grep -v webhooks/razorpay
grep -rn "signature ===" app/api/webhooks/
```

### After Phase 8 — unlock engine + video gating  ★ NON-NEGOTIABLE
```
/cso
```
Feed: `lib/unlock.ts`, `lib/stream.ts`, `app/api/video/`, `app/api/progress/`, plus the unlock rules
from CLAUDE.md. Five checkpoint questions:
1. Can a locked module's `videoUid` reach the client through **any** path, including RSC payloads?
2. Can a forged heartbeat complete a module faster than real time?
3. Is unlock state ever computed or trusted client-side?
4. Does a Stream token outlive 5 minutes, or work for a different module?
5. Does free-preview access leak anything beyond the preview module?

```bash
grep -rn "videoUid" app/ components/ lib/ | grep -v "api/video/token\|lib/stream\|webhooks/sanity"
grep -rn "correctOptionId" app/ components/ | grep -v "api/assessment/\[attemptId\]/submit"
# Zero output = safe.
```

### After Phase 9 — assessments
```
/review
```
Feed: `app/api/assessment/`, `lib/grading.ts`. Focus: answer-key leakage, client-computed scores,
cooldown bypass by starting a fresh attempt, attempt-ownership check on submit.

### After Phase 10 — certificates
```
/review
```
Focus: idempotency under concurrent double-submit, `certId` guessability, verification endpoint
enumeration (unknown `certId` must return `valid: false`, not `404`).

### Before Phase 13 launch
```
/qa            # full E2E, all routes, both authenticated and anonymous
/design-review # visual pass at 375px and 1440px
/ship
```

---

## THE TWO NON-NEGOTIABLE `/cso` RUNS

1. **After Phase 7** — the payment path. This is where money is lost.
2. **After Phase 8** — the unlock engine and video gating. This is where the product is given away.

Neither phase may be marked ✅ in `orchestrate/tasks.md` without its `/cso` run recorded in
`AUDIT.md` with the actual command output pasted in.

---

## Skills map summary

| Phase | Skill | Blocking? |
|---|---|---|
| 1 | `/plan-design-review` | No |
| 5 | `/qa` | Yes — before Stage 1 ship |
| 7 | `/cso` | **Yes** |
| 8 | `/cso` | **Yes** |
| 9 | `/review` | Yes |
| 10 | `/review` | Yes |
| 12 | `/qa` + `/design-review` | Yes |
| 13 | `/ship` | — |

## Full skills reference
`/office-hours` · `/plan-ceo-review` · `/plan-eng-review` · `/plan-design-review` ·
`/design-consultation` · `/design-shotgun` · `/design-html` · `/review` · `/ship` ·
`/land-and-deploy` · `/canary` · `/benchmark` · `/browse` · `/connect-chrome` ·
`/qa` · `/qa-only` · `/design-review` · `/setup-browser-cookies` · `/setup-deploy` ·
`/setup-gbrain` · `/retro` · `/investigate` · `/document-release` · `/document-generate` ·
`/codex` · `/cso` · `/autoplan` · `/plan-devex-review` · `/devex-review` ·
`/careful` · `/freeze` · `/guard` · `/unfreeze` · `/gstack-upgrade` · `/learn`

## Web browsing
Use `/browse` for ALL web browsing. **Never use `mcp__claude-in-chrome__*` tools.**
