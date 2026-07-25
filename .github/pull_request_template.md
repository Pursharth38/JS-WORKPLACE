## What this changes

<!-- One or two sentences. What does a reviewer need to know before reading the diff? -->

## Task

<!-- e.g. P3-05, or "no board task — hotfix". Update orchestrate/tasks.md in this PR. -->

Board task:

---

## Checks

CI enforces the automated ones. These are the judgement calls it cannot make.

**Ownership**

- [ ] Every file I touched is in my lane (`orchestrate/agents/*.md`), or I have said below why not
- [ ] I did not edit another dev's `lib/` contract without telling them

**Security** — see CLAUDE.md "WHAT NOT TO DO"

- [ ] No price, amount, or courseId→price mapping read from a request body
- [ ] No `Enrollment` created outside the verified Razorpay webhook
- [ ] No `correctOptionId` or locked-module `videoUid` in any response or RSC payload
- [ ] No client-reported watch delta trusted without a server clamp
- [ ] No Prisma call from edge middleware
- [ ] No `err.message`, stack trace, or `passwordHash` returned to a client
- [ ] Every new API boundary parses its body with a Zod schema

**Legal / brand** — see CLAUDE.md §1

- [ ] No forbidden authority claim (the client is **not** MWCD empanelled)
- [ ] No invented testimonial, client logo, statistic or trained-employee count
- [ ] Any new lead form has an **unticked** consent checkbox
- [ ] No text copied or close-paraphrased from a competitor

**Content**

- [ ] Anything the client would reasonably want to edit lives in Sanity, not in JSX
- [ ] No hardcoded phone, email, WhatsApp number or address

**Frontend**

- [ ] No raw hex — colour comes from the `--brand-*` tokens in `globals.css`
- [ ] Amber is only used on fills ≥18px, and its label is Ink, never white
- [ ] Keyboard reachable; visible focus ring; tested at 375px
- [ ] Any animation is skipped under `prefers-reduced-motion`

---

## If you changed a contract

<!-- Deleted or renamed an export in lib/? Changed an API response shape? Say so
     here and tell the affected dev. Handoffs H1–H5 are in CLAUDE.md. -->

## Notes for the reviewer

<!-- Anything you are unsure about, or deliberately did not do. Better here than
     discovered in review. -->
