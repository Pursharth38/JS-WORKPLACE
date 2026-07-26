# Codebase Map
> Where every file lives and what it owns. Never guess locations — check here first.
> Architecture: ../ARCHITECTURE.md · Schemas: data-model.md · API: ../CONTRACTS.md

---

## APP ROUTES: app/

```
app/
├── layout.tsx                        ← Root. Fonts (Fraunces + Inter), Plausible, Toaster.
├── globals.css                       ← Tailwind + CSS variables from design tokens
│
├── (marketing)/                      ← [A] SSG/ISR. No client fetching on first paint.
│   ├── layout.tsx                    ← Header + Footer + WhatsAppFAB
│   ├── page.tsx                      ← Home (Phase 11 animations wired in — DOM+motion, not Lottie)
│   ├── about/page.tsx
│   ├── services/page.tsx
│   ├── services/[slug]/page.tsx
│   ├── posh-act/page.tsx             ← KNOWLEDGE HUB — the SEO centerpiece
│   ├── posh-compliance-check/page.tsx
│   ├── blog/page.tsx
│   ├── blog/[slug]/page.tsx
│   ├── blog/category/[cat]/page.tsx
│   ├── faq/page.tsx
│   ├── courses/page.tsx
│   ├── courses/[slug]/page.tsx       ← Sales page + free-preview module
│   ├── contact/page.tsx
│   ├── book-demo/page.tsx
│   ├── verify/[certId]/page.tsx      ← PUBLIC cert verification  [B]
│   └── (legal)/
│       ├── privacy/page.tsx          ← [A] BLOCKS Razorpay activation
│       ├── terms/page.tsx
│       └── refund-policy/page.tsx
│
├── (auth)/                           ← [B]
│   ├── login/  signup/  verify-email/  forgot-password/  reset-password/
│
├── (learner)/                        ← middleware-protected
│   ├── dashboard/page.tsx            ← [B]
│   ├── dashboard/certificates/page.tsx
│   ├── dashboard/invoices/page.tsx
│   └── learn/[courseSlug]/
│       ├── page.tsx                  ← [C] curriculum overview
│       ├── [moduleId]/page.tsx       ← [C] player
│       ├── chapter/[n]/assessment/page.tsx
│       └── final-test/page.tsx
│
├── admin/                             ← [B, expanded by CMS migration 2026-07-26 — see below]
│   ├── page.tsx  layout.tsx  actions.ts       role=ADMIN, nav shell owns requireAdmin() per render
│   ├── blog/{page,[id]/page,actions}.tsx      posts + inline category manager
│   ├── courses/{page,[courseId]/page,actions}.tsx
│   │   └── [courseId]/[chapterId]/{page, module/[moduleId]/page, question/[questionId]/page}.tsx
│   ├── services/  posh-hub/  ic-reference/  faq/  testimonials/  instagram/  cta-bands/
│   │   each: {page,[id]/page,actions}.tsx — same list+edit+reorder pattern
│   └── settings/{page,actions}.tsx            SiteSettingsRow singleton upsert
├── studio/[[...tool]]/page.tsx       ← [A] Sanity Studio — EXCLUDED from auth middleware, STILL LIVE
│
├── sitemap.ts  robots.ts             ← [A] generated from Sanity
├── opengraph-image.tsx               ← [A] per-route OG images
│
└── api/
    ├── auth/[...nextauth]/route.ts   ← [B]
    ├── checkout/create-order/route.ts← [B] PRICE FROM DB
    ├── webhooks/
    │   ├── razorpay/route.ts         ← [B] HMAC verified, idempotent, replay-safe
    │   └── sanity/route.ts           ← [A] secret verified, structure upsert, revalidate — STILL LIVE, unaffected by the CMS migration until cutover
    ├── video/token/[moduleId]/route.ts   ← [C] signed ≤5min, re-checks enrol + unlock
    ├── progress/heartbeat/route.ts   ← [C] server-clamped delta
    ├── assessment/
    │   ├── [chapterId]/start/route.ts    ← [C] STRIPS correctOptionId
    │   └── [attemptId]/submit/route.ts   ← [C] server-grade only
    ├── certificate/
    │   ├── issue/route.ts            ← [B] idempotent; runtime='nodejs'
    │   └── [certId]/verify/route.ts  ← [B] public
    ├── leads/route.ts                ← [A] rate-limited, honeypot, Turnstile
    ├── youtube/latest/route.ts       ← [C] public, no auth. Caching lives in lib/youtube.ts
    ├── admin/upload/route.ts         ← [CMS migration] ADMIN only, magic-byte sniffed, R2 content/ prefix
    └── images/[...key]/route.ts      ← [CMS migration] PUBLIC, but serves ONLY the content/ prefix —
                                          certificates/invoices in the same private R2 bucket stay
                                          unreachable by construction
```

