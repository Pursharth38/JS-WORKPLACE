import { z } from "zod";

import { QUESTIONS } from "@/lib/compliance-check";

const answerSchema = z.enum(["yes", "no", "unsure"]);

/**
 * Answers are validated against the known question ids rather than accepted as
 * an open record, so a caller cannot stuff the payload with arbitrary keys that
 * end up in a report email.
 */
export const complianceCheckSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().max(200).optional().or(z.literal("")),

  answers: z
    .record(z.string(), answerSchema)
    .refine(
      (a) => QUESTIONS.every((q) => a[q.id] !== undefined),
      "Please answer every question.",
    ),

  consentGiven: z.coerce.boolean(),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().optional(),
});

export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>;
