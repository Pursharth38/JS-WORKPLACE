/**
 * Seeds starter content into Sanity.
 *
 *   npm run seed:sanity
 *
 * WHY THIS EXISTS
 * ───────────────
 * `usingDemoContent` in lib/sanity.ts is `!isSanityConfigured`. The instant a
 * project id lands in .env, the demo fallbacks stop AND the warning banner
 * disappears — so without this script, connecting the CMS makes the site emptier
 * than it was, and the emptiness looks deliberate. This turns the demo fixtures
 * into real, editable documents so the Studio opens with something in it.
 *
 * TWO CONSTRAINTS THIS SCRIPT IS BUILT AROUND
 * ───────────────────────────────────────────
 *  1. It must NOT import lib/sanity.ts. That file starts with `import
 *     "server-only"`, which throws outside a React Server Component. We talk to
 *     @sanity/client directly. Importing lib/demo-content.ts is fine — its only
 *     imports are `import type`, which Node's type stripping erases.
 *
 *  2. demo-content.ts holds PROJECTED shapes, not document shapes. GROQ flattens
 *     with `"slug": slug.current`, so the fixtures carry `slug: "foo"` while a
 *     real document needs `{ _type: "slug", current: "foo" }`. Same for `anchor`.
 *     Portable Text needs a `_key` on every block and span. References need
 *     `{ _type: "reference", _ref }`. So we MAP rather than dump.
 *
 * SAFE TO RE-RUN. Every document has a deterministic `_id` and is written with
 * `createIfNotExists`, so a second run is a no-op and never overwrites an edit
 * made in the Studio.
 */

import { createClient } from "@sanity/client";
import type { PortableTextBlock } from "@portabletext/react";

import {
  DEMO_FAQS,
  DEMO_POSH_SECTIONS,
  DEMO_POSTS,
  DEMO_QUICK_REFERENCE,
  DEMO_SERVICES,
  DEMO_SITE_SETTINGS,
} from "../lib/demo-content.ts";

/* ── config ──────────────────────────────────────────────────────────────── */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-07-01";

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!projectId || projectId === "missing-project-id") {
  fail(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is not set in .env.\n" +
      "  Create a project at https://www.sanity.io/manage and copy its Project ID.",
  );
}
if (!token) {
  fail(
    "SANITY_API_WRITE_TOKEN is not set in .env.\n" +
      "  Sanity dashboard → API → Tokens → Add token, permission: Editor.\n" +
      "  This token is used ONLY by this script. Never prefix it with NEXT_PUBLIC_.",
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion,
  useCdn: false, // writes must never go through the CDN
});

/* ── helpers ─────────────────────────────────────────────────────────────── */

let keySeq = 0;
/** Deterministic keys — a re-run produces identical documents, not new noise. */
const key = () => `k${(keySeq++).toString(36)}`;

