# CMS Migration Plan — Sanity → Custom Admin over Postgres

> Status: **PROPOSED, NOT APPROVED, NOT STARTED.** Written 2026-07-26 in response to a client
> request. This document is the architecture and the feature-by-feature mapping asked for. It is
> not an instruction to execute — see "Go / no-go" at the end.
>
> Referenced from `.claude/CLAUDE.md`'s SOURCE-OF-TRUTH SPLIT section, which is the rule this
> plan would change if approved.

---

## 1. The request, in one sentence

Replace Sanity Studio — a second login, a second mental model, a system built for people who
write content for a living — with content editing built directly into `/admin`, so Jyoti has
exactly one place to log into and one interface to learn.

## 2. What's actually true about the current state

This is not a greenfield decision. Worth being precise about the size of what changes:

- **13 Sanity document/object types are live**: `course`, `chapter`, `module`, `question`, `post`,
  `category`, `service`, `poshSection`, `quickReference`, `faq`, `testimonial`, `siteSettings`,
  `instagramPost` — plus three reusable objects (`calloutBox`, `dataTable`, `ctaBand`).
- **Studio is built and embedded** at `/studio` with a custom desk structure (P2-03).
- **The sync webhook is built and running**: `/api/webhooks/sanity` upserts `Course`/`Chapter`/
  `Module` structure into Postgres and revalidates cache tags on every publish (P2-04).
- **26 seed documents are live in a real, connected Sanity project** (`7h7vbi97`, per P13-01) —
  this is not placeholder infrastructure, there is real content sitting in it right now.
- **Every marketing page reads through `lib/sanity.ts`** — 15+ typed GROQ query helpers
  (`getPosts`, `getCourseBySlug`, `getServices`, `getFaqs`, `getInstagramPosts`, …), each with a
  demo-content fallback.
- **The image pipeline is Sanity's**: `urlForImage()` (`@sanity/image-url`) generates on-the-fly
  resized URLs; there is no local image storage or resize step anywhere else in the app.
- **Rich text is Sanity's Portable Text format** (`@portabletext/react` renders it), used for blog
  posts, POSH Hub sections, service descriptions, FAQ answers.

**Two of the three routes in the proposal already exist and need no new build**:
`/admin` (role=ADMIN, owner-only, built in Phase 10 for enrolments/payments/revocation/leads) and
`/dashboard` (buyer-only, middleware-protected). The public marketing routes are also unchanged —
visitors never see a difference regardless of where content lives. **What's actually new is
narrower than "rebuild the site": move content ownership for the types above out of Sanity, into
Postgres, behind a CRUD UI merged into the existing `/admin`.**

## 3. Target architecture

```
                    ┌──────────────────────────────────────┐
                    │         PUBLIC (no route change)       │
                    │  /, /posh-act, /blog, /services,        │
                    │  /courses, /faq, /contact, …            │
                    │  Reads content — doesn't care where      │
                    │  it lives, only that lib/content.ts      │
                    │  (renamed from lib/sanity.ts) returns    │
                    │  the same shapes it does today.          │
                    └──────────────────────────────────────┘
                                     ▲
                                     │ reads
                    ┌────────────────┴─────────────────┐
                    │         POSTGRES (Prisma)          │
                    │  New tables: BlogPost, Service,     │
                    │  PoshSection, Faq, Testimonial,     │
                    │  QuickReference, InstagramPost,      │
                    │  SiteSettings (singleton), plus       │
                    │  Course/Chapter/Module/Question       │
                    │  gain the fields Sanity used to own    │
                    │  (title, body, options — today only    │
                    │  sanityId/order/videoUid are mirrored)  │
                    └────────────────┬─────────────────┘
                                     │ writes
                    ┌────────────────┴─────────────────┐
                    │   /admin (existing, role=ADMIN)    │
                    │   + new tabs: Blog, Courses,        │
                    │   Services, POSH Hub, FAQ,          │
                    │   Testimonials, Site settings        │
                    │   Rich text via Tiptap. Images        │
                    │   via R2 + next/image.                │
                    └───────────────────────────────────┘

                    ┌──────────────────────────────────────┐
                    │   /dashboard (existing, buyer-only)    │
                    │   Unchanged by this migration.          │
                    └──────────────────────────────────────┘
```

The three-route framing in the request maps exactly onto what's already there:

| Proposed route | Reality |
|---|---|
| Owner-protected, full control, blog tab, courses/services editable | `/admin` — **exists**, gains new tabs |
| Public, unprotected, visitors land and see the whole site | Marketing routes — **exists, unchanged** |
| Buyers, own dashboard | `/dashboard` — **exists, unchanged** |

## 4. Feature-by-feature migration mapping

