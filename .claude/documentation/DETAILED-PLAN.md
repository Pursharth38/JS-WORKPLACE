# Detailed Plan — JS Workplace Wellness
> Feature spec, design system, phase plan, SEO strategy.
> Technical reference: ../ARCHITECTURE.md · Board: ../orchestrate/tasks.md

**Companion to:** `../ARCHITECTURE.md` (technical source of truth), `/team-division.md` (who builds what)
**This document:** feature specification, design system, phase plan, SEO strategy

---

## 1. Strategic Framing (read before building anything)

The client's actual practice is **corporate POSH training**. The course store is secondary.

Individual learners buying a POSH certificate is a thin market with unclear buyer motivation — most people take POSH training because their employer mandates it, and the employer pays. The B2C course will not carry this business on its own.

**Therefore: this site is a lead-generation engine for her training practice first, and a course store second.**

That ordering determines where effort goes. The Knowledge Hub and the demo funnel will likely generate more revenue than course sales. If a phase must be cut, cut LMS polish before cutting content depth.

The schema is deliberately built so a B2B seats layer can be added later without a migration — `Enrollment` is a separate table precisely for this.

---

## 2. Feature List

### 2.1 Public / Awareness Site — the client's stated priority

She told us the *information* on the reference site is what she likes most. That is the correct instinct and it should drive the build.

---

**F1 — POSH Knowledge Hub (`/posh-act`)** — *the centerpiece*

A long-form, deeply structured guide mirroring the **information architecture** of the reference site's POSH Act page. Content must be **original**, written by her, legally reviewed. Duplicate content will not rank and creates copyright exposure.

Section structure:

| Group | Sections |
|---|---|
| Compliance | Employer duties · What constitutes non-compliance · Penalties |
| Policy | Formulating a POSH policy · Can it be gender-neutral |
| Internal Committee | Constitution · Tenure · Disqualification · External member role |
| Local Committee | Constitution · Jurisdiction · District Officer |
| Definitions | Sexual harassment · Workplace (incl. remote) · Employer |
| Complaints | Who can complain · Deadlines · Anonymous complaints · Police complaint |
| Redressal | Conciliation · Inquiry process · Timelines · Interim relief · Inquiry report |
| False complaints | Punishment · Lack of evidence ≠ false · Penalties |
| Confidentiality | Mandatory confidentiality · Confidentiality vs anonymity · Breach penalty |
| Appeal | Grounds · 90-day timeline |
| Background | Vishaka Guidelines · Bhanwari Devi case · Constitutional basis |

Implementation requirements:
- Sticky left sidebar TOC with **scroll-spy** highlighting the active section
- Deep-linkable anchors (`#ic-constitution`) — people share these
- Collapsible subsections on mobile
- Reading-progress bar
- "Back to top" floating button
- **Each H2 section is a separate Sanity document** (`poshSection`) with `group` and `order` fields, so she can add, edit, and reorder without a deploy
- Inline CTA bands between groups, Sanity-managed

This page is the SEO engine. See §5.

---

**F2 — Home page**
Hero, three looped explainer animations (§4.4), trust band, services preview, course CTA, testimonials, latest blog posts, YouTube strip, demo CTA.

**F3 — Services (`/services`, `/services/[slug]`)**
The full horizon of what she offers, which the current design failed to communicate:
- POSH awareness sessions for employees
- POSH training for managers
- IC member training and capacity building
- IC external member services
- POSH policy drafting and review
- POSH audits and compliance health checks
- Soft-skills and behavioural workshops
- Mindful-culture / workplace wellness programs

Each is a Sanity `service` document — she adds and edits services herself.

**F4 — Blog (`/blog`, `/blog/[slug]`, `/blog/category/[cat]`)**
Sanity Portable Text. Categories, tags, related posts, reading time, author box, social share, RSS feed.

**F5 — Book a Demo / Consultation (`/book-demo`)**
Fields: name, work email, phone, organization, employee count, service interest, message, **unticked consent checkbox** (DPDP requirement).
Submits to `Lead` table + notification email to her. Optional Cal.com embed for direct slot booking.

**F6 — About (`/about`)**
Credentials, certifications, experience, photo, real empanelments only.

**F7 — YouTube + Instagram integration**
- **YouTube:** latest N videos via Data API v3, cached 6h, rendered as a **lite façade** (click-to-load poster). Never the standard iframe.
- **Instagram:** the Basic Display API token expires every 60 days and breaks silently on a weekend. **Recommend a Sanity-managed grid instead** — she pastes post URLs, we render static images linking out. Less "live", zero breakage. Present this tradeoff to her explicitly.

**F8 — Floating WhatsApp button**
`https://wa.me/91XXXXXXXXXX?text=<prefilled>`. Prefilled text varies by page (`Hi Jyoti, I'm interested in the POSH course`). Bottom-right, sits above mobile nav, `rel="noopener"`.

