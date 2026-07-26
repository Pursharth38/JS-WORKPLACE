# MERGE NOTES — `dev-b-commerce` → integration branch

> Written by **Dev B**. Read this before merging this branch with Dev A's or Dev C's.
> Everything here exists because Dev B's Phases 6/7/10 had to be built while Dev A's
> Phase 1 foundation lived on another branch.

---

## 1. Files Dev B created that **Dev A owns** — take Dev A's version

These are transcriptions from the spec documents, not designs. Each carries a
`⚠️ FILE OWNER: DEV A` header comment. On merge, **prefer Dev A's version**, then
apply the reconciliation note.

| File | Dev A task | Reconciliation on merge |
|---|---|---|
| `package.json` | P1-01 | Take Dev A's, then **union the `dependencies` block** — Dev B added `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `razorpay`, `resend`, `@react-email/components`, `@react-pdf/renderer`, `@aws-sdk/client-s3`, `qrcode`, `@upstash/*`. |
| `tsconfig.json` | P1-01 | Take Dev A's. Dev B relies on `strict`, `noUncheckedIndexedAccess`, and the `@/*` path alias — confirm all three survive. |
| `next.config.ts` | P1-01 | Take Dev A's, then re-add `serverExternalPackages: ['@react-pdf/renderer']` or the certificate/invoice PDF routes fail to bundle. |
| `postcss.config.mjs` | P1-01 | Take Dev A's. |
| `app/layout.tsx` | P1-01/P1-03 | Take Dev A's wholesale (fonts, Plausible, Toaster). Dev B's is a bare shell. |
| `app/globals.css` | P1-02 | Take Dev A's wholesale. **Contract:** Dev B's pages reference brand colour only via the CSS custom properties `--brand-teal`, `--brand-teal-hover`, `--brand-teal-tint`, `--brand-amber`, `--brand-amber-hover`, `--brand-sand`, `--brand-ink`, `--brand-muted`, `--brand-line`, `--brand-danger`, `--brand-success`. If Dev A's token file renames any of these, Dev B's pages lose their colour — grep `var(--brand-` before landing. |
| `lib/db.ts` | P1-06 | Take Dev A's. Standard Prisma singleton; signature is `export const db`. |
| `lib/response.ts` | P1-06 | Take Dev A's **only if** it exports `apiResponse(status, message, data?)` with the `{success, message, data}` envelope. Dev B also added `paginated()`, `apiError()`, and `invalidInput()` — port these across if Dev A's version lacks them; every Dev B route uses them. |
| `lib/ratelimit.ts` | P1-06 | **Team decision (2026-07-25): default backend is an in-memory sliding window, NOT Upstash** — the Upstash free tier (10k commands/day) burns too fast for a hardening-only layer. Upstash activates automatically if `UPSTASH_REDIS_REST_URL/TOKEN` are set; interface is unchanged. On merge keep Dev B's version and add any limiter Dev A's routes need (`/api/leads` 5/h/IP). Exports: `rateLimit.{loginIp,loginEmail,signupIp,resetEmail,checkoutUser,certIssueUser,verifyIp}` + `clientIp(headers)`. |
| `prisma/schema.prisma` | P1-05 | Take Dev A's, then apply the **four Dev B additions** in §3 below. |

---

## 2. File Dev B created that **Dev C owns** — DELETE on merge

| File | Dev C task | Action |
|---|---|---|
| `lib/progress.ts` | P8-04 | **Delete it.** It is a fail-closed stub returning `{percentComplete: 0, currentModuleId: null, finalTestPassed: false}` so Dev B's dashboard typechecks. Dev C's real implementation replaces it. The exported signature is the agreed H5 contract — if Dev C's differs, that is a contract break to resolve before either branch lands, not a merge conflict to paper over. |

Dev B deliberately did **not** create `lib/unlock.ts`, `lib/stream.ts`, or `lib/grading.ts`.
No Dev B route calls them.

---

## 3. Prisma schema — five Dev B additions to port onto Dev A's version

1. **`model PasswordResetToken`** *(new model)* — not in `data-model.md`. Password
   reset needs its own single-use store. Reusing Auth.js's `VerificationToken`
   would let an email-verification token be replayed as a password-reset token,
   which is a full account takeover. Stores `tokenHash` (sha256), never the raw token.

