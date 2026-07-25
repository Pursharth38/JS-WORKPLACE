import { z } from "zod";

/**
 * Shape of the payload Sanity POSTs on publish. Configured in the Sanity
 * dashboard as a GROQ-projected webhook so we receive the resolved structural
 * fields rather than raw references.
 *
 * Projection to configure in Sanity:
 *   {
 *     _id, _type, _rev,
 *     "slug": slug.current,
 *     title, order, priceInPaise, isPublished, passThreshold,
 *     videoUid, durationSeconds, isFreePreview,
 *     "courseId": course._ref,
 *     "chapterId": chapter._ref
 *   }
 */
export const sanityWebhookSchema = z.object({
  _id: z.string().min(1),
  _type: z.enum(["course", "chapter", "module"]),

  slug: z.string().optional(),
  title: z.string().optional(),
  order: z.number().int().optional(),

  // course
  priceInPaise: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
  passThreshold: z.number().int().min(1).max(100).optional(),

  // module
  videoUid: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  isFreePreview: z.boolean().optional(),

  // parent references
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
});

export type SanityWebhookPayload = z.infer<typeof sanityWebhookSchema>;