**F9 — Contact (`/contact`)**
Details, form, optional embedded map.

**F10 — Legal pages** — `/privacy`, `/terms`, `/refund-policy`
**Razorpay will not activate the account without live Terms and Refund Policy pages.** This is a Phase 3 blocker, not a launch-week task.

---

### 2.2 Course Platform

**F11 — Course catalog + detail (`/courses`, `/courses/[slug]`)**
Syllabus preview, duration, learning outcomes, certificate sample image, FAQs, price, one free preview module.

**F12 — Auth**
Email + password with verification, plus Google OAuth. The certificate carries the learner's legal name, so name is captured at signup and **locked after first certificate issue**, with a support-request path to change it.

**F13 — Checkout**
Razorpay one-time payment. Order created server-side; amount read from DB, never from the client.

**F14 — Learning player (`/learn/[courseSlug]/[moduleId]`)**
Sequential unlock: Chapter → Modules → one video each. Module completes at **≥90% watched**, tracked via player time-update events throttled to a 15-second heartbeat. Resume-where-left-off. Curriculum sidebar showing lock states.

**F15 — Chapter assessment**

> **Client requested 100%-correct-to-pass. This spec overrides that to 80%. Requires her sign-off before Phase 9.**
>
> **Why:** a 100% gate with unlimited instant retries is brute-forced in two attempts. The learner memorises the answer key, not the content, and the pass record becomes worthless as evidence that training occurred. If she still insists, build it — but log attempt counts so we can show her the data in three months.

Specification:
- 80% pass threshold
- Questions randomized per attempt from a larger Sanity pool
- Option order shuffled per attempt
- Unlimited retries, 10-minute cooldown after two consecutive failures
- Post-attempt review shows **which topics** were missed — never which answers were correct

**F16 — Final test**
Same engine. 85% threshold. Questions drawn across all chapters. Max 3 attempts per 24 hours.

**F17 — Certificate issuance**
Server-generated PDF on final pass. Contains: learner name, course title, completion date, unique certificate ID, verification URL, QR code, her signature image. Stored in R2, downloadable from dashboard.

Wording is fixed: **"Certificate of Completion — POSH Awareness Training"**. See `Architecture.md` §2.

**F18 — Public certificate verification (`/verify/[certId]`)**
Shows name, course, issue date, valid/revoked status. Roughly four hours of work, and it is what makes the certificate worth anything to an employer. Without it the PDF is a JPEG anyone can forge.

**F19 — Learner dashboard (`/dashboard`)**
Enrolled courses, progress percentage, resume CTA, certificates, invoices.

**F20 — Admin**
Sanity Studio at `/studio` for all content. Separate lightweight `/admin` route for operational data Sanity should not hold: enrolments, payments, learner progress, certificate revocation, lead export to CSV.

---

### 2.3 Added Features — low complexity, real value

| # | Feature | Why it earns its place |
|---|---|---|
| E1 | Certificate verification (F18) | Turns a PDF into a credential. ~4 hrs. |
| E2 | Lead magnet: POSH compliance checklist PDF, email-gated | The reference site runs a "7-Step POSH Guide" popup for exactly this reason. Builds her mailing list, which is the real asset. |
| E3 | "Is your organization POSH compliant?" — 8-question self-assessment → score + emailed report + demo CTA | Highest-converting asset type on a compliance site. Pure frontend plus one email. No backend complexity. |
| E4 | IC Member Quick-Reference — timelines, penalties, committee composition as scannable tables | Ranks for dozens of long-tail queries. Cheap to build from Knowledge Hub content. |
| E5 | FAQ page with `FAQPage` schema | Google rich results. Trivial. |
| E6 | Newsletter capture + monthly POSH update | She already produces content. Owning distribution beats renting it from Instagram. |
| E7 | Sanity-managed testimonials | Trust. **Real ones only** — no invented logos, no fabricated stats. |
| E8 | Invoice PDF per purchase | Buyers will ask. Include GSTIN if she is registered. |
| E9 | Auto-generated sitemap.xml + robots.txt | Non-negotiable for the SEO strategy. |
| E10 | Plausible analytics | Cookieless, so no consent banner needed — unlike GA4 under DPDP. |

### 2.4 Out of scope for v1

Multi-language, complaint management system, IC meeting registers, external member directory, live webinars, org/HR dashboards, mobile app, SCORM/LTI, AI chatbot.

The reference site has a team and a decade behind it. We have three developers and a deadline. Anything here that she insists on becomes v2 with separate pricing.

---

## 3. Client Sign-Offs Required Before Build

Three blocking items. Do not start the dependent phase without written confirmation.