| Sanity type today | Postgres replacement | Admin UI | What changes for consuming pages |
|---|---|---|---|
| `post` + `category` (blog) | New `BlogPost` model: `title`, `slug`, `excerpt`, `body` (stored as sanitized HTML from Tiptap, not Portable Text JSON), `coverImageKey` (R2), `categoryId` → `BlogCategory`, `tags String[]`, `publishedAt`, `seoTitle`, `seoDescription`, `relatedHubAnchors String[]` | `/admin/blog` — list, create, edit (Tiptap), publish/unpublish toggle, category manager | `lib/content.ts`'s `getPosts()`/`getPostBySlug()` swap their GROQ query for a Prisma query; **return the exact same TypeScript shape**, so `PostCard`, `/blog/[slug]/page.tsx`, `feed.xml` don't change at all |
| `service` | New `Service` model: `title`, `slug`, `summary`, `order`, `icon`, `whoItIsFor String[]`, `whatIsCovered String[]`, `format`, `body` (HTML), `seoTitle`, `seoDescription` | `/admin/services` — reorderable list (drag or numeric `order` field), edit form | Same shape-preservation strategy as blog |
| `poshSection` | New `PoshSection` model: `title`, `anchor`, `group`, `order`, `summary`, `isFaq`, `body` (HTML) | `/admin/posh-hub` — grouped by `group`, drag-to-reorder within group (this is the highest-content-volume type; the editor UX here matters most) | Same |
| `quickReference` | New `QuickReference` model | `/admin/ic-reference` | Same |
| `faq` | New `Faq` model: `question`, `answer` (HTML), `category`, `order` | `/admin/faq` | Same |
| `testimonial` | New `Testimonial` model: `quote`, `authorName`, `authorRole`, `organization`, `consentOnFile Boolean`, `order`. **`consentOnFile` stays a hard-required checkbox in the admin form** — this rule doesn't relax because the editing surface changed | `/admin/testimonials` | Same |
| `instagramPost` | New `InstagramPost` model: `imageKey` (R2), `permalink`, `caption`, `order` | `/admin/instagram` — upload image, paste permalink | Same |
| `siteSettings` (singleton) | New `SiteSettings` model, `id` fixed to a constant so only one row can ever exist (mirrors Sanity Studio's singleton-pin trick) | `/admin/settings` | Same |
| `course` / `chapter` / `module` — **structure only** (`sanityId`, `order`, `videoUid`, `durationSeconds`, `isFreePreview`, `priceInPaise`, `isPublished`, `passThreshold`) already lives in Postgres | These models **gain the content fields Sanity currently owns**: `Course.summary/learningOutcomes/description(HTML)/seoTitle/seoDescription`, `Chapter.summary`, `Module.title` (already there) | `/admin/courses` — the richest admin screen: course metadata, chapter/module tree editor, drag-to-reorder | `getCourseBySlug()`/`getCourses()` in `lib/content.ts` become plain Prisma queries against models that already exist — **no new sync step, because there's no second system to sync from anymore** |
| `question` (assessment pool) | New `Question` model: `text`, `options Json` (`{id, text, isCorrect}[]`), `topic`, `explanation`, `chapterId` | `/admin/courses/[id]/questions` — **`isCorrect` must never be sent to the browser in the admin UI's own network tab either**; the admin list view shows options but the correct answer render needs the same "who is this response for" discipline the public `/api/assessment/start` route already has | `/api/assessment/[chapterId]/start` already strips `correctOptionId` before it hits the client — unaffected either way, since grading was always server-side against a fresh read (Sanity or Postgres, the read source doesn't change the security property) |
| `calloutBox` / `dataTable` / `ctaBand` (reusable Portable Text blocks) | Represented as inline HTML/components within the Tiptap body via custom extensions, or as separate small tables (`CtaBand` model) referenced by `afterGroup` exactly as today | Tiptap custom node for callouts; `CtaBand` gets its own tiny admin list | `getCtaBands()` becomes a Prisma query |
| Studio (`/studio`, desk structure) | **Deleted entirely** | N/A | `app/studio/[[...tool]]/page.tsx`, `sanity.config.ts`, `sanity.cli.ts` removed |
| `/api/webhooks/sanity` (sync + revalidate) | **Deleted entirely** — there is no longer a second system whose publishes need syncing. Admin writes go straight to Postgres in the same request that changes them | N/A | `revalidateTag()` still needed but called directly from each admin mutation (a Server Action), not from a webhook |
| `urlForImage()` (`@sanity/image-url`) | R2 upload (already wired for certificates/invoices) + `next/image` with an R2 `remotePattern` added to `next.config.ts` | Admin forms get a file `<input>` → `POST /api/admin/upload` → R2 → returns the object key | **This is the one place other than shape-preservation where consuming pages DO change**: every `<img src={urlForImage(...).width(w).height(h).url()}>` becomes `<Image src={r2PublicUrl(key)} width={w} height={h}>`. `PostCard`, `CourseCard`, `InstaGrid` all touch this |
| Portable Text (`@portabletext/react`) rendering | Sanitized HTML rendered via `dangerouslySetInnerHTML` (through a strict allowlist sanitizer — **`isomorphic-dompurify` or equivalent, not a raw pass-through**, since this is now user-authored HTML from a browser-based editor, a genuine XSS surface that Portable Text's structured-block format never was) | Tiptap's own output is already scoped HTML; the sanitizer runs server-side on save, not on every render | `ProseBlock` component's rendering logic swaps from `<PortableText value={...}>` to `<div dangerouslySetInnerHTML={{ __html: sanitized }} />` |
| Draft/preview workflow (Sanity's built-in draft vs. published distinction) | **Lost, unless rebuilt.** Simplest replacement: an `isPublished Boolean` per row plus an admin "preview" link that renders the page with a signed preview token bypassing the publish filter. Full versioning (edit history, restore-a-previous-version) is **not** part of this plan — flag to the client as a real capability being traded away, not silently dropped | New `?preview=<token>` query param support on content-serving pages | — |

## 5. New infrastructure this genuinely requires

1. **A rich text editor.** Recommend **Tiptap** (open source, React-native, produces clean HTML,
   large ecosystem of extensions for the callout/table/CTA-band blocks the site already uses).
   Alternative considered: plain Markdown + a markdown editor — simpler to build, but a worse
   editing experience for a non-technical owner, which is the entire point of this migration. Not
   recommended.
2. **An HTML sanitizer on every save path.** Non-negotiable the moment content becomes
   browser-authored HTML instead of Sanity's structured Portable Text blocks. `isomorphic-dompurify`
   or equivalent, server-side, on write — not on read, so a compromised admin session can't have
   its payload "cleaned" only for display while sitting dangerously in the database.
3. **R2 upload endpoint + `next/image` wiring.** `next.config.ts` currently has no
   `images.remotePatterns` (the codebase deliberately avoids `next/image` today, using plain
   `<img>` with Sanity's CDN doing the resizing). This migration is the natural moment to add it.
4. **A drag-to-reorder admin UI pattern**, reused across ~6 screens (services, POSH sections, FAQ,
   testimonials, chapters, modules). Worth building once as a shared component rather than six
   times.
5. **A one-time data migration script**: read every document out of the live Sanity project via
   the existing `sanityClient`, write it into the new Postgres tables, upload every referenced
   Sanity image asset into R2. This runs once, at cutover, and needs a dry-run mode and a row
   count / spot-check step before the Sanity project is decommissioned.

## 6. What's traded away

Be explicit with the client about this, not just the upside:

- **No more live collaborative editing** — Sanity Studio supports multiple editors seeing each
  other's cursors live; a custom admin is Jyoti alone.
- **No more automatic image hotspot/crop UI** — Sanity's image field has a drag-to-set-focal-point
  tool that `next/image` + a plain upload does not replicate without extra build.
- **No version history / undo** for content edits, unless built separately (out of scope here).
- **No GROQ** — any future "just query it a different way" flexibility Sanity gave for free now
  needs a new Prisma query and, for anything beyond simple filters, a new admin screen.
- **The Sanity subscription cost goes away** — a real, if usually small, monthly saving.
- **One fewer login, one fewer mental model** — the actual goal, and the reason this is being
  considered at all.

## 7. Phased migration path (if approved)

```
Phase M1 — Admin shell + Tiptap + upload pipeline          (foundation, no content moves yet)
Phase M2 — Simple types first: FAQ, Testimonial, Service,   (low risk, small schemas, good
           InstagramPost, SiteSettings                       place to find problems cheaply)
Phase M3 — Blog (highest edit frequency once live)
Phase M4 — POSH Hub sections + Quick Reference               (highest CONTENT VOLUME — do this
                                                               only after M1–M3 prove the pattern)
Phase M5 — Course/Chapter/Module content fields + Question    (highest RISK — touches the
            pool                                               commerce-adjacent Course model
                                                                 and the assessment security
                                                                 surface; two reviewers, same
                                                                 rule as the unlock engine)
Phase M6 — Data migration script, dry run, cutover, decommission
            Studio + the sync webhook
```

Each phase ships independently — the site can run with SOME content on Postgres and SOME still on
Sanity for the duration (the webhook and `lib/content.ts`'s per-type functions don't need to move
together), which keeps this reversible until Phase M6 actually decommissions Sanity.

## 8. Rough effort

Order of magnitude, not a quote: **M1 is the biggest single phase** (editor + upload pipeline +
sanitizer + the shared reorder component is genuinely new infrastructure). M2–M5 are then mostly
repetitive CRUD screens against that foundation. M6 is short but must not be rushed — it is the
one irreversible step.

## 9. Go / no-go

This plan is written so the tradeoffs in §6 can be weighed against the goal in §1 explicitly,
not discovered after the fact. Recommend a client conversation covering:

1. Is "one login" worth losing live collaboration, hotspot cropping, and version history?
2. Does she edit content often enough that the UX difference matters, or rarely enough that a
   second login is a minor, occasional friction?
3. Would a **lighter alternative** — e.g., a custom Sanity Studio desk structure so simplified it
   reads like a single form per content type, with no schema/GROQ ever surfaced to her — solve the
   actual complaint (Sanity feels complicated) without the cost in §6? This is a real middle
   option and should be ruled out explicitly, not skipped.

**Nothing in this plan is executed. `.claude/CLAUDE.md`'s "Sanity owns content" rule stands until
this is reviewed and a decision is logged in `orchestrate/tasks.md`'s DECISIONS LOG.**