---

## COMPONENTS: components/

```
components/
├── ui/                               ← [A] primitives, no domain logic
│   button · input · select · checkbox · card · badge · modal · toast
│   skeleton · accordion · tabs · turnstile
│
├── marketing/                        ← [A] unless noted
│   header (sticky, mega-menu) · footer · whatsapp-fab · container
│   hero · stat-band · service-card · course-card · post-card
│   testimonial-slider · cta-band · lead-form · newsletter-form
│   toc-sidebar (scroll-spy) · reading-progress · back-to-top
│   prose-block · callout-box · rich-text ← [CMS migration] format-detecting: prose-block renders
│                            EITHER Portable Text OR a Tiptap doc (RichBody union) so no page
│                            changed when its content type migrated; rich-text is the Tiptap-only
│                            renderer prose-block delegates to
│   complaint-journey        ← [C]'s Animation B, built DOM+`motion` (not Lottie)
│   harassment-spectrum      ← [C]'s Animation A, built DOM+`motion` (not Lottie)
│   workplace-protection     ← [C]'s Animation C, built DOM+`motion` (not Lottie)
│   youtube-lite       ← [C] click-to-load façade, no iframe until clicked
│   insta-grid         ← [C] renders content-layer `instagramPost` docs (Sanity or Postgres,
│                            transparent via the flip rule), no live API
│   (no lottie-loop — no Lottie JSON exists in this project; see DECISIONS LOG 2026-07-26)
│
├── learn/                            ← [C] unless noted
│   video-player · curriculum-tree (lock states) · progress-ring
│   quiz-runner · result-panel
│   certificate-card   ← [B]
│   verify-result      ← [B]
│
└── admin/                             ← [CMS migration, 2026-07-26]
    ├── crud/           shared kit: fields.tsx · image-field.tsx · save-bar.tsx (2-step delete,
    │                   no browser confirm()) · reorder-buttons.tsx · list-page.tsx · types.ts
    ├── editor/         Tiptap custom nodes: callout-node.tsx · data-table-node.tsx
    ├── rich-text-editor.tsx   the Tiptap instance every content form embeds
    ├── upload-image.ts         client → POST /api/admin/upload helper
    ├── nav.tsx                 admin section tabs (used by app/admin/layout.tsx)
    └── {blog,course,chapter,module,question,service,posh-section,quick-reference,
        cta-band,testimonial,instagram,settings}-form.tsx  one form per content type,
        each a thin composition of the crud/ kit + rich-text-editor
```

---

## LIBRARY: lib/

