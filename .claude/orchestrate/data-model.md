# Data Model — Every Schema
> Reference spec for Prisma models and Sanity documents. Field-level, no implementation code.
> Contracts: ../CONTRACTS.md · Map: codebase.md

---

## CONVENTIONS (apply to all Prisma models)

- **IDs:** `cuid()` for internal primary keys. Never expose a sequential integer.
- **Timestamps:** `createdAt` on every model; `updatedAt` where rows mutate.
- **Money:** integer **paise** (INR). Never float, never rupees-as-decimal.
- **Soft delete:** prefer status transitions or a `revokedAt` timestamp over hard deletes on
  anything auditable (certificates, payments).
- **Secrets:** `passwordHash` is never selected into an API response. `correctOptionId` lives in
  Sanity and is stripped server-side before serialization — it never enters Postgres.
- **Sanity mirror:** `Course`, `Chapter`, `Module` carry `sanityId` (unique). Postgres stores only
  what gating needs — never body copy, never descriptions.
- **Ordering:** `order` is an Int with a compound unique on its parent, so reordering in Sanity
  cannot produce duplicates in the mirror.

Legend: `*` required · `?` optional · `→` relation · `[]` list · `enum(...)`.

---

# IDENTITY

## User
| field | type | notes |
|---|---|---|
| id* | String | cuid |
| email* | String | unique |
| emailVerified? | DateTime | |
| passwordHash? | String | null for OAuth-only accounts |
| name* | String | **printed on the certificate — legal name** |
| nameLocked* | Boolean | default false → true on first certificate issue |
| phone? | String | |
| image? | String | |
| role* | enum(LEARNER, ADMIN) | default LEARNER |
| createdAt* | DateTime | |

Relations: `accounts[]`, `sessions[]`, `enrollments[]`, `moduleProgress[]`, `attempts[]`,
`certificates[]`, `payments[]`.

> Auth.js also requires `Account`, `Session`, and `VerificationToken` — use the standard Prisma
> adapter schema verbatim. Do not hand-roll them.

---

# COURSE STRUCTURE (mirror of Sanity)

## Course
| field | type | notes |
|---|---|---|
| id* | String | cuid |
| sanityId* | String | unique |
| slug* | String | unique |
| title* | String | |
| priceInPaise* | Int | **the only price authority — checkout reads this** |
| isPublished* | Boolean | default false |
| passThreshold* | Int | default 85 — final test % |

## Chapter
| field | type | notes |
|---|---|---|
| id*, sanityId* | String | sanityId unique |
| courseId* | → Course | onDelete: Cascade |
| order* | Int | `@@unique([courseId, order])` |
| title* | String | |
| passThreshold* | Int | default 80 — chapter assessment % |

## Module
| field | type | notes |
|---|---|---|
| id*, sanityId* | String | sanityId unique |
| chapterId* | → Chapter | onDelete: Cascade |
| order* | Int | `@@unique([chapterId, order])` |
| title* | String | |
| videoUid* | String | **Cloudflare Stream UID — never emitted for a locked module** |
| durationSeconds* | Int | completion = ≥90% of this, cumulative |
| isFreePreview* | Boolean | default false — unlocked for everyone |

---

# STATE

## Enrollment
| field | type | notes |
|---|---|---|
| id* | String | |
| userId* → User, courseId* → Course | | `@@unique([userId, courseId])` |
| paymentId? | String | unique |
| enrolledAt* | DateTime | |
| completedAt? | DateTime | |

> **Kept as a join table on purpose.** A future B2B layer (`Organization → Seat → Enrollment`)
> bolts on without migrating learner data. Do not collapse this into a column on `User`.

## ModuleProgress
| field | type | notes |
|---|---|---|
| userId* → User, moduleId* → Module | | `@@unique([userId, moduleId])` |
| secondsWatched* | Int | default 0 — cumulative, **server-clamped** |
| lastPositionSec* | Int | default 0 — resume point |
| lastHeartbeatAt? | DateTime | server-stored; clamp basis for the next delta |
| completedAt? | DateTime | set when secondsWatched ≥ 0.9 × durationSeconds |