2. **`AssessmentAttempt` → `@@index([userId, courseId, passed])`** — the H5
   eligibility read in `/api/certificate/issue` filters on
   `(userId, courseId, chapterId IS NULL, passed)`. Without this index it is a
   sequential scan on the hottest table in the LMS.

3. **`Payment` → `invoiceNumber String? @unique`, `updatedAt`, `@@index([userId, status])`** —
   GST invoice numbering must be unique and gap-free per financial year;
   `updatedAt` gives the payment lifecycle an audit timestamp.

4. **`User` → `updatedAt`** — needed to detect profile edits after `nameLocked`.

5. **`User` → `consentGivenAt DateTime?`** — DPDP evidence. The signup form's
   consent checkbox renders unticked and is required; this column records *when*
   consent was given. A boolean would not survive an audit that asks for a date.

Also note: `ModuleProgress.lastHeartbeatAt` is present. It appears in
`orchestrate/data-model.md` but is **missing from the Prisma block in
ARCHITECTURE.md §5**. `data-model.md` is correct — the field is the clamp basis for
Dev C's heartbeat and without it the delta clamp cannot be computed. Flag this to
Dev A so ARCHITECTURE.md §5 gets corrected.

---

## 4. Migration ordering

```
prisma/migrations/
├── 20260725000000_init/                      ← generated from Dev B's transcription; DISCARD if Dev A has its own init
└── 20260725000001_certificate_active_unique/ ← ★ KEEP. Dev B. Must run after whatever creates "Certificate".
```

`20260725000001` creates the **partial unique index** that backs certificate
idempotency:

```sql
CREATE UNIQUE INDEX cert_active_unique
  ON "Certificate"("userId","courseId") WHERE "revokedAt" IS NULL;
```

This is not optional and Prisma cannot express it in schema syntax. The
read-then-write check in the route handler is necessary but not sufficient —
two concurrent requests both pass the existence check. **If this index does not
exist in production, certificate issuance is not idempotent.**

---

## 5. Files Dev A must wire up

| Dev B artefact | Where Dev A drops it |
|---|---|
| `components/commerce/checkout-button.tsx` | `app/(marketing)/courses/[slug]/page.tsx` (task P3/P7-02). Takes `courseId`, `courseTitle`, `priceInPaise`, `isEnrolled`. Its Razorpay success handler **only redirects** — it never creates an enrolment. |
| `components/marketing/verify-result.tsx` | Already used by Dev B's `app/(marketing)/verify/[certId]/page.tsx`. Dev A should confirm it inherits the marketing layout. |

**Dev A blocker still outstanding:** `P3-05` (`/privacy`, `/terms`, `/refund-policy`)
blocks `P7-06` Razorpay account activation. Razorpay will not move the account off
test keys until those three URLs are live.

---

## 6. Routes Dev B added beyond CONTRACTS.md

| Route | Why |
|---|---|
| `GET /api/invoice/[paymentId]` | Authenticated invoice download. R2 objects are **private**; `Payment.invoiceUrl` / `Certificate.pdfUrl` store object **keys**, not public URLs, and every download re-checks ownership. Invoices are generated lazily on first download, not in the webhook. |
| `GET /api/certificate/[certId]/pdf` | Authenticated certificate download (owner or admin). Regenerates deterministically from the DB row on an R2 miss. The public surface stays `/verify/[certId]`. |

CONTRACTS.md should gain both entries when Dev A next touches it.

## 7. Open client questions surfaced by Dev B's build

1. **Refund policy on access** — `refund.processed` marks the payment REFUNDED but does
   NOT auto-revoke the enrolment or certificate; the admin panel surfaces it for manual
   action. Confirm with the client whether refunds should pull access automatically.
2. **P0-01 / P0-05 still gate shipping** — certificate issuance is code-complete but must
   not ship before the wording sign-off; `SELLER_GSTIN` stays empty until GST registration
   is confirmed (invoice renders without a tax line when unset).

## 8. Contracts Dev B publishes (H3, H4)

```ts
// lib/session.ts  → Dev C (H3)
getSession():     Promise<{ userId: string; role: 'LEARNER' | 'ADMIN' } | null>
requireSession(): Promise<{ userId: string; role: 'LEARNER' | 'ADMIN' } | null>
requireAdmin():   Promise<{ userId: string; role: 'ADMIN' } | null>

// lib/enrollment.ts → Dev C (H4)
isEnrolled(userId: string, courseId: string): Promise<boolean>
```