```
lib/
├── schemas/            ← [owner of each route] Zod, one file per API boundary
│   checkout.ts · leads.ts · progress.ts · assessment.ts · auth.ts · certificate.ts
│
├── auth.ts             ← [B] Auth.js v5 config, providers, callbacks
├── session.ts          ← [B] getSession(), requireSession()  → CONTRACT for C
├── enrollment.ts       ← [B] isEnrolled(userId, courseId)     → CONTRACT for C
├── razorpay.ts         ← [B] client + HMAC verify (timingSafeEqual)
├── certificate.ts      ← [B] certId generation + PDF render
│
├── db.ts               ← [A] Prisma singleton
├── response.ts         ← [A] apiResponse() — ALL routes use this
├── sanity.ts           ← [A] client + typed GROQ helpers. STILL the source of truth for any
│                            content type with zero Postgres rows (the flip rule) — not dead code
├── seo.ts              ← [A] JSON-LD builders
│
├── content.ts          ← [CMS migration] THE façade — every page imports content from here,
│                            never from lib/sanity.ts or lib/content/* directly. Re-exports
│                            Sanity getters for unmigrated types, Postgres getters for migrated
│                            ones. Its header comment is the live migration-state checklist.
├── content/             ← [CMS migration] Postgres-backed getters, one file per type family
│   simple.ts    faq · testimonial · service · instagramPost · siteSettings
│   blog.ts      post/category — published = isPublished AND publishedAt ≤ now
│   hub.ts       poshSection · quickReference · ctaBand
│   courses.ts   course/chapter/module — PUBLIC path; videoUid never selected, at any depth
├── richtext.ts          ← [CMS migration] Tiptap JSON: the Zod write-gate (security boundary —
│                            unknown nodes/attrs/hrefs rejected), RichBody coexistence type,
│                            plain-text + reading-time derivations
├── portable-text-to-tiptap.ts  ← [CMS migration] PT → Tiptap converter for the migration script;
│                            output re-validated by the same gate as the live editor
├── images.ts             ← [CMS migration] content/ key convention, magic-byte sniffing
├── admin-content.ts       ← [CMS migration] FormData parsing helpers + the reorder-swap algorithm
│                            shared by every admin CRUD action
├── posh-groups.ts         ← [A, pre-existing] the 11 Knowledge Hub groups; both sanity/schemas/
│                            and app/admin/posh-hub import this so the group list has one owner
│
├── unlock.ts           ← [C] ★ THE CORRECTNESS CORE — two reviewers required
├── stream.ts           ← [C] Cloudflare Stream signed-token minting
├── progress.ts         ← [C] heartbeat clamping + completion math
│                            exports getCourseProgress() → CONTRACT for B
├── grading.ts          ← [C] server-side scoring + topic feedback
└── ratelimit.ts        ← [A] Upstash wrappers per endpoint
```

**`lib/unlock.ts` is the single authority for gating.** Every route that reveals content calls
`computeUnlockState(userId, courseId)`. No route re-implements a gate inline.

**`lib/content.ts` is the single authority for content source.** Every page reads through it; no
page imports `lib/sanity.ts` or `lib/content/*` directly (the sole exception is
`app/api/webhooks/sanity/route.ts`, which is Sanity-sync plumbing, not a content read).

---

## SANITY: sanity/

```
sanity/
├── schemas/            ← [A]
│   course.ts · chapter.ts · module.ts · question.ts
│   post.ts · service.ts · poshSection.ts · faq.ts
│   testimonial.ts · instagramPost.ts · siteSettings.ts · index.ts
├── desk-structure.ts   ← [A] custom Studio nav so the client is not lost
└── env.ts
```

