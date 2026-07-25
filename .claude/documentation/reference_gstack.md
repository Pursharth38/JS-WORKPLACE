---
name: reference-gstack
description: gstack skills pack — install location, sprint order, and which review to use when
metadata:
  type: reference
---

# gstack Reference

Installed at `~/.claude/skills/gstack`. Project-specific usage: `.claude/GSTACK.md`.

## The sprint — skills in sprint order
```
/autoplan → /plan-eng-review → /plan-design-review → build → /review → /cso → /qa → /ship
```

## Which review to use?
| Situation | Skill |
|---|---|
| Architecture or plan, before code | `/plan-eng-review` |
| Visual direction, tokens, layout | `/plan-design-review` · `/design-review` |
| General code correctness | `/review` |
| Security posture — auth, money, gating | `/cso` |
| Behaviour in a real browser | `/qa` · `/qa-only` |
| Developer experience, tooling friction | `/devex-review` |

## Skill roles (one-liners)
- `/autoplan` — turn a brief into a phased plan
- `/plan-eng-review` — engineering critique of a plan before code exists
- `/plan-design-review` — design critique of tokens and direction
- `/review` — code review pass over a diff or a directory
- `/cso` — security review; the one that catches money and access bugs
- `/qa` — drives a real browser through the app and reports what breaks
- `/design-review` — visual pass at real breakpoints
- `/investigate` — root-cause a specific bug
- `/retro` — post-phase retrospective
- `/document-release` — release notes from commits
- `/ship` — final gate before pushing to production

## Safety & control
`/careful` (raise caution) · `/freeze` + `/unfreeze` (lock files from edits) · `/guard` (continuous
checkpoint mode). Use `/freeze` on `lib/unlock.ts` once its tests pass — it is the correctness core
and should not be casually edited.

## Web browsing
Use `/browse` for ALL web browsing. Never use `mcp__claude-in-chrome__*` tools.
