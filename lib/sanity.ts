import "server-only";

import imageUrlBuilder from "@sanity/image-url";
import { createClient, type QueryParams } from "next-sanity";
import type { PortableTextBlock } from "@portabletext/react";

import { apiVersion, dataset, isSanityConfigured, projectId } from "@/sanity/env";

/* ───────────────────────────── CLIENT ───────────────────────────────────── */

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  // The CDN serves cached, published content. Draft previews would need a token
  // and `useCdn: false`; we do not expose drafts on the public site.
  useCdn: true,
  perspective: "published",
});

const builder = imageUrlBuilder({ projectId, dataset });

/**
 * Derived from the builder's own signature rather than imported from
 * `@sanity/image-url/lib/types/types` — that deep path was removed in
 * image-url v2, and deriving it means a future move cannot break us again.
 */
export type SanityImageSource = Parameters<typeof builder.image>[0];

export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}

/* ───────────────────────────── CACHE TAGS ────────────────────────────────
   /api/webhooks/sanity calls revalidateTag() with these when the client
   publishes, so a content edit goes live without a deploy.                  */

export const TAGS = {
  siteSettings: "siteSettings",
  poshSection: "poshSection",
  post: "post",
  category: "category",
  service: "service",
  faq: "faq",
  testimonial: "testimonial",
  course: "course",
} as const;

export type ContentTag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Every read goes through here so caching is consistent and a missing Sanity
 * project degrades to empty content rather than a 500 on every page.
 *
 * That fallback is deliberate: before the client's Sanity project exists, the
 * marketing site must still build and render its shell. `sanityFetch` returning
 * the caller's fallback keeps `next build` green during Phase 1–3.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags,
  fallback,
  revalidate = 3600,
}: {
  query: string;
  params?: QueryParams;
  tags: ContentTag[];
  fallback: T;
  revalidate?: number;
}): Promise<T> {
  if (!isSanityConfigured) return fallback;

  try {
    return await sanityClient.fetch<T>(query, params, {
      next: { tags, revalidate },
    });
  } catch (err) {
    console.error("[sanity:fetch]", err);
    return fallback;
  }
}

/* ───────────────────────────── TYPES ────────────────────────────────────── */

export type SanityImage = {
  asset: { _ref: string };
  alt?: string;
};

export type SiteSettings = {
  businessName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  whatsappDefaultMessage?: string;
  addressLines?: string[];
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  announcement?: { enabled?: boolean; text?: string; href?: string };
  heroHeading?: string;
  heroSubheading?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaHref?: string;
  legalEntityName?: string;
  gstin?: string;
  supportEmail?: string;
};

export type PoshSection = {
  _id: string;
  title: string;
  anchor: string;
  group: string;
  order: number;
  summary?: string;
  isFaq?: boolean;
  body: PortableTextBlock[];
};

export type CtaBand = {
  _id: string;
  heading: string;
  body?: string;
  buttonLabel: string;
  buttonHref: string;
  afterGroup?: string;
};

export type PostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  coverImage?: SanityImage;
  category?: { title: string; slug: string };
};

export type Post = PostSummary & {
  body: PortableTextBlock[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  relatedHubAnchors?: { title: string; anchor: string }[];
};

export type Category = { title: string; slug: string; description?: string };

export type ServiceSummary = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  order: number;
  icon?: string;
};

export type Service = ServiceSummary & {
  whoItIsFor?: string[];
  whatIsCovered?: string[];
  format?: string;
  body?: PortableTextBlock[];
  seoTitle?: string;
  seoDescription?: string;
};

export type Faq = {
  _id: string;
  question: string;
  answer: PortableTextBlock[];
  category: string;
  order: number;
};

export type Testimonial = {
  _id: string;
  quote: string;
  authorName: string;
  authorRole?: string;
  organization?: string;
};

export type CourseSummary = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  priceInPaise: number;
  durationMinutes?: number;
  coverImage?: SanityImage;
};

