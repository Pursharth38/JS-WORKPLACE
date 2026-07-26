"use server";

// CMS migration M4 — POSH Hub section CRUD.
//
// ⚠️ Anchors are permanent public deep links (/posh-act#<anchor>) shared in
// trainings and emails. The form locks the anchor behind an explicit unlock;
// this action additionally refuses to CHANGE an anchor on a published section
// unless the form sent the confirmAnchorChange flag the unlock sets.
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { CrudState } from "@/components/admin/crud/types";
import {
  checkbox,
  computeSwap,
  jsonField,
  optStr,
  reqStr,
} from "@/lib/admin-content";
import { db } from "@/lib/db";
import { POSH_GROUPS } from "@/lib/posh-groups";
import { richTextSchema } from "@/lib/richtext";
import { TAGS } from "@/lib/sanity";
import { requireAdmin } from "@/lib/session";

const sectionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  anchor: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Anchors are lowercase letters, digits and hyphens",
    )
    .max(96),
  group: z.enum(POSH_GROUPS),
  summary: z.string().trim().max(500).nullable(),
  isFaq: z.boolean(),
  body: richTextSchema,
  isPublished: z.boolean(),
});

function bust() {
  updateTag(TAGS.poshSection);
  revalidatePath("/admin/posh-hub");
}

export async function saveSection(
  _prev: CrudState,
  fd: FormData,
): Promise<CrudState> {
  if (!(await requireAdmin()))
    return { status: "error", message: "Not authorised." };

  const id = optStr(fd, "id");
  const parsed = sectionSchema.safeParse({
    title: reqStr(fd, "title"),
    anchor: reqStr(fd, "anchor"),
    group: reqStr(fd, "group"),
    summary: optStr(fd, "summary"),
    isFaq: checkbox(fd, "isFaq"),
    body: jsonField(fd, "body"),
    isPublished: checkbox(fd, "isPublished"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: "error",
      message: first?.message ?? "Check the form and try again.",
    };
  }

  try {
    if (id) {
      const existing = await db.poshSection.findUnique({
        where: { id },
        select: { anchor: true, isPublished: true, group: true },
      });
      if (!existing) return { status: "error", message: "Section not found." };

      // Server-side backstop for the anchor lock: a published section's anchor
      // only changes when the form explicitly confirmed the unlock.
      if (
        existing.isPublished &&
        existing.anchor !== parsed.data.anchor &&
        !checkbox(fd, "confirmAnchorChange")
      ) {
        return {
          status: "error",
          message:
            "This section is published — its anchor is a permanent shared link. Unlock the anchor field to confirm you really mean to change it.",
        };
      }

      // Moving groups appends at the end of the target group.
      let order: number | undefined;
      if (existing.group !== parsed.data.group) {
        const max = await db.poshSection.aggregate({
          where: { group: parsed.data.group },
          _max: { order: true },
        });
        order = (max._max.order ?? 0) + 1;
      }

      await db.poshSection.update({
        where: { id },
        data: { ...parsed.data, ...(order !== undefined ? { order } : {}) },
      });
      bust();
      return { status: "success", message: "Saved." };
    }

    const max = await db.poshSection.aggregate({
      where: { group: parsed.data.group },
      _max: { order: true },
    });
    await db.poshSection.create({
      data: { ...parsed.data, order: (max._max.order ?? 0) + 1 },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        status: "error",
        message: "That anchor is already used by another section.",
      };
    }
    console.error("[admin:posh-hub:save]", err);
    return { status: "error", message: "Something went wrong. Try again." };
  }

  bust();
  redirect("/admin/posh-hub");
}

export async function deleteSection(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    await db.poshSection.delete({ where: { id } });
    bust();
  } catch (err) {
    console.error("[admin:posh-hub:delete]", err);
  }
  redirect("/admin/posh-hub");
}

export async function moveSection(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  if (!(await requireAdmin())) return;
  const row = await db.poshSection.findUnique({
    where: { id },
    select: { group: true },
  });
  if (!row) return;

  const rows = await db.poshSection.findMany({
    where: { group: row.group },
    select: { id: true, order: true },
  });
  const swap = computeSwap(rows, id, direction);
  if (!swap) return;

  await db.$transaction([
    db.poshSection.update({
      where: { id: swap.a.id },
      data: { order: swap.a.order },
    }),
    db.poshSection.update({
      where: { id: swap.b.id },
      data: { order: swap.b.order },
    }),
  ]);
  bust();
}

/** Flips Published/Draft from the list view — no need to open the full editor. */
export async function togglePublish(id: string): Promise<void> {
  if (!(await requireAdmin())) return;
  const row = await db.poshSection.findUnique({
    where: { id },
    select: { isPublished: true },
  });
  if (!row) return;
  await db.poshSection.update({
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
