import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M2 — Postgres-backed getters for the five simple types:
// FAQ, Testimonial, Service, InstagramPost, SiteSettings.
//
// FLIP RULE (per type, documented in CMS-MIGRATION-PLAN.md §7): a type serves
// from Postgres as soon as it has AT LEAST ONE row there; with zero rows it
// falls through to the Sanity-backed getter unchanged. So the site keeps
// serving Sanity content until the migration script (or the admin) writes the
// first row of a type — and each type flips independently, keeping the whole
// window reversible. A type is never merged across both systems: half-merged
// lists would make "where do I edit this?" unanswerable for the owner.
//
// CACHING: same tag vocabulary as the Sanity getters (TAGS.*), via
// unstable_cache. Admin mutations call revalidateTag(TAGS.<type>) — identical
// to what the Sanity webhook does — so downstream pages don't know or care
// which system invalidated them.
// ─────────────────────────────────────────────────────────────────────────────
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { imageSrc } from "@/lib/images";
import type { RichTextDoc } from "@/lib/richtext";
import * as sanity from "@/lib/sanity";
import { TAGS } from "@/lib/sanity";
import type {
  Faq,
  InstagramPost,
  ServiceSummary,
  Service,
  SiteSettings,
  Testimonial,
} from "@/lib/sanity";

const REVALIDATE = 3600;

/* ── FAQ ──────────────────────────────────────────────────────────────────── */

export const getFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    const rows = await db.faq.findMany({
      where: { isPublished: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: { id: true, question: true, answer: true, category: true, order: true },
    });
    if (rows.length === 0) return sanity.getFaqs();

    return rows.map((r) => ({
      _id: r.id,
      question: r.question,
      answer: r.answer as RichTextDoc,
      category: r.category,
      order: r.order,
    }));
  },
  ["content-faqs"],
  { tags: [TAGS.faq], revalidate: REVALIDATE },
);

/* ── Testimonials ─────────────────────────────────────────────────────────── */

/**
 * Same consent rule as the Sanity getter: rows without written permission on
 * file are NEVER returned publicly, regardless of isPublished.
 */
export const getTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const total = await db.testimonial.count();
    if (total === 0) return sanity.getTestimonials();

    const rows = await db.testimonial.findMany({
      where: { isPublished: true, consentOnFile: true },
      orderBy: { order: "asc" },
      select: { id: true, quote: true, authorName: true, authorRole: true, organization: true },
    });

    return rows.map((r) => ({
      _id: r.id,
      quote: r.quote,
      authorName: r.authorName,
      authorRole: r.authorRole ?? undefined,
      organization: r.organization ?? undefined,
    }));
  },
  ["content-testimonials"],
  { tags: [TAGS.testimonial], revalidate: REVALIDATE },
);

/* ── Services ─────────────────────────────────────────────────────────────── */

export const getServices = unstable_cache(
  async (): Promise<ServiceSummary[]> => {
    const rows = await db.service.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true, slug: true, summary: true, order: true, icon: true },
    });
    if (rows.length === 0) return sanity.getServices();

    return rows.map((r) => ({
      _id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      order: r.order,
      icon: r.icon ?? undefined,
    }));
  },
  ["content-services"],
  { tags: [TAGS.service], revalidate: REVALIDATE },
);

export const getServiceBySlug = unstable_cache(
  async (slug: string): Promise<Service | null> => {
    // Flip rule applies to the TYPE, not the row: with zero Postgres services
    // the lookup goes to Sanity; once any exist, a missing slug is a real 404.
    const total = await db.service.count();
    if (total === 0) return sanity.getServiceBySlug(slug);

    const r = await db.service.findFirst({
      where: { slug, isPublished: true },
    });
    if (!r) return null;

    return {
      _id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      order: r.order,
      icon: r.icon ?? undefined,
      whoItIsFor: r.whoItIsFor.length > 0 ? r.whoItIsFor : undefined,
      whatIsCovered: r.whatIsCovered.length > 0 ? r.whatIsCovered : undefined,
      format: r.format ?? undefined,
      body: (r.body as RichTextDoc | null) ?? undefined,
      seoTitle: r.seoTitle ?? undefined,
      seoDescription: r.seoDescription ?? undefined,
    };
  },
  ["content-service-by-slug"],
  { tags: [TAGS.service], revalidate: REVALIDATE },
);

/* ── Instagram ────────────────────────────────────────────────────────────── */

export const getInstagramPosts = unstable_cache(
  async (): Promise<InstagramPost[]> => {
    const rows = await db.instagramPost.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, imageKey: true, permalink: true, caption: true, order: true },
    });
    if (rows.length === 0) return sanity.getInstagramPosts();

    return rows.map((r) => ({
      _id: r.id,
      imageUrl: imageSrc(r.imageKey),
      permalink: r.permalink,
      caption: r.caption,
      order: r.order,
    }));
  },
  ["content-instagram"],
  { tags: [TAGS.instagramPost], revalidate: REVALIDATE },
);

/* ── Site settings ────────────────────────────────────────────────────────── */

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const row = await db.siteSettingsRow.findUnique({ where: { id: "singleton" } });
    if (!row) return sanity.getSiteSettings();

    return {
      businessName: row.businessName,
      email: row.email,
      phone: row.phone ?? undefined,
      whatsappNumber: row.whatsappNumber ?? undefined,
      whatsappDefaultMessage: row.whatsappDefaultMessage ?? undefined,
      addressLines: row.addressLines.length > 0 ? row.addressLines : undefined,
      linkedinUrl: row.linkedinUrl ?? undefined,
      instagramUrl: row.instagramUrl ?? undefined,
      youtubeUrl: row.youtubeUrl ?? undefined,
      announcement: row.announcementText
        ? {
            enabled: row.announcementEnabled,
            text: row.announcementText,
            href: row.announcementHref ?? undefined,
          }
        : undefined,
      heroHeading: row.heroHeading ?? undefined,
      heroSubheading: row.heroSubheading ?? undefined,
      heroPrimaryCtaLabel: row.heroPrimaryCtaLabel ?? undefined,
      heroPrimaryCtaHref: row.heroPrimaryCtaHref ?? undefined,
      legalEntityName: row.legalEntityName ?? undefined,
      gstin: row.gstin ?? undefined,
      supportEmail: row.supportEmail ?? undefined,
    };
  },
  ["content-site-settings"],
  { tags: [TAGS.siteSettings], revalidate: REVALIDATE },
);
