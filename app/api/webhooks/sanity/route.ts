import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { apiError, apiResponse } from "@/lib/response";
import { sanityWebhookSchema } from "@/lib/schemas/sanity-webhook";
import { TAGS } from "@/lib/sanity";

// Prisma cannot run on Edge.
export const runtime = "nodejs";

/**
 * Sanity publish webhook.
 *
 * Mirrors STRUCTURE ONLY into Postgres — the ids and numbers the unlock engine
 * needs to enforce gating. Body copy, descriptions and question text stay in
 * Sanity and are never written here. Getting this wrong means two systems
 * disagree about what a course contains.
 */

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so guard first. Comparing
  // lengths is not itself a meaningful leak — the secret's length is fixed.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.SANITY_WEBHOOK_SECRET;
    if (!expected) {
      console.error("[api/webhooks/sanity] SANITY_WEBHOOK_SECRET is not set");
      return apiResponse(500, "Webhook not configured");
    }

    const provided =
      req.headers.get("x-sanity-webhook-secret") ??
      req.headers.get("authorization")?.replace(/^Bearer /i, "") ??
      null;

    if (!secretMatches(provided, expected)) {
      // Deliberately vague: a precise message tells a prober how close they are.
      return apiResponse(401, "Unauthorized");
    }

    const parsed = sanityWebhookSchema.safeParse(await req.json());
    if (!parsed.success) return apiResponse(400, "Invalid input");

    const doc = parsed.data;

    switch (doc._type) {
      case "course": {
        if (!doc.slug || !doc.title || doc.priceInPaise === undefined) {
          return apiResponse(400, "Invalid input");
        }
        await db.course.upsert({
          where: { sanityId: doc._id },
          create: {
            sanityId: doc._id,
            slug: doc.slug,
            title: doc.title,
            priceInPaise: doc.priceInPaise,
            isPublished: doc.isPublished ?? false,
            passThreshold: doc.passThreshold ?? 85,
          },
          update: {
            slug: doc.slug,
            title: doc.title,
            priceInPaise: doc.priceInPaise,
            isPublished: doc.isPublished ?? false,
            passThreshold: doc.passThreshold ?? 85,
          },
        });
        revalidateTag(TAGS.course, "max");
        break;
      }

      case "chapter": {
        if (!doc.title || doc.order === undefined || !doc.courseId) {
          return apiResponse(400, "Invalid input");
        }
        // The parent must already be mirrored. Sanity fires per-document, so a
        // brand-new course can arrive after its chapter; 409 tells the sender to
        // retry rather than silently dropping the chapter.
        const course = await db.course.findUnique({
          where: { sanityId: doc.courseId },
          select: { id: true },
        });
        if (!course) return apiResponse(409, "Parent course not synced yet");

        await db.chapter.upsert({
          where: { sanityId: doc._id },
          create: {
            sanityId: doc._id,
            courseId: course.id,
            order: doc.order,
            title: doc.title,
            passThreshold: doc.passThreshold ?? 80,
          },
          update: {
            courseId: course.id,
            order: doc.order,
            title: doc.title,
            passThreshold: doc.passThreshold ?? 80,
          },
        });
        revalidateTag(TAGS.course, "max");
        break;
      }

      case "module": {
        if (
          !doc.title ||
          doc.order === undefined ||
          !doc.chapterId ||
          doc.durationSeconds === undefined
        ) {
          return apiResponse(400, "Invalid input");
        }
        const chapter = await db.chapter.findUnique({
          where: { sanityId: doc.chapterId },
          select: { id: true },
        });
        if (!chapter) return apiResponse(409, "Parent chapter not synced yet");

        await db.module.upsert({
          where: { sanityId: doc._id },
          create: {
            sanityId: doc._id,
            chapterId: chapter.id,
            order: doc.order,
            title: doc.title,
            videoUid: doc.videoUid ?? "",
            durationSeconds: doc.durationSeconds,
            isFreePreview: doc.isFreePreview ?? false,
          },
          update: {
            chapterId: chapter.id,
            order: doc.order,
            title: doc.title,
            videoUid: doc.videoUid ?? "",
            durationSeconds: doc.durationSeconds,
            isFreePreview: doc.isFreePreview ?? false,
          },
        });
        revalidateTag(TAGS.course, "max");
        break;
      }

      default:
        return apiResponse(400, "Invalid input");
    }

    return apiResponse(200, "Synced", { id: doc._id, type: doc._type });
  } catch (err) {
    return apiError("webhooks/sanity", err);
  }
}
