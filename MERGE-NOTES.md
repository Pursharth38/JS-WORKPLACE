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
| `lib/ratelimit.ts` | P1-06 | Take Dev A's, then add the limiters Dev B needs: `loginIp`, `loginEmail`, `signupIp`, `resetEmail`, `checkoutUser`, `certIssueUser`, `verifyIp`, plus the `clientIp(headers)` helper. |
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