These are implemented, not stubbed. Dev C can build against them today.

---
---

# MERGE RESOLUTION — what Dev A actually did

> Appended by **Dev A**, 2026-07-25, merging `upstream/main` (Dev B, Phases 6/7/10)
> into Dev A's P1-01 foundation. Branch: `integration-a-b`.
> Dev B's notes above are the *proposal*; this section is the *record*.

## Verification after merge

| Check | Result |
|---|---|
| `npm run build` | ✅ 24 routes compile |
| `npm run typecheck` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm test` | ✅ **57 passed** (Dev B's notes said 53) |
| Forbidden-claim grep | ✅ clean across `app/ components/ lib/ emails/ design/ client/ .next/` |
| `videoUid` / `correctOptionId` leak grep | ✅ clean |
| Hardcoded contact details | ✅ clean |
| Bare `NextResponse.json` in `app/api/` | ✅ clean — every route goes through `apiResponse()` |
| Prisma imported in `proxy.ts` | ✅ clean — edge-safe, imports `auth.config` only |

## §1 — the 10 "borrowed" files: 6 replaced, 4 ADOPTED

Dev B's framing was "take Dev A's version". That was right for 6 files and wrong for 4,
because for those 4 Dev A had **not built anything yet** — there was no version to prefer.
Deleting working, spec-conformant code in order to retype it identically is waste.

**Replaced with Dev A's version (6):** `package.json` · `tsconfig.json` · `next.config.ts` ·
`postcss.config.mjs` · `app/layout.tsx` · `app/globals.css`

**Adopted as-is, ownership transferred to Dev A (4):** `lib/db.ts` · `lib/response.ts` ·
`lib/ratelimit.ts` · `prisma/schema.prisma`

Consequence: **P1-05 and P1-06 changed from build tasks to review tasks.** They are not
free — Dev A still owes a real review of the 271-line schema and still owes
`lib/schemas/leads.ts`. But they are no longer greenfield.

Reconciliations applied as instructed:
- `next.config.ts` — re-added `serverExternalPackages: ['@react-pdf/renderer']`. ✅
- `tsconfig.json` — `strict`, `noUncheckedIndexedAccess` and `@/*` all survive. ✅
- `package.json` — dependency blocks unioned. ✅
- `lib/response.ts` — Dev A had no version, so `paginated()` / `apiError()` /
  `invalidInput()` needed no porting. ✅

## §2 — `lib/progress.ts` was KEPT, not deleted (deviation)

Dev B said delete it. **Dev A restored it.** Three merged Dev B call sites import
`getCourseProgress` — `app/(learner)/dashboard/page.tsx`,
`app/api/dashboard/summary/route.ts`, `app/api/admin/learners/[id]/route.ts` — and Dev C's
lane has not started. Deleting it breaks `next build` for the entire duration of Phase 8.
A tree that does not compile is not a merged tree.

The stub is fail-closed (`0%` / no current module / final test **not** passed), so surviving
the merge cannot wrongly unlock content or show a certificate CTA. Logged as **merge debt
against P8-04** in the BLOCKED TASKS table so it cannot be quietly forgotten.
**Dev C: overwrite this file, do not merge into it.**

## §3 — defects found in Dev B's Dev-A-owned placeholders

These are not merge conflicts; they are bugs that the merge surfaced.

1. **White-on-amber fails AA.** Dev B's `.cta-amber` set `color: #fff` on `--brand-amber`
   — measured **3.29:1**. This is exactly P0-03 Finding 2. Now `var(--brand-accent-on)`
   = Ink `#101828`, **5.40:1**. The class is currently unused, so it was a latent trap
   rather than a live defect.
2. **Fonts would have silently broken.** Dev B's `globals.css` declared
   `--font-heading: 'Fraunces'` by *family name*, and 3 merged files consume it via
   `font-[family-name:var(--font-heading)]`. `next/font` self-hosts under generated names
   and never registers `'Fraunces'`, so post-merge every heading would have quietly fallen
   back to Georgia. `--font-heading` / `--font-body` now point at Dev A's
   `--font-fraunces` / `--font-inter`.
3. **Token values had drifted warm** off spec: ink `#1c1a17` (spec `#101828`), muted
   `#5f5a52` (spec Slate `#475467`), line `#e4ded4` (spec Border `#E4E7EC`), plus
   off-spec success/danger. Restored to the CLAUDE.md values.

## §4 — palette: the "no colour before P0-03" rule had to bend

Dev A's P1-01 deliberately committed **no** brand colour, because P1-02 is blocked on the
client's board pick. Dev B's lane carries **164 `var(--brand-*)` references across 25
files**. Undefined variables would have shipped a colourless UI, so a provisional palette
is now committed.

Mitigation: `app/globals.css` is split into a **SEMANTIC** block (`--brand-primary`,
`--brand-accent`, `--brand-surface`, …) and a **legacy alias** block that maps Dev B's
colour-named variables onto it (`--brand-teal` → `--brand-primary`). **P1-02 edits the
semantic block only.** If the client picks Board B (Indigo), exactly one file changes and
none of Dev B's 25 files are touched. Retiring the aliases is tracked as **P1-02b**.

## §5 — `typedRoutes` turned OFF (Dev A reversing a P1-01 decision)

P1-01 enabled `typedRoutes`. The merge proved it untenable *for now*: it found **7 dangling
link targets** in Dev B's UI — all planned-but-unbuilt routes, not typos.

| Dangling route | Owner | Task |
|---|---|---|
| `/privacy`, `/terms`, `/refund-policy` | A | P3-05 |
| `/contact` | A | P3-04 |
| `/courses` | A | P3 |
| `/posh-act` | A | P4-01 |
| `/learn/[courseSlug]` | C | P8-07 |

Keeping it on would require fake route stubs or ~12 `as Route` casts that rot into lies.
Turned off, with the inventory recorded and **P12-02 required to re-enable it and prove
zero dangling routes before launch**.

One cast was still needed and kept: `redirect(redirectTo as Parameters<typeof redirect>[0])`
in `app/(auth)/actions.ts`. The target is computed at runtime from `formData`; safety comes
from `sanitizeRedirect()`, which correctly rejects non-relative and protocol-relative
(`//`, `/\`) targets. That open-redirect guard was reviewed and is sound.

## §6 — other fixes the merge required

- `lib/auth.ts` — `EmailUnverifiedError.code` needed an `override` modifier under Dev A's
  `noImplicitOverride`.
- `components/commerce/payment-pending-banner.tsx` — `useRef(Date.now())` during render
  trips React 19's `react-hooks/purity`. Seeded inside the effect instead. Dev B never saw
  this because their `package.json` had **no ESLint at all**; Dev A's config reinstates it.
- `app/api/checkout/create-order/route.ts` — dropped an unused `clientIp` import.
- **`vitest` 2 → 4.1.10.** Dev B's pin carried a **critical** advisory (arbitrary file
  read/execute when the Vitest UI server is listening). All 57 tests pass on v4. Repo audit
  went 18 findings (1 critical) → 13 (0 critical). The remaining 12 highs are transitive
  through `next` itself (postcss, sharp) and the ESLint chain; `npm audit fix --force`
  "resolves" them by installing **next@9.3.3**, so they are accepted, not fixed.
- Added `.gitattributes` (`* text=auto eol=lf`) — three devs on mixed platforms were
  producing whole-file CRLF diffs.
- `next-env.d.ts` untracked; it is generated and is in `.gitignore`.

## §7 — carried forward, NOT actioned by this merge

- Dev B's §3 Prisma additions and §7 client questions stand as written. The refund-revokes-
  access question is still open with the client.
- ~~`ARCHITECTURE.md §5` is still missing `ModuleProgress.lastHeartbeatAt`~~ — **done.** Present
  at ARCHITECTURE.md §5 line 213 (verified during the integration-a-b → main merge, 2026-07-26).
- ~~`CONTRACTS.md` still needs entries for `/api/invoice/[paymentId]` and
  `/api/certificate/[certId]/pdf`~~ — **done, 2026-07-26.** Both documented under COMMERCE /
  CERTIFICATES in CONTRACTS.md.
- ~~Next 16 deprecation... the `middleware` file convention is deprecated in favour of
  `proxy`~~ — **done, 2026-07-26.** `git mv middleware.ts proxy.ts`; same default + `config`
  export shape, no behaviour change. Deprecation warning confirmed gone from `npm run build`.
- ~~`.env.example` contains `NEXT_PUBLIC_WHATSAPP_NUMBER`~~ — **already resolved at P1-08**
  before this note was written; `.env.example` documents the removal explicitly. This bullet
  was stale.