| # | Item | Blocks | Ask |
|---|---|---|---|
| 1 | Certificate wording | Phase 10 | Confirm "Certificate of Completion — POSH Awareness Training". Explain that claiming statutory recognition without empanelment is a misrepresentation risk for her. |
| 2 | 80% pass threshold | Phase 9 | Explain the brute-force problem. Offer 80% + randomization. |
| 3 | Color direction | Phase 1 | Two boards, pick one. |

Additional decisions needed but non-blocking: price point, GST registration status, coupon codes yes/no.

---

## 4. Design Plan

### 4.1 The colour problem

She rejected the current scheme. The failure mode most POSH sites hit is pink/purple "women's issues" styling, which reads as soft and quietly undermines the legal authority she is selling. The reference site uses institutional blue for exactly this reason.

**Direction: authoritative, warm, institutional. Not corporate-cold, not feminine-pastel.**

Present **two** boards — never one, never five. Static PNG/Figma comps, not a live site, so feedback is about colour and not about layout.

**Board A — Deep Teal (recommended)**

```
Ink        #101828   headings, body text
Slate      #475467   secondary text
Deep Teal  #0F5257   primary brand — trust + legal gravity, not generic blue
Teal 600   #14746F   interactive states
Teal 50    #EAF4F3   section tints
Amber 500  #C77D26   accent, CTAs, callouts — warmth without pink
Sand       #FBF9F5   page background (not pure white)
Border     #E4E7EC
Success    #067647   Error #B42318   Warning #B54708
```

**Board B — Deep Indigo**

```
Indigo     #1E2A5A   primary
Clay       #B85C38   accent
Cream      #FCFAF7   background
(Ink, Slate, Border, semantic colours as above)
```

### 4.2 Typography

```
Headings:  Fraunces (variable serif), weight 600, tight tracking
Body:      Inter 400/500/600
UI/data:   Inter with tabular-nums

Type scale (1.25):  12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61
Body:               17px / 1.7 line-height
Measure:            max 68ch on the Knowledge Hub
```

Serif headings over sans body reads as editorial and authoritative — deliberately distinct from the all-Inter SaaS look of the rejected design.

### 4.3 Spacing, radius, elevation

```
Spacing scale:  4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128
Radius:         sm 6px · md 10px · lg 16px · full 9999px
Shadows:        sm  0 1px 2px rgba(16,24,40,.05)
                md  0 4px 8px -2px rgba(16,24,40,.10)
                lg  0 12px 16px -4px rgba(16,24,40,.08)
Container:      max-w-7xl, px-4 md:px-8
Breakpoints:    sm 640 · md 768 · lg 1024 · xl 1280
```

### 4.4 Awareness animations (her home-page request)

**Do not build these in Three.js or hand-rolled SVG.** Lottie JSON from After Effects or LottieFiles. Each ≤150 KB, `prefers-reduced-motion` respected, `IntersectionObserver`-gated so they pause offscreen.

| ID | Animation | Content |
|---|---|---|
| A | **What counts as harassment** | Five behaviour icons flow along a line into a "Sexual Harassment under POSH §2(n)" node |
| B | **The complaint journey** *(highest value)* | Animated flowchart: Complaint → IC (7 days) → Response (10 days) → Inquiry (90 days) → Report (10 days) → Action (60 days). Timeline labels animate in. This is what people actually search for. |
| C | **Who the Act protects** | Employee, intern, visitor, vendor, domestic worker, contract staff orbiting a "Workplace" centre, with the definition expanding to include "remote / home" |

Below each loop, render a **static accessible HTML version** — text and lists. Animation is decoration; the SEO and screen-reader value must exist in the DOM.

### 4.5 Component inventory

```
Layout      Header (sticky, mega-menu) · Footer · WhatsAppFAB · Container
Marketing   Hero · StatBand · ServiceCard · CourseCard · PostCard
            TestimonialSlider · LottieLoop · CTABand · YouTubeLite · InstaGrid
Content     TocSidebar (scroll-spy) · Accordion · ProseBlock · CalloutBox
            ReadingProgress · BackToTop
Forms       LeadForm · NewsletterForm · Input · Select · Checkbox · Turnstile
Learn       VideoPlayer · CurriculumTree (lock states) · ProgressRing
            QuizRunner · ResultPanel · CertificateCard
Public      VerifyResult
UI          Button · Badge · Card · Modal · Toast · Skeleton · Tabs
```

### 4.6 Accessibility — WCAG 2.1 AA

- Amber `#C77D26` on Sand hits 4.5:1 only at ≥18px. Use it for large CTAs; use Ink for body text.
- Full keyboard navigation through player and quiz
- Visible focus rings, never `outline: none` without a replacement
- `aria-live` on quiz results and form errors
- Captions on every video (Cloudflare Stream auto-generates; she reviews before publish)
- All Lottie animations have static text equivalents

---

## 5. SEO Strategy

