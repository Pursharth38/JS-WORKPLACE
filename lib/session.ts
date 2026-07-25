// ─────────────────────────────────────────────────────────────────────────────
// DEV B — ★ H3 CONTRACT, published to Dev C at end of Week 2. ★
//
// CONTRACTS.md:
//   getSession():     Promise<{ userId: string; role: 'LEARNER'|'ADMIN' } | null>
//   requireSession(): Promise<{ userId: string; role: 'LEARNER'|'ADMIN' } | null>
//
// Do not change these signatures without telling Dev C — every gated route in
// the learning engine calls them.
// ─────────────────────────────────────────────────────────────────────────────
import type { Role } from '@prisma/client'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export type SessionUser = {
  userId: string
  role: Role
}

/**
 * The signed-in user, or null. Reads the JWT — no database round-trip.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null
  return { userId, role: session.user.role ?? 'LEARNER' }
}

/**
 * Identical to `getSession()`. It exists as a separate name because that is the
 * published contract and because it marks intent at the call site: a route
 * calling `requireSession()` is declaring that null means 401.
 *
 * It deliberately does NOT throw or redirect — a route handler must be free to
 * return its own `apiResponse(401, ...)` envelope rather than have Auth.js emit
 * a bare redirect into a JSON client.
 */
export async function requireSession(): Promise<SessionUser | null> {
  return getSession()
}

/**
 * Admin authorization. Unlike `getSession()`, this re-reads the role from the
 * database rather than trusting the JWT.
 *
 * The JWT is minted at sign-in and lives for 30 days. If an admin is demoted,
 * their token still says ADMIN until it expires. For learner routes that
 * staleness is harmless; for the routes that expose every learner's payment
 * history and can revoke certificates, it is not. Admin traffic is a handful of
 * requests a day, so the extra query costs nothing.
 */
export async function requireAdmin(): Promise<{ userId: string; role: 'ADMIN' } | null> {
  const session = await getSession()
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN') return null

  return { userId: session.userId, role: 'ADMIN' }
}