/** Portable Text paragraph in document shape (every block and span needs _key). */
function block(text: string): PortableTextBlock {
  return {
    _type: "block",
    _key: key(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  } as unknown as PortableTextBlock;
}

/** Re-key fixture Portable Text, which was built for rendering, not storage. */
// RichBody (M2): demo content is always the Portable Text half of the union —
// this seed script writes INTO Sanity, so a Tiptap doc here would be a bug.
function reblock(blocks: import("@/lib/richtext").RichBody): PortableTextBlock[] {
  if (!Array.isArray(blocks)) {
    throw new Error("seed-sanity: demo body must be Portable Text, got a Tiptap doc");
  }
  return blocks.map((b) => {
    const children = (b as unknown as { children?: { text?: string }[] })
      .children;
    const text = children?.map((c) => c.text ?? "").join("") ?? "";
    return block(text);
  });
}

const slug = (current: string) => ({ _type: "slug" as const, current });
const ref = (id: string) => ({ _type: "reference" as const, _ref: id });

type Doc = { _id: string; _type: string } & Record<string, unknown>;

/* ── documents ───────────────────────────────────────────────────────────── */

/**
 * siteSettings — the single highest-value document. It drives the footer, the
 * contact page and the WhatsApp button everywhere at once.
 *
 * ⚠️ CONTACT FIELDS ARE SEEDED EMPTY, ON PURPOSE. The demo fixtures carry
 * "hello@example.com" and "+91 00000 00000", which are fine behind the demo
 * banner — but once Sanity is configured that banner is gone, and a fake email
 * on a live-looking site is worse than no email. The schema marks `email` as
 * required, so the Studio will flag it in red until Jyoti fills it in. That red
 * marker is the point.
 *
 * The components already render these conditionally, so empty means "omitted",
 * not "broken".
 */
const siteSettings: Doc = {
  _id: "siteSettings", // fixed id — desk-structure.ts pins this as a singleton
  _type: "siteSettings",
  businessName: DEMO_SITE_SETTINGS.businessName,
  email: "",
  phone: "",
  whatsappNumber: "",
  whatsappDefaultMessage: DEMO_SITE_SETTINGS.whatsappDefaultMessage,
  heroHeading: DEMO_SITE_SETTINGS.heroHeading,
  heroSubheading: DEMO_SITE_SETTINGS.heroSubheading,
  heroPrimaryCtaLabel: DEMO_SITE_SETTINGS.heroPrimaryCtaLabel,
  heroPrimaryCtaHref: DEMO_SITE_SETTINGS.heroPrimaryCtaHref,
  legalEntityName: DEMO_SITE_SETTINGS.legalEntityName,
  announcement: { enabled: false, text: "", href: "" },
};

const services: Doc[] = DEMO_SERVICES.map((s) => ({
  _id: `service-${s.slug}`,
  _type: "service",
  title: s.title,
  slug: slug(s.slug),
  summary: s.summary,
  order: s.order,
  ...(s.icon ? { icon: s.icon } : {}),
}));

const poshSections: Doc[] = DEMO_POSH_SECTIONS.map((s) => ({
  _id: `posh-${s.anchor}`,
  _type: "poshSection",
  title: s.title,
  anchor: slug(s.anchor), // projected string → slug object
  group: s.group,
  order: s.order,
  ...(s.summary ? { summary: s.summary } : {}),
  body: reblock(s.body),
}));

const quickReferences: Doc[] = DEMO_QUICK_REFERENCE.map((q) => ({
  _id: `qr-${q.anchor}`,
  _type: "quickReference",
  title: q.title,
  anchor: slug(q.anchor),
  order: q.order,
  ...(q.intro ? { intro: q.intro } : {}),
  body: reblock(q.body),
}));

/** Categories are derived from the posts and MUST be created before them. */
const categoryMap = new Map<string, { id: string; title: string }>();
for (const post of DEMO_POSTS) {
  if (post.category && !categoryMap.has(post.category.slug)) {
    categoryMap.set(post.category.slug, {
      id: `category-${post.category.slug}`,
      title: post.category.title,
    });
  }
}

const categories: Doc[] = [...categoryMap.entries()].map(([s, c]) => ({
  _id: c.id,
  _type: "category",
  title: c.title,
  slug: slug(s),
}));

const SAMPLE_BODY =
  "Sample post body. This document exists so the blog layout can be reviewed with real content in it. Replace this text with the actual post — the structure, category and excerpt above are all editable too.";

const posts: Doc[] = DEMO_POSTS.map((p) => ({
  _id: `post-${p.slug}`,
  _type: "post",
  title: p.title,
  slug: slug(p.slug),
  excerpt: p.excerpt,
  publishedAt: p.publishedAt,
  ...(p.category
    ? { category: ref(categoryMap.get(p.category.slug)!.id) }
    : {}),
  // PostSummary carries no body — the fixtures are the list projection.
  body: [block(SAMPLE_BODY)],
}));

const faqs: Doc[] = DEMO_FAQS.map((f, i) => ({
  _id: `faq-${i + 1}`,
  _type: "faq",
  question: f.question,
  answer: reblock(f.answer),
  category: f.category,
  order: f.order,
}));

/*
 * ⚠️ NO TESTIMONIALS ARE SEEDED — deliberate, not an omission.
 *
 * The testimonial schema requires `consentOnFile: true`, and getTestimonials()
 * filters on it. A testimonial is a real person's words about a real engagement;
 * seeding invented ones (the source mockup used "HR Head, TechCorp India" and
 * similar) would be exactly the fabrication CLAUDE.md forbids, and it is a live
 * exposure for the client rather than harmless filler.
 *
 * The section renders nothing until Jyoti adds a real quote with permission.
 */

/* ── run ─────────────────────────────────────────────────────────────────── */

async function main() {
  // Order matters: categories before the posts that reference them.
  const groups: Array<{ label: string; docs: Doc[] }> = [
    { label: "site settings", docs: [siteSettings] },
    { label: "services", docs: services },
    { label: "POSH guide sections", docs: poshSections },
    { label: "quick reference cards", docs: quickReferences },
    { label: "blog categories", docs: categories },
    { label: "blog posts", docs: posts },
    { label: "FAQs", docs: faqs },
  ];

  console.log(`\nSeeding Sanity → project ${projectId}, dataset "${dataset}"\n`);

  let created = 0;
  let skipped = 0;

  for (const { label, docs } of groups) {
    // One transaction per group so a failure cannot leave a group half-written.
    const tx = client.transaction();
    for (const doc of docs) tx.createIfNotExists(doc);

    const before = await client.fetch<number>(
      `count(*[_id in $ids])`,
      { ids: docs.map((d) => d._id) },
    );

    await tx.commit({ visibility: "sync" });

    const newlyCreated = docs.length - before;
    created += newlyCreated;
    skipped += before;

    console.log(
      `  ${label.padEnd(24)} ${String(newlyCreated).padStart(2)} created` +
        (before > 0 ? `, ${before} already existed` : ""),
    );
  }

  console.log(
    `\n✓ Done — ${created} created, ${skipped} left untouched.\n\n` +
      "Next:\n" +
      "  1. Open http://localhost:3000/studio and sign in\n" +
      "  2. Fill in Site settings → contact email, phone and WhatsApp number.\n" +
      "     They are intentionally EMPTY and the Studio will flag the email in red —\n" +
      "     a fake address on a live-looking site is worse than none.\n" +
      "  3. Replace the sample POSH sections with Jyoti's real content.\n" +
      "  4. Add testimonials only where permission is on file.\n",
  );
}

main().catch((err) => {
  console.error("\n✖ Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