**The Knowledge Hub is the business case for this entire site.** The competitor ranks because it answers POSH questions exhaustively, not because it sells courses well. Content depth is the moat, and she is the only person who can write it.

### 5.1 Keyword targets

| Tier | Terms |
|---|---|
| Primary (hard) | POSH Act · POSH compliance · POSH training online · internal committee POSH · POSH certificate course India |
| Long-tail (winnable) | is home a workplace under POSH · can a man file a POSH complaint · POSH annual report format · penalty for POSH non-compliance · external member IC remuneration · POSH inquiry timeline · IC constitution rules · POSH conciliation process |

Long-tail is where she wins in year one. Primary terms are a two-year fight against an established competitor.

### 5.2 Structure

Knowledge Hub is the **pillar**. Blog posts are **clusters**, each linking back to the relevant Hub anchor. Hub links out to related posts. This is the entire strategy — do not overcomplicate it.

### 5.3 Technical requirements

- SSG or ISR on every public route. No client-side fetching on first paint.
- `sitemap.xml` and `robots.txt` auto-generated from Sanity content
- Canonical tags on every page
- Per-route OG images via `opengraph-image.tsx`
- JSON-LD: `Article` (blog), `FAQPage` (FAQ + Hub FAQs), `Course` (course pages), `Person` (about), `BreadcrumbList` (all), `LocalBusiness` (contact)
- Core Web Vitals ≥90 mobile — the lite YouTube façade and lazy Lottie exist specifically for this
- Google Business Profile claimed and linked

### 5.4 Non-negotiable

**Do not copy the reference site's text.** Duplicate content will not rank and it is copyright exposure. Her original explanations are the only version worth publishing. If she cannot write it all at launch, ship fewer sections written well rather than more sections paraphrased.

---

## 6. Phase Plan

| Phase | Deliverable | Days | Blocks |
|---|---|---|---|
| 0 | Colour boards · legal sign-off on certificate copy · content inventory from client | 3 | Everything |
| 1 | Repo · Tailwind tokens · layout shell · Header/Footer/WhatsApp FAB · CI | 3 | All UI |
| 2 | Sanity schemas · Studio · structure-sync webhook | 4 | Phases 3–5, 8, 9 |
| 3 | Marketing pages: Home, About, Services, Contact, Book Demo, **legal pages** | 5 | Razorpay activation |
| 4 | **Knowledge Hub** + TOC + scroll-spy + schema markup | 4 | — |
| 5 | Blog · FAQ · lead magnet · compliance self-check | 4 | — |
| 6 | Auth · learner dashboard shell | 3 | Phases 7, 8 |
| 7 | Razorpay · webhook · enrolment · invoices | 4 | Phase 8 |
| 8 | Player · Stream signed tokens · progress · **unlock engine** | 6 | Phase 9 |
| 9 | Assessment engine · final test | 4 | Phase 10 |
| 10 | Certificate PDF · verification page | 3 | — |
| 11 | Lottie animations · YouTube/Instagram integration | 3 | — |
| 12 | SEO · sitemap · schema · Lighthouse · security pass · load test | 4 | Launch |
| 13 | Content load · UAT · launch | 3 | — |

**Total: ~53 working days of sequential work.** With three developers working in parallel per `Team_Division.md`, calendar time compresses to roughly **7 weeks**.

### 6.1 Ship in two stages

**Phases 0–5 are a shippable standalone marketing site.** Ship that first and let it start ranking while the LMS is built. SEO takes months to compound, and there is no reason for the content to wait on the video player.

If you quoted the client less than 53 developer-days of effort, you underquoted. Say so now rather than absorbing it silently — a scope conversation in week one is normal, and the same conversation in week six is a fight.

---

## 7. Three Things to Push Back On

1. **The 100%-pass rule.** Explain the brute-force problem. Offer 80% with randomization. If she still insists, build it, but log attempt counts and revisit with data.

2. **Instagram live feed.** The API token expires every 60 days and breaks silently. A manually-curated grid is the honest recommendation.

3. **The B2C-only decision.** Her practice is corporate training. Individual certificate buyers are a thin market. Make sure she understands that this site is a lead engine for her training practice first and a course store second — that ordering determines where the effort goes, and the Knowledge Hub will likely out-earn the course.

---

## 8. Definition of Done

A feature is done when all of these are true. No exceptions, no "we'll come back to it".

- [ ] TypeScript strict, no `any`, no `@ts-ignore`
- [ ] Zod validation on every API boundary
- [ ] Loading, empty, and error states implemented
- [ ] Mobile tested at 375px width
- [ ] Keyboard navigable, visible focus states
- [ ] axe-core clean
- [ ] Unit tests on business logic
- [ ] Content editable in Sanity where the client would reasonably want to change it
- [ ] No hardcoded strings that should be CMS-managed
- [ ] Reviewed and approved by another developer
