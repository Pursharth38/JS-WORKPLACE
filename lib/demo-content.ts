import type { PortableTextBlock } from "@portabletext/react";

import type {
  CourseSummary,
  Faq,
  PoshSection,
  PostSummary,
  QuickReference,
  ServiceSummary,
  SiteSettings,
  Testimonial,
} from "./sanity";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEMO CONTENT — VISIBLE ONLY WHEN SANITY IS NOT CONFIGURED
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Why this exists: with content in a CMS and no CMS connected, every page below
 * the hero rendered an empty state. Architecturally correct, practically
 * useless — the design could not be seen or judged by anyone.
 *
 * ⚠️ RULES THIS FILE OBEYS, and must keep obeying:
 *
 *  1. It NEVER loads when `NEXT_PUBLIC_SANITY_PROJECT_ID` is set. Real content
 *     always wins; there is no merge and no fallback-per-field.
 *  2. Nothing here states a legal fact about the POSH Act. The body copy
 *     describes what a real section would contain — it does not pretend to be
 *     one. Inventing legal content and shipping it under a trainer's name is
 *     the exact exposure CLAUDE.md §1 and the originality rule exist to prevent.
 *  3. Every testimonial and every statistic is labelled as sample data IN THE
 *     VISIBLE TEXT, not just in a comment. If a screenshot of this leaks into a
 *     deck, it still reads as fake.
 *  4. A banner renders sitewide whenever this is active (see DemoBanner).
 *
 * Delete this file the day the client's Sanity project goes live. It is
 * scaffolding, not a feature.
 */

/** Plain paragraph helper — Portable Text is verbose to hand-write. */
function p(text: string): PortableTextBlock {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s", text, marks: [] }],
  } as unknown as PortableTextBlock;
}

const SAMPLE_NOTE =
  "Sample text, shown because no CMS is connected. The real wording for this section is written by Jyoti and loaded through the Studio.";

export const DEMO_SITE_SETTINGS: SiteSettings = {
  businessName: "JS Workplace Wellness",
  email: "hello@example.com",
  phone: "+91 00000 00000",
  whatsappNumber: "910000000000",
  whatsappDefaultMessage:
    "Hi, I'd like to know more about your POSH training.",
  addressLines: ["Sample address line", "Demo data — not a real address"],
  heroHeading: "Workplace training that stands up to scrutiny.",
  heroSubheading:
    "Awareness sessions, Internal Committee training, policy drafting and compliance support for organisations that want to get this right.",
  heroPrimaryCtaLabel: "Book a consultation",
  heroPrimaryCtaHref: "/book-demo",
  legalEntityName: "JS Workplace Wellness",
};

/**
 * Statistics band. Every value is a visible placeholder.
 *
 * CLAUDE.md forbids inventing trained-employee counts, so these are literally
 * "[00]" rather than plausible-looking numbers — the same convention used in the
 * P0-03 colour boards. A real figure only ever comes from the client.
 */
export const DEMO_STATS = [
  { value: "[00]", label: "Organisations trained" },
  { value: "[00]", label: "Employees reached" },
  { value: "[00]", label: "Internal Committees set up" },
  { value: "[00]", label: "Years of practice" },
] as const;

/**
 * Credential chips under the About section, same convention and same reason as
 * DEMO_STATS: visible "[00]" placeholders, only ever rendered in demo mode.
 *
 * The design these came from shipped "10+ Years Experience / 500+ Workshops /
 * 50+ Companies Trained" as unverified placeholder copy. A configured
 * production site with no real figures shows no chips at all — see lib/about.ts.
 */
export const DEMO_ABOUT_PILLS = [
  "[00]+ years of practice",
  "[00]+ sessions delivered",
  "[00]+ organisations trained",
] as const;

export const DEMO_SERVICES: ServiceSummary[] = [
  {
    _id: "demo-svc-1",
    title: "POSH awareness sessions",
    slug: "posh-awareness-sessions",
    summary:
      "Sessions for all staff covering what the Act protects against, how to raise a concern, and what happens next.",
    order: 1,
    icon: "◆",
  },
  {
    _id: "demo-svc-2",
    title: "Internal Committee training",
    slug: "internal-committee-training",
    summary:
      "Procedure-level training for IC members: receiving a complaint, running an inquiry, and writing a report that holds up.",
    order: 2,
    icon: "◆",
  },
  {
    _id: "demo-svc-3",
    title: "External IC member",
    slug: "external-ic-member",
    summary:
      "Standing as the external member your committee is required to include.",
    order: 3,
    icon: "◆",
  },
  {
    _id: "demo-svc-4",
    title: "Policy drafting and review",
    slug: "policy-drafting-and-review",
    summary:
      "A written policy that reflects how your organisation actually works, not a downloaded template.",
    order: 4,
    icon: "◆",
  },
  {
    _id: "demo-svc-5",
    title: "POSH compliance audit",
    slug: "posh-compliance-audit",
    summary:
      "A review of your policy, committee, records and training history against what the Act requires.",
    order: 5,
    icon: "◆",
  },
  {
    _id: "demo-svc-6",
    title: "Manager and leadership training",
    slug: "manager-training",
    summary:
      "For the people who receive concerns informally, long before anything reaches a committee.",
    order: 6,
    icon: "◆",
  },
];

