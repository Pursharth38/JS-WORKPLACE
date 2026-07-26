# JS Workplace Wellness — Project Status

> Snapshot as of 2026-07-26. `main` on GitHub is at commit `0fc8e8d`.
> Full history: `.claude/orchestrate/tasks.md` (live board) · `MERGE-NOTES.md` (merge decisions) ·
> `.claude/documentation/CMS-MIGRATION-PLAN.md` (CMS migration plan + amendments).

---

## ✅ Done

### Dev A — Platform & Content
- Next.js 16 + TypeScript strict + Tailwind v4 repo, design tokens, layout shell, UI primitives
- Prisma schema + first migration, `apiResponse()` envelope, Zod schema folder
- CI pipeline: typecheck → lint → test → build → forbidden-claims grep → gated-content grep
- Sanity CMS connected, schemas built, Studio embedded at `/studio`, sync webhook live
- All marketing pages: home, about, services, courses, blog, FAQ, contact, book-demo, legal pages
- Knowledge Hub (`/posh-act`) with 8 real sections, IC Quick Reference, lead magnet, compliance self-check
- Phase 11 motion/embeds: 3 animated explainers (DOM + `motion`, not Lottie), YouTube façade, Instagram grid
- Client-directed redesign: cream/bronze light + navy/gold dark theme, real dark mode toggle, `HowItWorks` section, border-beam hover effect

### Dev B — Identity & Commerce
- Auth.js v5: credentials + Google OAuth, email verification, password reset, edge-safe middleware
- Razorpay checkout (price read from DB, never the client) + HMAC-verified webhook (the only place an enrolment is created)
- Certificate issuance (idempotent), PDF generation, public `/verify/[certId]`, admin revocation
- Invoices, learner dashboard, admin overview (enrolments, payments, leads CSV)
- 53 original unit/integration tests covering webhook replay, cert races, signature forgery

### CMS Migration (Sanity → Postgres, branch `cms-migration`, merged into `main`)
- Full admin CMS (`/admin/*`) for 9 content types + courses/chapters/modules/questions — all built and tested through the real forms, not shortcuts
- Rich text stored as validated Tiptap JSON (not raw HTML) — no `dangerouslySetInnerHTML`, no sanitizer needed
- Image pipeline: admin upload + AI-generated cover images (Gemini) + public serving, all through the same magic-byte security check
- **Flip rule**: every content type serves from Postgres once it has rows there, Sanity otherwise — both systems coexist safely, nothing had to go live at once
- Migration script (`scripts/migrate-sanity-to-postgres.mts`) with a dry run — tested against the live Sanity project: 26/26 documents ready, 0 skipped

### Full E2E test pass (this session)
- 3 real identities (admin / buyer / guest) tested against every route
- Security matrix: role-gating, price-tampering resistance, webhook signature verification, answer-key leak checks — all held
- Found and fixed 1 real bug (upload errors showed a generic message instead of the real reason)
- 78/78 tests, clean typecheck, clean lint, clean production build, both security greps clean

**Everything above is merged into `main` and pushed to GitHub.**

---

## ⬜ Left

### Not code — needs a human/business decision
| Item | What's needed |
|---|---|
| Certificate wording sign-off | Client approval of the exact certificate text |
| 80% pass threshold sign-off | Client approval (100% + retries is brute-forceable — already explained) |
| Colour board pick | Client picks between the two comps in `design/colour-boards/` |
| Knowledge Hub content | Client supplies remaining sections (8 of ~35 exist) |
| GST / pricing / coupon confirmation | Client answers |

### Not code — needs external action
| Item | What's needed |
|---|---|
| Razorpay live activation | Real KYC on Razorpay's dashboard (test mode works now) |
| CMS cutover | Run the migration script for real, then retire Sanity Studio + the sync webhook — deliberately deferred until you've used `/admin` yourself |

### Code — genuinely not started
| Item | Owner | Status |
|---|---|---|
| Video gating + signed Stream tokens | Dev C | Not started |
| Progress tracking / heartbeat | Dev C | Not started |
| Assessment engine (chapter + final tests) | Dev C | Not started (blocked on the 80% sign-off above) |
| `lib/unlock.ts` — the gating correctness core | Dev C | Not started |

### Housekeeping
- `/cso` security review skill on the payment path — recommended, not yet run
- `/qa` full-site QA skill pass — blocked on a Claude Code restart (gstack skill registration)
- One uncommitted formatting-only diff in `app/api/compliance-check/route.ts` (no functional change, safe to commit whenever)

---

## Bottom line

The **marketing site + commerce + admin CMS** are done, tested, and live on `main`. The **learning engine** (the actual course-watching experience) is the only major code gap left, and it hasn't been started by anyone yet. Everything else remaining is either a client decision or an external account setup, not a coding task.