**STILL FULLY LIVE.** The CMS migration (2026-07-26, branch `cms-migration`) does not touch this
directory — Studio, its schemas, and `/api/webhooks/sanity` remain the source of truth for any
content type that has zero rows in its Postgres equivalent (see `lib/content.ts`'s flip rule).
Deletion is a separate, explicitly-approved future cutover step — not part of M1–M6-prep.

---

## OTHER

```
prisma/schema.prisma    ← [A] owns file; migrations owned by the model's owner
emails/                 ← [B] React Email templates (verify, reset, welcome, receipt)
                             [A] owns lead-magnet + compliance-report templates
(no public/lottie/ — the three Phase 11 animations are DOM+`motion`, not Lottie JSON; see
                             DECISIONS LOG 2026-07-26 and components/marketing/complaint-journey.tsx)
lib/youtube.ts          ← [C] YouTube Data API v3, 6h fetch-cache with stale-on-error fallback
tests/
├── unit/               ← unlock.test.ts [C] · grading.test.ts [C] · certId.test.ts [B]
├── integration/        ← webhook-idempotency [B] · cert-idempotency [B] · sanity-sync [A]
└── e2e/                ← full-journey.spec.ts [all] · a11y.spec.ts [all]
.github/workflows/ci.yml← [A] typecheck → lint → test → build → forbidden-grep → Lighthouse
```

---

## NON-APP DELIVERABLES  (added 2026-07-25, Phase 0)

Not shipped, not built, not imported by the app. Client-facing artefacts and the design evidence behind
them. Kept out of `app/` deliberately so nothing here can leak into a route or the built output.

```
design/
└── colour-boards/      ← [A] P0-03
    ├── index.html          Static two-board comp. Identical layout/copy in both boards so
    │                       feedback is about COLOUR only. Open in a browser; no build step.
    └── CONTRAST-REPORT.md  Measured WCAG 2.1 ratios for both boards + 4 findings.
                            Feeds P1-02 tokens and is the input to P1-R /plan-design-review.

client/                 ← [A] P0-04 — documents sent TO the client, in her language not ours
├── P0-04-content-inventory-request.md   Knowledge Hub content request. 35 sections split into
│                                        3 waves; Wave 1 = 14 and unblocks the Phase 4 build.
└── knowledge-hub-section-template.md    Per-section fill-in template + worked example.
```

**Rules for these two directories.** They are still subject to the forbidden-claim grep — CI must scan
them alongside `app/`. They must never invent a statistic, testimonial or client count; the comp uses
visible `[bracketed placeholders]` for every number for exactly this reason. Nothing here is imported by
Next.js and nothing here ships.

---

## FILE CREATION ORDER (follows tasks.md phases)

```
1.  package.json, tsconfig, tailwind.config, globals.css      P1  [A]
2.  prisma/schema.prisma + first migration                    P1  [A]
3.  lib/db.ts, lib/response.ts, lib/schemas/                  P1  [A]
4.  components/ui/*, components/marketing/header|footer       P1  [A]  → H1
5.  sanity/schemas/*, app/studio, api/webhooks/sanity         P2  [A]  → H2
6.  app/(marketing)/* + legal pages                           P3  [A]  → unblocks P7-06
7.  app/(marketing)/posh-act                                  P4  [A]
8.  blog, faq, lead magnet, compliance check                  P5  [A]  → SHIP STAGE 1
9.  lib/auth.ts, lib/session.ts, app/(auth)/*, proxy.ts  P6  [B]  → H3
10. lib/razorpay.ts, api/checkout, api/webhooks/razorpay      P7  [B]  → H4
11. lib/stream.ts, lib/unlock.ts (+tests FIRST), api/video    P8  [C]
12. lib/progress.ts, api/progress, components/learn/*         P8  [C]
13. lib/grading.ts, api/assessment/*                          P9  [C]  → H5
14. lib/certificate.ts, api/certificate/*, /verify            P10 [B]
15. components/marketing/{harassment-spectrum,workplace-       P11 [C]  (done 2026-07-26,
    protection,youtube-lite,insta-grid}, lib/youtube.ts,                 by B — no Lottie,
    api/youtube/latest, sanity/schemas/instagramPost.ts                 see DECISIONS LOG)
16. sitemap, robots, opengraph, JSON-LD                       P12 [A]
```

---

## CURRENT FILE STATUS

**Dev A P1-01 + Dev B Phases 6/7/10 are MERGED** (branch `integration-a-b`, 2026-07-25).
Next 16.2.11 · React 19.2.4 · TypeScript strict · Tailwind v4.

Root config (all [A]):
```
package.json          npm. Scripts: dev · build · start · lint · typecheck
tsconfig.json         strict + noUncheckedIndexedAccess + noImplicitOverride
                      + noFallthroughCasesInSwitch. allowJs false. Alias @/* → repo root.
next.config.ts        typedRoutes · poweredByHeader:false · serverExternalPackages
                      ['@react-pdf/renderer']  ← Dev B's PDF routes need the last one
eslint.config.mjs     next core-web-vitals + typescript; no-explicit-any and
                      ban-ts-comment escalated to error; design/ and client/ ignored
postcss.config.mjs    @tailwindcss/postcss
.gitignore            + next-env.d.ts, .vercel, build/, *.pem
public/.gitkeep       Next's default next.svg/vercel.svg and favicon were NOT kept —
                      framework branding has no place on a client site
```

Dev A app files:
```
app/layout.tsx        Fraunces + Inter via next/font (self-hosted woff2, no Google
                      request, no third-party cookie surface). metadataBase from
                      NEXT_PUBLIC_SITE_URL. Plausible + Toaster still to come.
app/globals.css       ★ MERGED TOKEN LAYER. Typography is locked and real. Colour is
                      a PROVISIONAL Board A placeholder — committed only because Dev B's
                      merged lane carries 164 var(--brand-*) refs across 25 files and
                      undefined vars would ship a colourless UI. P1-02 edits the
                      SEMANTIC block only; if Board B wins, no file outside this one
                      changes. Legacy colour-named aliases (--brand-teal etc.) point at
                      the semantic names — do not add new uses.
app/page.tsx          P1-01 placeholder. Replaced by P3-01.
```

> **Correction to this document:** Tailwind v4 is CSS-first. There is **no `tailwind.config.ts`** — the
> line in FILE CREATION ORDER below that says `tailwind.config` means the `@theme` block in
> `app/globals.css`, which is what the `app/` tree at the top of this file already described.

---

## CMS MIGRATION FILE COUNT (branch `cms-migration`, 2026-07-26)

Not folded into the counts above — this is a separate, unmerged branch. Full narrative:
`orchestrate/tasks.md` "2026-07-26 session, part 4"; plan doc: `documentation/CMS-MIGRATION-PLAN.md`.

```
New lib/ files:        content.ts, content/{simple,blog,hub,courses}.ts, richtext.ts,
                       portable-text-to-tiptap.ts, images.ts, admin-content.ts        (9)
New app/admin/ routes: blog, courses(+chapter+module+question nesting), services,
                       posh-hub, ic-reference, faq, testimonials, instagram,
                       cta-bands, settings — each with actions.ts + page.tsx(+[id])   (~30 files)
New app/api/ routes:   admin/upload, images/[...key]                                  (2)
New components/admin/: crud/* (6), editor/* (2), rich-text-editor.tsx, upload-image.ts,
                       nav.tsx, 11 per-type -form.tsx files                            (~21)
New components/marketing/: rich-text.tsx                                              (1)
New scripts/:           migrate-sanity-to-postgres.mts                                (1)
New tests/unit/:        richtext.test.ts, images.test.ts                              (+21 tests)
Prisma migration:       20260726063709_cms_content_models
```

Verified: `tsc --noEmit` clean · ESLint 0 errors/0 warnings · 78/78 tests · production `next build`
succeeds on every route · both mandatory security greps clean · migration dry run against the live
Sanity project (`7h7vbi97`) reports 26/26 ready, 0 skipped, 0 warnings.

Phase 0 deliverables complete (non-app, see NON-APP DELIVERABLES above):
- `design/colour-boards/index.html` + `CONTRAST-REPORT.md`  — P0-03 ✅ awaiting client pick
- `client/P0-04-content-inventory-request.md` + `knowledge-hub-section-template.md` — P0-04 ✅ awaiting send

### Dev A app files — COMPLETE (34+ built), + 4 ADOPTED from Dev B
> Dev B transcribed 10 Dev-A-owned files to work offline. On merge, **6 were replaced by
> Dev A's versions** (package.json, tsconfig.json, next.config.ts, postcss.config.mjs,
> app/layout.tsx, app/globals.css) and **4 were ADOPTED as-is because Dev A had not built
> them yet** — `lib/db.ts`, `lib/response.ts`, `lib/ratelimit.ts`, `prisma/schema.prisma`.
> Those four are now Dev A's to own and review; they are no longer "borrowed". See the
> P1-05 / P1-06 rows in tasks.md, which changed from "create" to "review and extend".

