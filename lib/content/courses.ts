import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M5 — Postgres-backed course getters for the PUBLIC site.
//
// FLIP RULE here differs from the other types, deliberately: Course rows have
// existed in Postgres since Phase 2 (the structural mirror the webhook syncs),
// so "has rows" proves nothing. The signal is CONTENT: once any course row has
// `summary` set — written by the migration script or the admin — the public
// course pages read Postgres. Until then they read Sanity.
//
// ★ SECURITY (CLAUDE.md hard rule): these getters feed PUBLIC marketing pages.
//   `videoUid` is NEVER selected — not at any depth. The Prisma `select`
//   clauses below are the enforcement; the self-check grep allows this file's
//   comment only because the string appears in prose, not in a select.
// ─────────────────────────────────────────────────────────────────────────────
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import type { RichTextDoc } from "@/lib/richtext";
import * as sanity from "@/lib/sanity";
import { TAGS } from "@/lib/sanity";
import type { CourseDetail, CourseSummary } from "@/lib/sanity";

const REVALIDATE = 3600;

/** True once course CONTENT lives in Postgres (see header). */
async function contentInPostgres(): Promise<boolean> {
  const withContent = await db.course.count({ where: { summary: { not: null } } });
  return withContent > 0;
}

export const getCourses = unstable_cache(
  async (): Promise<CourseSummary[]> => {
    if (!(await contentInPostgres())) return sanity.getCourses();

    const rows = await db.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        priceInPaise: true,
        durationMinutes: true,
        coverImageKey: true,
      },
    });

    return rows.map((r) => ({
      _id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary ?? "",
      priceInPaise: r.priceInPaise,
      durationMinutes: r.durationMinutes ?? undefined,
      coverImage: undefined, // no consumer reads it; key exposed via nothing
    }));
  },
  ["content-courses"],
  { tags: [TAGS.course], revalidate: REVALIDATE },
);

export const getCourseBySlug = unstable_cache(
  async (slug: string): Promise<CourseDetail | null> => {
    if (!(await contentInPostgres())) return sanity.getCourseBySlug(slug);

    const r = await db.course.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        priceInPaise: true,
        durationMinutes: true,
        description: true,
        learningOutcomes: true,
        courseFaqs: true,
        seoTitle: true,
        seoDescription: true,
        chapters: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            summary: true,
            modules: {
              orderBy: { order: "asc" },
              // ★ titles and durations ONLY — never the Stream UID. This select
              //   is the public-page gate CLAUDE.md's grep protects.
              select: {
                id: true,
                title: true,
                order: true,
                isFreePreview: true,
                durationSeconds: true,
              },
            },
          },
        },
      },
    });
    if (!r) return null;

    const faqs = Array.isArray(r.courseFaqs)
      ? (r.courseFaqs as { question: string; answer: string }[])
      : undefined;

    return {
      _id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary ?? "",
      priceInPaise: r.priceInPaise,
      durationMinutes: r.durationMinutes ?? undefined,
      description: (r.description as RichTextDoc | null) ?? undefined,
      learningOutcomes: r.learningOutcomes.length > 0 ? r.learningOutcomes : undefined,
      faqs,
      seoTitle: r.seoTitle ?? undefined,
      seoDescription: r.seoDescription ?? undefined,
      chapters: r.chapters.map((c) => ({
        _id: c.id,
        title: c.title,
        order: c.order,
        summary: c.summary ?? undefined,
        modules: c.modules.map((m) => ({
          _id: m.id,
          title: m.title,
          order: m.order,
          isFreePreview: m.isFreePreview,
          durationSeconds: m.durationSeconds,
        })),
      })),
    };
  },
  ["content-course-by-slug"],
  { tags: [TAGS.course], revalidate: REVALIDATE },
);
