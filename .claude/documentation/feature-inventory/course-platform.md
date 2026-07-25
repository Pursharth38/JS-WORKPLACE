# Course Platform — Feature Inventory
> `/courses`, `/learn/**`, `/dashboard`, `/verify/**`. Owners: Dev B (commerce, certs) + Dev C (learning).

## Course structure
```
Course
└── Chapter (ordered)
    ├── Module (ordered) — exactly one video each
    │   └── completes at ≥90% of durationSeconds watched
    └── Chapter assessment — 80% to pass → unlocks next chapter
Final test — 85% to pass, drawn across all chapters → certificate
```

## Screen inventory
| Screen | Route | Owner | Key states |
|---|---|---|---|
| Catalog | `/courses` | A | empty, populated |
| Sales page | `/courses/[slug]` | A+B | anonymous, enrolled, free-preview playing |
| Curriculum | `/learn/[slug]` | C | locked, in-progress, complete |
| Player | `/learn/[slug]/[moduleId]` | C | loading, playing, buffering, complete, locked-redirect |
| Assessment | `/learn/[slug]/chapter/[n]/assessment` | C | not-started, in-progress, passed, failed, cooldown |
| Final test | `/learn/[slug]/final-test` | C | locked, available, attempts-exhausted, passed |
| Dashboard | `/dashboard` | B | no enrolments, in-progress, complete |
| Certificates | `/dashboard/certificates` | B | none, issued, revoked |
| Verification | `/verify/[certId]` | B | valid, revoked, unknown |

## Gating matrix (test every cell)
| Actor | Free preview | Locked module | Unlocked module | Assessment | Final test |
|---|---|---|---|---|---|
| Anonymous | ✅ plays | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| Signed in, not enrolled | ✅ plays | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| Enrolled, prereq incomplete | ✅ plays | ❌ 403 | ✅ plays | ❌ 403 | ❌ 403 |
| Enrolled, all complete | ✅ plays | — | ✅ plays | ✅ | ✅ |

## Assessment behaviour
- Questions randomized per attempt from a larger Sanity pool; options shuffled
- Chapter 80%, final 85% — both stored as DB columns, not constants
- Unlimited retries; 10-minute cooldown after two consecutive failures
- Final test capped at 3 attempts per 24h
- Result shows **weak topics**, never a per-question answer key

## Certificate
- Wording locked: "Certificate of Completion — POSH Awareness Training"
- Contains: learner name (snapshot), course title, date, `certId`, verification URL, QR, signature
- `certId` format `JSWW-2026-A7K2P9` — non-sequential, non-guessable
- Idempotent issuance backed by a partial unique index
- Public verification returns `valid: false` for unknown IDs — never `404` (prevents enumeration)