### Dev B app files — 21 / 21 code-complete ✅
```
lib/          auth.config.ts · auth.ts · session.ts (H3) · password.ts · tokens.ts
              email.ts · enrollment.ts (H4) · razorpay.ts · invoice.ts · r2.ts
              cert-id.ts · certificate.ts · admin-query.ts
              schemas/auth.ts · schemas/checkout.ts · schemas/certificate.ts
proxy.ts (edge-safe: imports auth.config only, never Prisma)
app/(auth)/   layout · actions · login · signup · verify-email · forgot-password · reset-password
app/(learner)/ layout · actions · dashboard · dashboard/certificates · dashboard/invoices
app/admin/    page · actions
app/(marketing)/verify/[certId]/page.tsx
app/api/      auth/[...nextauth] · checkout/create-order · webhooks/razorpay
              certificate/{issue, [certId]/verify, [certId]/pdf} · invoice/[paymentId]
              dashboard/summary · admin/{enrollments, payments, learners/[id],
              certificate/[certId]/revoke, leads.csv}
components/   auth/* · commerce/{checkout-button, payment-pending-banner}
              learn/certificate-card · marketing/verify-result · admin/revoke-form
              pdf/{invoice-document, certificate-document}
emails/       components/email-layout · verify-email · reset-password · welcome · receipt
tests/        unit/{razorpay-signature, certId, invoice-numbering}
              integration/{webhook-idempotency, cert-idempotency}   — 53 tests green
prisma/migrations/20260725000001_certificate_active_unique/  ★ partial unique index
```
Extra routes beyond CONTRACTS.md (documented in MERGE-NOTES.md): `/api/invoice/[paymentId]`
and `/api/certificate/[certId]/pdf` — authenticated downloads, because R2 objects are
private and are never direct-linked.

