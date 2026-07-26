"use server";

// CMS migration M2 — Service CRUD.
import { Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { CrudState } from "@/components/admin/crud/types";
import {
  checkbox,
  computeSwap,
  jsonField,
  lines,
  optStr,
  reqStr,
} from "@/lib/admin-content";
import { db } from "@/lib/db";
import { richTextSchema } from "@/lib/richtext";
import { TAGS } from "@/lib/sanity";
import { requireAdmin } from "@/lib/session";

const serviceSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, digits and hyphens",
    )
    .max(96),
  summary: z.string().trim().min(10).max(500),
  icon: z.string().trim().max(50).nullable(),
  whoItIsFor: z.array(z.string().max(200)).max(20),
  whatIsCovered: z.array(z.string().max(200)).max(30),
  format: z.string().trim().max(200).nullable(),
  body: richTextSchema.nullable(),
  seoTitle: z.string().trim().max(70).nullable(),
  seoDescription: z.string().trim().max(160).nullable(),
  isPublished: z.boolean(),
});

function bust() {
  updateTag(TAGS.service);
  revalidatePath("/admin/services");
}

export async function saveService(
  _prev: CrudState,
  fd: FormData,
): Promise<CrudState> {
  if (!(await requireAdmin()))
    return { status: "error", message: "Not authorised." };

  const id = optStr(fd, "id");
  const rawBody = jsonField(fd, "body");
  const parsed = serviceSchema.safeParse({
    title: reqStr(fd, "title"),
    slug: reqStr(fd, "slug"),
    summary: reqStr(fd, "summary"),
    icon: optStr(fd, "icon"),
    whoItIsFor: lines(fd, "whoItIsFor"),
    whatIsCovered: lines(fd, "whatIsCovered"),
    format: optStr(fd, "format"),
    body: rawBody,
    seoTitle: optStr(fd, "seoTitle"),
    seoDescription: optStr(fd, "seoDescription"),
    isPublished: checkbox(fd, "isPublished"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: "error",
      message: first?.message ?? "Check the form and try again.",
    };
  }

  // Prisma's nullable-Json columns take Prisma.JsonNull, not a TS null.
  const data = { ...parsed.data, body: parsed.data.body ?? Prisma.JsonNull };

  try {
    if (id) {
      await db.service.update({ where: { id }, data });
      bust();
      return { status: "success", message: "Saved." };
    }

    const max = await db.service.aggregate({ _max: { order: true } });
    await db.service.create({
      data: { ...data, order: (max._max.order ?? 0) + 1 },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        status: "error",
        message: "That slug is already in use by another service.",
      };
    }
    console.error("[admin:service:save]", err);
    return { status: "error", message: "Something went wrong. Try again." };
  }

  bust();
  redirect("/admin/services");
}

export async function deleteService(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    await db.service.delete({ where: { id } });
    bust();
  } catch (err) {
    console.error("[admin:service:delete]", err);
  }
  redirect("/admin/services");
}

export async function moveService(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  if (!(await requireAdmin())) return;
  const rows = await db.service.findMany({ select: { id: true, order: true } });
  const swap = computeSwap(rows, id, direction);
  if (!swap) return;

  await db.$transaction([
    db.service.update({
      where: { id: swap.a.id },
      data: { order: swap.a.order },
    }),
    db.service.update({
      where: { id: swap.b.id },
      data: { order: swap.b.order },
    }),
  ]);
  bust();
}

/** Flips Published/Draft from the list view — no need to open the full editor. */
export async function togglePublish(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  const row = await db.service.findUnique({
    where: { id },
    select: { isPublished: true },
  });
  if (!row) return;
  await db.service.update({
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