**Clamp rule:** `delta ≤ (now − lastHeartbeatAt) × 1.5`. Without this, a client POSTs
`delta: 999999` and completes a 45-minute module instantly.

## AssessmentAttempt
| field | type | notes |
|---|---|---|
| userId* → User | | |
| chapterId? → Chapter | | **null ⇒ final test** |
| courseId* | String | denormalized for the final-test query |
| scorePercent* | Int | |
| passed* | Boolean | |
| answers* | Json | `{ questionId: selectedOptionId }` |
| startedAt* | DateTime | |
| submittedAt? | DateTime | |

Index: `@@index([userId, chapterId])`.
Final-test pass query (the H5 contract B consumes): `chapterId IS NULL AND passed = true`.

## Certificate
| field | type | notes |
|---|---|---|
| certId* | String | unique · `JSWW-2026-A7K2P9` — human-readable, non-sequential |
| userId* → User, courseId* | | |
| learnerName* | String | **snapshot at issue time** — not a live join |
| issuedAt* | DateTime | |
| pdfUrl* | String | R2 object URL |
| revokedAt?, revokeReason? | | |

**Idempotency:** partial unique index on `(userId, courseId) WHERE revokedAt IS NULL`.
A double-submit must return the existing `certId`, not mint a second.

## Payment
| field | type | notes |
|---|---|---|
| userId* → User, courseId* | | |
| razorpayOrderId* | String | unique |
| razorpayPaymentId? | String | unique — set by the webhook |
| amountInPaise* | Int | **copied from Course at order creation** |
| currency* | String | default "INR" |
| status* | enum(CREATED, PAID, FAILED, REFUNDED) | default CREATED |
| invoiceUrl? | String | |

## Lead
| field | type | notes |
|---|---|---|
| name*, email* | String | |
| phone?, organization?, employeeCount?, serviceInterest?, message? | String | |
| source* | String | 'demo' · 'checklist' · 'assessment' · 'newsletter' |
| consentGiven* | Boolean | **DPDP — must come from an unticked checkbox** |
| createdAt* | DateTime | |

Index: `@@index([source, createdAt])`.

---

# SANITY DOCUMENTS

| Document | Fields | Owner |
|---|---|---|
| `course` | title, slug, price, description, outcomes[], faqs[], chapters[] | A |
| `chapter` | title, order, modules[], assessment{questions[]} | A |
| `module` | title, order, streamVideoUid, duration, isFreePreview, notes(PortableText) | A |
| `question` | text, options[{id,text}], **correctOptionId**, topic, explanation | A |
| `post` | title, slug, excerpt, cover, body, categories[], publishedAt, seo{} | A |
| `service` | title, slug, icon, summary, body, deliverables[], ctaLabel | A |
| `poshSection` | title, anchor, group, order, body(PortableText) | A |
| `faq` | question, answer, category | A |
| `testimonial` | quote, author, role, org, logo | A |
| `siteSettings` | whatsappNumber, phone, email, socials, ytChannelId, igPosts[] | A |

**`correctOptionId` lives only in Sanity.** It is fetched server-side in
`/api/assessment/[chapterId]/start`, used for grading in `/submit`, and stripped before any
response is serialized. It must never be written into Postgres or into an RSC payload.

**`poshSection.anchor`** becomes a deep link (`/posh-act#ic-constitution`). People share these.
Once launched, an anchor is a permanent URL — never rename one without a redirect.

---

# SYNC: SANITY → POSTGRES

On publish, Sanity fires a webhook → `/api/webhooks/sanity`:
1. Verify `SANITY_WEBHOOK_SECRET`.
2. Upsert `Course` / `Chapter` / `Module` by `sanityId` — **structure only**.
3. `revalidateTag()` the affected content tags.

Never write body copy, descriptions, or question text into Postgres. If a query needs content,
it fetches from Sanity. If a gate needs structure, it reads Postgres.

---

# RELATIONSHIP SUMMARY

```
User ─┬─< Enrollment >─┬─ Course ─< Chapter ─< Module
      │                │            │           │
      ├─< Payment ─────┘            │           └─< ModuleProgress >─ User
      ├─< AssessmentAttempt >───────┘
      └─< Certificate
```
