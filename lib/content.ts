// ─────────────────────────────────────────────────────────────────────────────
// lib/content.ts — THE content façade. (CMS migration M0, 2026-07-26)
//
// Every page and component reads content from THIS module, never from
// lib/sanity.ts directly. During the Sanity → Postgres migration each getter
// moves individually: a type that has migrated re-exports a Prisma-backed
// implementation from lib/content/, everything else re-exports the original
// Sanity-backed implementation. Consuming pages cannot tell the difference —
// the exported names and TypeScript shapes are the contract and they do not
// change.
//
// MIGRATION STATE (update this table as phases land):
//   ✅ siteSettings   ✅ faq          ✅ testimonial   ✅ service
//   ✅ instagramPost  ⬜ post/category ⬜ poshSection  ⬜ quickReference
//   ⬜ ctaBand        ⬜ course       ⬜ question
// ✅ = served by lib/content/* (Postgres once the type has rows; Sanity until
// then — the flip rule in lib/content/simple.ts).
//
// When the LAST row flips and cutover is approved, lib/sanity.ts and this
// re-export layer collapse into plain Prisma modules.
// ─────────────────────────────────────────────────────────────────────────────

export {
  // client + plumbing (used by webhook + migration script; goes away at cutover)
  sanityClient,
  usingDemoContent,
  urlForImage,
  sanityFetch,
  TAGS,
  type ContentTag,
  type SanityImageSource,

  // types — the shape contract every consuming page depends on
  type SanityImage,
  type SiteSettings,
  type PoshSection,
  type CtaBand,
  type PostSummary,
  type Post,
  type Category,
  type QuickReference,
  type ServiceSummary,
  type Service,
  type Faq,
  type Testimonial,
  type InstagramPost,
  type CourseSummary,
  type CourseDetail,

  // getters still Sanity-backed (M3–M5 swap these)
  SITE_SETTINGS_FALLBACK,
  getPoshSections,
  getQuickReferences,
  getCtaBands,
  getPosts,
  getPostBySlug,
  getPostsByCategory,
  getRelatedPosts,
  getCategories,
  getCourseBySlug,
  getCourses,
} from "@/lib/sanity";

// M2 — Postgres-backed (with per-type Sanity fallback until rows exist)
export {
  getFaqs,
  getTestimonials,
  getServices,
  getServiceBySlug,
  getInstagramPosts,
  getSiteSettings,
} from "@/lib/content/simple";