/* ───────────────────────────── QUERIES ──────────────────────────────────── */

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  businessName, email, phone, whatsappNumber, whatsappDefaultMessage,
  addressLines, linkedinUrl, instagramUrl, youtubeUrl, announcement,
  heroHeading, heroSubheading, heroPrimaryCtaLabel, heroPrimaryCtaHref,
  legalEntityName, gstin, supportEmail
}`;

/** Sensible defaults so the shell renders before the client fills Sanity in. */
export const SITE_SETTINGS_FALLBACK: SiteSettings = {
  businessName: "JS Workplace Wellness",
  email: "",
};

export function getSiteSettings(): Promise<SiteSettings> {
  return sanityFetch<SiteSettings>({
    query: SITE_SETTINGS_QUERY,
    tags: [TAGS.siteSettings],
    fallback: SITE_SETTINGS_FALLBACK,
  });
}

export function getPoshSections(): Promise<PoshSection[]> {
  return sanityFetch<PoshSection[]>({
    query: `*[_type == "poshSection"] | order(group asc, order asc){
      _id, title, "anchor": anchor.current, group, order, summary, isFaq, body
    }`,
    tags: [TAGS.poshSection],
    fallback: [],
  });
}

export function getCtaBands(): Promise<CtaBand[]> {
  return sanityFetch<CtaBand[]>({
    query: `*[_type == "ctaBand" && defined(afterGroup)]{
      _id, heading, body, buttonLabel, buttonHref, afterGroup
    }`,
    tags: [TAGS.poshSection],
    fallback: [],
  });
}

const POST_SUMMARY_PROJECTION = `
  _id, title, "slug": slug.current, excerpt, publishedAt, coverImage,
  "category": category->{title, "slug": slug.current}
`;

export function getPosts(limit?: number): Promise<PostSummary[]> {
  const slice = limit ? `[0...${limit}]` : "";
  return sanityFetch<PostSummary[]>({
    query: `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)${slice}{${POST_SUMMARY_PROJECTION}}`,
    tags: [TAGS.post],
    fallback: [],
  });
}

export function getPostBySlug(slug: string): Promise<Post | null> {
  return sanityFetch<Post | null>({
    query: `*[_type == "post" && slug.current == $slug][0]{
      ${POST_SUMMARY_PROJECTION},
      body, tags, seoTitle, seoDescription,
      "relatedHubAnchors": relatedHubAnchors[]->{title, "anchor": anchor.current}
    }`,
    params: { slug },
    tags: [TAGS.post],
    fallback: null,
  });
}

export function getPostsByCategory(slug: string): Promise<PostSummary[]> {
  return sanityFetch<PostSummary[]>({
    query: `*[_type == "post" && category->slug.current == $slug] | order(publishedAt desc){${POST_SUMMARY_PROJECTION}}`,
    params: { slug },
    tags: [TAGS.post],
    fallback: [],
  });
}

export function getRelatedPosts(
  categorySlug: string | undefined,
  excludeId: string,
): Promise<PostSummary[]> {
  if (!categorySlug) return Promise.resolve([]);
  return sanityFetch<PostSummary[]>({
    query: `*[_type == "post" && category->slug.current == $categorySlug && _id != $excludeId]
      | order(publishedAt desc)[0...3]{${POST_SUMMARY_PROJECTION}}`,
    params: { categorySlug, excludeId },
    tags: [TAGS.post],
    fallback: [],
  });
}

export function getCategories(): Promise<Category[]> {
  return sanityFetch<Category[]>({
    query: `*[_type == "category"] | order(title asc){title, "slug": slug.current, description}`,
    tags: [TAGS.category],
    fallback: [],
  });
}

export function getServices(): Promise<ServiceSummary[]> {
  return sanityFetch<ServiceSummary[]>({
    query: `*[_type == "service"] | order(order asc){
      _id, title, "slug": slug.current, summary, order, icon
    }`,
    tags: [TAGS.service],
    fallback: [],
  });
}

export function getServiceBySlug(slug: string): Promise<Service | null> {
  return sanityFetch<Service | null>({
    query: `*[_type == "service" && slug.current == $slug][0]{
      _id, title, "slug": slug.current, summary, order, icon,
      whoItIsFor, whatIsCovered, format, body, seoTitle, seoDescription
    }`,
    params: { slug },
    tags: [TAGS.service],
    fallback: null,
  });
}

export function getFaqs(): Promise<Faq[]> {
  return sanityFetch<Faq[]>({
    query: `*[_type == "faq"] | order(category asc, order asc){
      _id, question, answer, category, order
    }`,
    tags: [TAGS.faq],
    fallback: [],
  });
}

/**
 * Only testimonials with written permission on file are ever returned.
 * The schema validates the flag, and this filter is the second line of defence.
 */
export function getTestimonials(): Promise<Testimonial[]> {
  return sanityFetch<Testimonial[]>({
    query: `*[_type == "testimonial" && consentOnFile == true] | order(order asc){
      _id, quote, authorName, authorRole, organization
    }`,
    tags: [TAGS.testimonial],
    fallback: [],
  });
}

export function getCourses(): Promise<CourseSummary[]> {
  return sanityFetch<CourseSummary[]>({
    query: `*[_type == "course" && isPublished == true]{
      _id, title, "slug": slug.current, summary, priceInPaise, durationMinutes, coverImage
    }`,
    tags: [TAGS.course],
    fallback: [],
  });
}
