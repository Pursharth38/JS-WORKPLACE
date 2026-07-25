# JS Workplace Wellness — Feature Inventory & E2E QA Plan
> Surface map of every page and the workflows QA must cover.
> Per-surface detail: [knowledge-hub.md](knowledge-hub.md) · [course-platform.md](course-platform.md)

## Surfaces
| Surface | Routes | Owner |
|---|---|---|
| Marketing | `/`, `/about`, `/services`, `/services/[slug]`, `/contact`, `/book-demo` | A |
| Knowledge Hub | `/posh-act` | A |
| Content | `/blog`, `/blog/[slug]`, `/blog/category/[cat]`, `/faq`, `/posh-compliance-check` | A |
| Legal | `/privacy`, `/terms`, `/refund-policy` | A |
| Course sales | `/courses`, `/courses/[slug]` | A + B |
| Auth | `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` | B |
| Learner | `/dashboard`, `/dashboard/certificates`, `/dashboard/invoices` | B |
| Learning | `/learn/[courseSlug]`, `/learn/[courseSlug]/[moduleId]`, `/learn/[courseSlug]/chapter/[n]/assessment`, `/learn/[courseSlug]/final-test` | C |
| Public verify | `/verify/[certId]` | B |
| Admin | `/studio`, `/admin` | A / B |

## E2E workflows — the QA spine
1. **Anonymous browse** — home, Knowledge Hub, blog, services. Zero console errors, zero forbidden claims.
2. **Knowledge Hub navigation** — every TOC anchor scrolls and scroll-spy tracks; deep link loads at the right section.
3. **Lead capture** — book-demo, lead magnet, compliance self-check. Consent unticked by default; submitting without consent fails.
4. **Signup → email verification → login.**
5. **Free preview** — plays without an account; nothing beyond the preview module is reachable.
6. **Checkout** — Razorpay test mode → webhook fires → enrolment appears → dashboard shows the course.
7. **Sequential unlock** — module 1 → 90% watched → module 2 unlocks; module 3 stays locked.
8. **Chapter assessment** — fail, fail again, cooldown enforced, pass, next chapter unlocks.
9. **Final test** — pass → certificate issued → downloadable → `/verify/[certId]` shows valid.
10. **Certificate revocation** (admin) → verification flips to revoked.
11. **Content edit in Sanity** → webhook → change visible without a deploy.
12. **Mobile pass** at 375px on every surface.

## Invariants checked on every route
- No forbidden authority claims in the rendered DOM
- No `correctOptionId` in any network response
- No `videoUid` for a locked module in any payload
- Consent checkboxes render unticked
- axe-core zero violations
