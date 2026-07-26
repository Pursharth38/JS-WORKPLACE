"use server";

// CMS migration M3 — Blog CRUD (posts + categories).
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { CrudState } from "@/components/admin/crud/types";
import {
  checkbox,
  jsonField,
  lines,
  optStr,
  reqStr,
} from "@/lib/admin-content";
import { CONTENT_IMAGE_PREFIX } from "@/lib/images";
import { db } from "@/lib/db";
import { richTextSchema } from "@/lib/richtext";
import { TAGS } from "@/lib/sanity";
import { requireAdmin } from "@/lib/session";

const postSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, digits and hyphens",
    )
    .max(96),
  excerpt: z.string().trim().min(10).max(500),
  body: richTextSchema,
  coverImageKey: z
    .string()
    .startsWith(CONTENT_IMAGE_PREFIX)
    .max(300)
    .nullable(),
  coverImageAlt: z.string().trim().max(300).nullable(),
  categoryId: z.string().max(60).nullable(),
  tags: z.array(z.string().max(50)).max(15),
  relatedHubAnchors: z.array(z.string().max(120)).max(10),
  seoTitle: z.string().trim().max(70).nullable(),
  seoDescription: z.string().trim().max(160).nullable(),
  isPublished: z.boolean(),
});

function bust() {
  updateTag(TAGS.post);
  updateTag(TAGS.category);
  revalidatePath("/admin/blog");
}

export async function savePost(
  _prev: CrudState,
  fd: FormData,
): Promise<CrudState> {
  if (!(await requireAdmin()))
    return { status: "error", message: "Not authorised." };

  const id = optStr(fd, "id");
  const parsed = postSchema.safeParse({
    title: reqStr(fd, "title"),
    slug: reqStr(fd, "slug"),
    excerpt: reqStr(fd, "excerpt"),
    body: jsonField(fd, "body"),
    coverImageKey: optStr(fd, "coverImageKey"),
    coverImageAlt: optStr(fd, "coverImageAlt"),
    categoryId: optStr(fd, "categoryId"),
    tags: lines(fd, "tags"),
    relatedHubAnchors: lines(fd, "relatedHubAnchors"),
    seoTitle: optStr(fd, "seoTitle"),
    seoDescription: optStr(fd, "seoDescription"),
    isPublished: checkbox(fd, "isPublished"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: "error",
      message:
        first?.message ??
        "Check the form — title, slug, excerpt and body are required.",
    };
  }

  const data = parsed.data;

  try {
    if (id) {
      const existing = await db.blogPost.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      await db.blogPost.update({
        where: { id },
        data: {
          ...data,
          // First publish stamps publishedAt; unpublish/republish keeps the
          // original date so the post doesn't jump the feed order.
          publishedAt:
            data.isPublished && !existing?.publishedAt
              ? new Date()
              : existing?.publishedAt,
        },
      });
      bust();
      return { status: "success", message: "Saved." };
    }

    await db.blogPost.create({
      data: { ...data, publishedAt: data.isPublished ? new Date() : null },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        status: "error",
        message: "That slug is already in use by another post.",
      };
    }
    console.error("[admin:blog:save]", err);
    return { status: "error", message: "Something went wrong. Try again." };
  }

  bust();
  redirect("/admin/blog");
}

export async function deletePost(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    await db.blogPost.delete({ where: { id } });
    bust();
  } catch (err) {
    console.error("[admin:blog:delete]", err);
  }
  redirect("/admin/blog");
}

/* ── Categories ─────────────────────────────────────────────────────────── */

const categorySchema = z.object({
  title: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(96),
  description: z.string().trim().max(300).nullable(),
});

export async function saveCategory(
  _prev: CrudState,
  fd: FormData,
): Promise<CrudState> {
  if (!(await requireAdmin()))
    return { status: "error", message: "Not authorised." };

  const parsed = categorySchema.safeParse({
    title: reqStr(fd, "title"),
    slug:
      optStr(fd, "slug") ??
      reqStr(fd, "title")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    description: optStr(fd, "description"),
  });
  if (!parsed.success)
    return { status: "error", message: "Give the category a name." };

  try {
    await db.blogCategory.create({ data: parsed.data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        status: "error",
        message: "A category with that slug already exists.",
      };
    }
    console.error("[admin:blog:category]", err);
    return { status: "error", message: "Something went wrong. Try again." };
  }

  bust();
  return {
    status: "success",
    message: `Category "${parsed.data.title}" created.`,
  };
}

export async function deleteCategory(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    // Posts keep existing — categoryId is SetNull on delete.
    await db.blogCategory.delete({ where: { id } });
    bust();
  } catch (err) {
    console.error("[admin:blog:category-delete]", err);
  }
  revalidatePath("/admin/blog");
}

/** Flips Published/Draft from the list view — no need to open the full editor. */
export async function togglePublish(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  const row = await db.blogPost.findUnique({
    where: { id },
    select: { isPublished: true },
  });
  if (!row) return;
  await db.blogPost.update({
    where: { id },
    data: { isPublished: !row.isPublished },
  });
  bust();
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "P2002"
  );
}
