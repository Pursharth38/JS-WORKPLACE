// DEV B — Zod schemas for the certificate boundary.
import { z } from 'zod'

export const issueSchema = z.object({
  courseId: z.string().min(1).max(60),
})

export const revokeSchema = z.object({
  reason: z.string().trim().min(3, 'Give a reason').max(500),
})

export type IssueInput = z.infer<typeof issueSchema>
