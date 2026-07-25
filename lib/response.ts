// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  FILE OWNER: DEV A (task P1-06). Transcribed by DEV B from CONTRACTS.md
//     "UNIVERSAL ENVELOPE" to unblock offline work. On merge: take Dev A's
//     version if the exported signature matches; otherwise reconcile call sites.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'

export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T | null
}

/**
 * The ONLY way an API route may produce a response. Never bare NextResponse.json().
 *
 * `success` is derived from the status code so a caller cannot accidentally
 * return `success: true` alongside a 4xx.
 */
export function apiResponse<T>(
  status: number,
  message: string,
  data: T | null = null,
  init?: { headers?: Record<string, string> },
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json<ApiEnvelope<T>>(
    { success: status < 400, message, data },
    { status, headers: init?.headers },
  )
}

export type Paginated<T> = {
  items: T[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

/** Shape every list endpoint must return, per CONTRACTS.md "PAGINATION". */
export function paginated<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): Paginated<T> {
  return {
    items,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  }
}

/**
 * Terminal error handler for a route's catch block.
 *
 * Logs the real error server-side and returns a generic message. Never leak
 * `err.message` or a stack trace — both disclose schema and file structure.
 */
export function apiError(context: string, err: unknown): NextResponse<ApiEnvelope<never>> {
  console.error(`[api:${context}]`, err)
  return apiResponse<never>(500, 'Something went wrong. Please try again.')
}

/**
 * A Zod parse failure is always 400 with a fixed message. Returning the Zod
 * issue list leaks the schema shape to an attacker probing the endpoint.
 */
export function invalidInput(): NextResponse<ApiEnvelope<never>> {
  return apiResponse<never>(400, 'Invalid input')
}