### Dev C app files — Phase 11 (motion & embeds) done 2026-07-26, Phase 8/9 (the correctness
### core — unlock engine, video gating, assessments) still 0 / 18 + 1 stub carried over
> **Phase 11 done, built by Dev B in Dev C's absence** (see tasks.md Phase 11 table + DECISIONS
> LOG 2026-07-26): `components/marketing/{harassment-spectrum,workplace-protection,youtube-lite,
> insta-grid}.tsx`, `lib/youtube.ts`, `app/api/youtube/latest/route.ts`,
> `sanity/schemas/instagramPost.ts`. None of it touches `lib/unlock.ts`, video tokens, progress,
> or grading — Phase 8/9 remain entirely unstarted and are the actual correctness-core risk.
>
> `lib/progress.ts` is a fail-closed STUB Dev B wrote so the dashboard typechecked.
> MERGE-NOTES.md §2 said delete it on merge; **Dev A deliberately kept it** — three merged
> Dev B call sites import `getCourseProgress`, so deleting it breaks `next build` for the
> whole of Phase 8. The stub returns 0% / no current module / final test NOT passed, so it
> cannot wrongly unlock anything. **P8-04 must overwrite it** — logged in BLOCKED TASKS.
> The signature is the agreed H5 contract:
> `getCourseProgress(userId, courseId) → { percentComplete, currentModuleId, finalTestPassed }`.
> Dev B deliberately never created `lib/unlock.ts`, `lib/stream.ts` or `lib/grading.ts`,
> and no Dev B route calls them.
