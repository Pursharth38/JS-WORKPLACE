// DEV B — shared pagination parsing for the admin list endpoints.
import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export function parsePagination(url: URL): { page: number; limit: number; skip: number } {
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })
  // Bad query params fall back to defaults rather than 400 — an admin fiddling
  // with the URL should get page 1, not an error envelope.
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 }
  return { page, limit, skip: (page - 1) * limit }
}
