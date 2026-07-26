import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M4 — Postgres-backed Knowledge Hub getters:
// PoshSection, QuickReference, CtaBand. Flip rule per type, as everywhere.
//
// This is the SEO centerpiece and the highest-content-volume type. Anchors
// are permanent public deep links — the admin UI locks them behind an
// explicit unlock, and nothing here ever rewrites one.
// ─────────────────────────────────────────────────────────────────────────────
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import type { RichTextDoc } from "@/lib/richtext";
import * as sanity from "@/lib/sanity";
import { TAGS } from "@/lib/sanity";
import type { CtaBand, PoshSection, QuickReference } from "@/lib/sanity";

const REVALIDATE = 3600;

export const getPoshSections = unstable_cache(
  async (): Promise<PoshSection[]> => {
    const total = await db.poshSection.count();
    if (total === 0) return sanity.getPoshSections();

    const rows = await db.poshSection.findMany({
      where: { isPublished: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        anchor: true,
        group: true,
        order: true,
        summary: true,
        isFaq: true,
        body: true,
      },
    });

    return rows.map((r) => ({
      _id: r.id,
      title: r.title,
      anchor: r.anchor,
      group: r.group,
      order: r.order,
      summary: r.summary ?? undefined,
      isFaq: r.isFaq,
      body: r.body as RichTextDoc,
    }));
  },
  ["content-posh-sections"],
  { tags: [TAGS.poshSection], revalidate: REVALIDATE },
);

export const getQuickReferences = unstable_cache(
  async (): Promise<QuickReference[]> => {
    const total = await db.quickReference.count();
    if (total === 0) return sanity.getQuickReferences();

    const rows = await db.quickReference.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true, anchor: true, order: true, intro: true, body: true },
    });

    return rows.map((r) => ({
      _id: r.id,
      title: r.title,
      anchor: r.anchor,
      order: r.order,
      intro: r.intro ?? undefined,
      body: r.body as RichTextDoc,
    }));
  },
  ["content-quick-references"],
  { tags: [TAGS.poshSection], revalidate: REVALIDATE },
);

export const getCtaBands = unstable_cache(
  async (): Promise<CtaBand[]> => {
    const total = await db.ctaBand.count();
    if (total === 0) return sanity.getCtaBands();

    const rows = await db.ctaBand.findMany({
      where: { isPublished: true, afterGroup: { not: null } },
      select: {
        id: true,
        heading: true,
        body: true,
        buttonLabel: true,
        buttonHref: true,
        afterGroup: true,
      },
    });

    return rows.map((r) => ({
      _id: r.id,
      heading: r.heading,
      body: r.body ?? undefined,
      buttonLabel: r.buttonLabel,
      buttonHref: r.buttonHref,
      afterGroup: r.afterGroup ?? undefined,
    }));
  },
  ["content-cta-bands"],
  { tags: [TAGS.poshSection], revalidate: REVALIDATE },
);
