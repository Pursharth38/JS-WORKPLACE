import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M3 — Postgres-backed blog getters.
// Same flip rule as lib/content/simple.ts: zero BlogPost rows → Sanity.
// Published means isPublished AND publishedAt in the past — a future
// publishedAt is a scheduled post, invisible until its time comes.
// ─────────────────────────────────────────────────────────────────────────────
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { imageSrc } from "@/lib/images";
import type { RichTextDoc } from "@/lib/richtext";
import * as sanity from "@/lib/sanity";
import { TAGS } from "@/lib/sanity";
import type { Category, Post, PostSummary } from "@/lib/sanity";

const REVALIDATE = 3600;

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date | null;
  coverImageKey: string | null;
  coverImageAlt: string | null;
  category: { title: string; slug: string } | null;
};

function toSummary(r: PostRow): PostSummary {
  return {
    _id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    publishedAt: (r.publishedAt ?? new Date(0)).toISOString(),
    // One key serves both slots — R2 originals are already web-sized (≤5 MB
    // upload cap); the card CSS crops. Sanity rows differ because its CDN
    // resizes on the fly.
    coverImageUrl: r.coverImageKey ? imageSrc(r.coverImageKey) : undefined,
    coverImageWideUrl: r.coverImageKey ? imageSrc(r.coverImageKey) : undefined,
    coverImageAlt: r.coverImageAlt ?? undefined,
    category: r.category ?? undefined,
  };
}

const SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  coverImageKey: true,
  coverImageAlt: true,
  category: { select: { title: true, slug: true } },
} as const;

const publishedWhere = () => ({
  isPublished: true,
  publishedAt: { lte: new Date() },
});

export const getPosts = unstable_cache(
  async (limit?: number): Promise<PostSummary[]> => {
    const total = await db.blogPost.count();
    if (total === 0) return sanity.getPosts(limit);

    const rows = await db.blogPost.findMany({
      where: publishedWhere(),
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SUMMARY_SELECT,
    });
    return rows.map(toSummary);
  },
  ["content-posts"],
  { tags: [TAGS.post], revalidate: REVALIDATE },
);

export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<Post | null> => {
    const total = await db.blogPost.count();
    if (total === 0) return sanity.getPostBySlug(slug);

    const r = await db.blogPost.findFirst({
      where: { slug, ...publishedWhere() },
      select: {
        ...SUMMARY_SELECT,
        body: true,
        tags: true,
        seoTitle: true,
        seoDescription: true,
        relatedHubAnchors: true,
      },
    });
    if (!r) return null;

    // Resolve hub anchors to their live titles so the "related reading" links
    // stay accurate when a section is renamed (the anchor itself never changes).
    const anchors =
      r.relatedHubAnchors.length > 0
        ? await db.poshSection.findMany({
            where: { anchor: { in: r.relatedHubAnchors } },
            select: { title: true, anchor: true },
          })
        : [];

    return {
      ...toSummary(r),
      body: r.body as RichTextDoc,
      tags: r.tags.length > 0 ? r.tags : undefined,
      seoTitle: r.seoTitle ?? undefined,
      seoDescription: r.seoDescription ?? undefined,
      relatedHubAnchors: anchors.length > 0 ? anchors : undefined,
    };
  },
  ["content-post-by-slug"],
  { tags: [TAGS.post, TAGS.poshSection], revalidate: REVALIDATE },
);

export const getPostsByCategory = unstable_cache(
  async (slug: string): Promise<PostSummary[]> => {
    const total = await db.blogPost.count();
    if (total === 0) return sanity.getPostsByCategory(slug);

    const rows = await db.blogPost.findMany({
      where: { ...publishedWhere(), category: { slug } },
      orderBy: { publishedAt: "desc" },
      select: SUMMARY_SELECT,
    });
    return rows.map(toSummary);
  },
  ["content-posts-by-category"],
  { tags: [TAGS.post], revalidate: REVALIDATE },
);

export const getRelatedPosts = unstable_cache(
  async (categorySlug: string | undefined, excludeId: string): Promise<PostSummary[]> => {
    const total = await db.blogPost.count();
    if (total === 0) return sanity.getRelatedPosts(categorySlug, excludeId);
    if (!categorySlug) return [];

    const rows = await db.blogPost.findMany({
      where: { ...publishedWhere(), category: { slug: categorySlug }, id: { not: excludeId } },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: SUMMARY_SELECT,
    });
    return rows.map(toSummary);
  },
  ["content-related-posts"],
  { tags: [TAGS.post], revalidate: REVALIDATE },
);

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const total = await db.blogPost.count();
    if (total === 0) return sanity.getCategories();

    const rows = await db.blogCategory.findMany({
      orderBy: { title: "asc" },
      select: { title: true, slug: true, description: true },
    });
    return rows.map((r) => ({
      title: r.title,
      slug: r.slug,
      description: r.description ?? undefined,
    }));
  },
  ["content-categories"],
  { tags: [TAGS.category, TAGS.post], revalidate: REVALIDATE },
);
