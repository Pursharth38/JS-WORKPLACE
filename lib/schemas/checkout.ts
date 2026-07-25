// DEV B — Zod schema for the checkout boundary.
import { z } from 'zod'

/**
 * ★ NOTE WHAT IS ABSENT: there is no `amount`, no `price`, no `currency`. ★
 *
 * The request body carries a courseId and nothing else. The price is read from
 * `Course.priceInPaise` inside the handler. If a future change adds an amount
 * field here, the most common payment bug in Indian e-learning builds walks
 * straight back in: a client posts `amount: 100` for a ₹4,999 course and pays
 * one rupee.
 */
export const createOrderSchema = z.object({
  courseId: z.string().min(1).max(60),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