export const DEMO_POSH_SECTIONS: PoshSection[] = [
  {
    _id: "demo-posh-1",
    title: "What the Act requires of an employer",
    anchor: "compliance-employer-duties",
    group: "Compliance",
    order: 1,
    summary: "Sample section — demonstrates layout only.",
    body: [p(SAMPLE_NOTE), p("A real section here sets out the employer's duties in plain language, with the relevant timelines called out so a reader can act on them.")],
  },
  {
    _id: "demo-posh-2",
    title: "What counts as non-compliance",
    anchor: "compliance-non-compliance",
    group: "Compliance",
    order: 2,
    body: [p(SAMPLE_NOTE)],
  },
  {
    _id: "demo-posh-3",
    title: "Constituting an Internal Committee",
    anchor: "ic-constitution",
    group: "Internal Committee",
    order: 1,
    summary: "Sample section — demonstrates layout only.",
    body: [p(SAMPLE_NOTE), p("This is one of the highest-value pages on the site: 'IC constitution rules' is a term people search for directly.")],
  },
  {
    _id: "demo-posh-4",
    title: "The role of the external member",
    anchor: "ic-external-member",
    group: "Internal Committee",
    order: 2,
    body: [p(SAMPLE_NOTE)],
  },
  {
    _id: "demo-posh-5",
    title: "Who can make a complaint",
    anchor: "complaint-who",
    group: "Complaints",
    order: 1,
    body: [p(SAMPLE_NOTE)],
  },
  {
    _id: "demo-posh-6",
    title: "Is home a workplace?",
    anchor: "def-workplace",
    group: "Definitions",
    order: 1,
    summary: "Sample section — demonstrates layout only.",
    body: [p(SAMPLE_NOTE), p("A long-tail search term the site is intended to own.")],
  },
  {
    _id: "demo-posh-7",
    title: "The inquiry process and its timelines",
    anchor: "redressal-inquiry",
    group: "Redressal",
    order: 1,
    body: [p(SAMPLE_NOTE)],
  },
  {
    _id: "demo-posh-8",
    title: "Confidentiality is not the same as anonymity",
    anchor: "conf-vs-anonymity",
    group: "Confidentiality",
    order: 1,
    body: [p(SAMPLE_NOTE)],
  },
];

export const DEMO_QUICK_REFERENCE: QuickReference[] = [
  {
    _id: "demo-qr-1",
    title: "Inquiry timelines",
    anchor: "timelines",
    order: 1,
    intro: "Sample card — the real timelines are supplied by Jyoti.",
    body: [p(SAMPLE_NOTE)],
  },
  {
    _id: "demo-qr-2",
    title: "Committee composition",
    anchor: "composition",
    order: 2,
    intro: "Sample card — demonstrates the table layout.",
    body: [p(SAMPLE_NOTE)],
  },
];

export const DEMO_POSTS: PostSummary[] = [
  {
    _id: "demo-post-1",
    title: "What to do in the first 48 hours after a complaint",
    slug: "first-48-hours",
    excerpt:
      "Sample post. The first two days shape everything that follows — this is what a practical, experience-led post looks like in this layout.",
    publishedAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    category: { title: "Internal Committee", slug: "internal-committee" },
  },
  {
    _id: "demo-post-2",
    title: "Why most POSH policies fail their first real test",
    slug: "why-policies-fail",
    excerpt:
      "Sample post. A downloaded template survives an audit and collapses the moment someone actually uses it.",
    publishedAt: new Date(Date.now() - 12 * 864e5).toISOString(),
    category: { title: "Policy", slug: "policy" },
  },
  {
    _id: "demo-post-3",
    title: "Remote teams and the definition of workplace",
    slug: "remote-workplace",
    excerpt:
      "Sample post. Where the Act's definition reaches once nobody shares an office.",
    publishedAt: new Date(Date.now() - 25 * 864e5).toISOString(),
    category: { title: "The POSH Act", slug: "the-posh-act" },
  },
];

export const DEMO_FAQS: Faq[] = [
  {
    _id: "demo-faq-1",
    question: "Do we need an Internal Committee if we have fewer than 10 staff?",
    answer: [p(SAMPLE_NOTE)],
    category: "The POSH Act",
    order: 1,
  },
  {
    _id: "demo-faq-2",
    question: "How long does a session take?",
    answer: [p(SAMPLE_NOTE)],
    category: "Training and sessions",
    order: 1,
  },
  {
    _id: "demo-faq-3",
    question: "Is the certificate recognised?",
    answer: [
      p(SAMPLE_NOTE),
      p("The real answer here is careful and specific: it is a Certificate of Completion for this training. It is not a government qualification, and the site must never imply otherwise."),
    ],
    category: "The course and certificate",
    order: 1,
  },
];

/**
 * Sample testimonials.
 *
 * Attribution is deliberately "Sample —" rather than a plausible name at a
 * plausible company. The mockup these came from used invented people at invented
 * firms, which is exactly what CLAUDE.md forbids: a fabricated quote attributed
 * to a named person at a named employer is a real problem for the client, not a
 * placeholder. Real quotes replace these, and only with permission on file.
 */
export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    _id: "demo-t-1",
    quote:
      "This is sample text in place of a real client quote. It exists so the layout can be reviewed. A genuine testimonial replaces it, with written permission on file.",
    authorName: "Sample — not a real testimonial",
    authorRole: "Demo content",
  },
  {
    _id: "demo-t-2",
    quote:
      "Second sample quote, used to show how the section behaves with more than one entry.",
    authorName: "Sample — not a real testimonial",
    authorRole: "Demo content",
  },
];

export const DEMO_COURSES: CourseSummary[] = [
  {
    _id: "demo-course-1",
    title: "POSH Awareness — Employee Course",
    slug: "posh-awareness-employee",
    summary:
      "Sample course. Self-paced modules, a short assessment per chapter, and a Certificate of Completion at the end.",
    priceInPaise: 149900,
    durationMinutes: 90,
  },
];
