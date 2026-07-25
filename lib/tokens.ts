// ─────────────────────────────────────────────────────────────────────────────
// DEV B — single-use email tokens for verification and password reset.
//
// Invariants that hold for both token families:
//   · The raw token exists only in the email. The database stores sha256(token).
//     A leaked backup therefore hands an attacker nothing usable.
//   · Lookup is by hash, so it is an indexed equality match — no scan, and no
//     opportunity for a timing side channel on the token value.
//   · Consumption is atomic. A token is invalidated in the same statement that
//     claims it, so two concurrent requests cannot both succeed.
// NODE RUNTIME ONLY.
// ─────────────────────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { generateToken, hashToken } from '@/lib/password'

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000 // 24h — user may not check mail today
const RESET_TTL_MS = 60 * 60 * 1000 // 1h — a live reset link is an account takeover

// ── Email verification ──────────────────────────────────────────────────────
// Reuses Auth.js's VerificationToken table. `identifier` is the email,
// `token` holds the HASH (the column is unique, which is what we want).

export async function issueEmailVerificationToken(email: string): Promise<string> {
  const raw = generateToken()

  // Supersede any outstanding token for this address. If a learner clicks
  // "resend", the older link must stop working — otherwise every resend leaves
  // another live credential in an inbox.
  await db.verificationToken.deleteMany({ where: { identifier: email } })

  await db.verificationToken.create({
    data: {
      identifier: email,
      token: hashToken(raw),
      expires: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  })

  return raw
}

/**
 * Verifies and consumes a token, marking the user's email verified.
 * Returns the email on success, null on an unknown, expired, or already-used
 * token — the caller must not distinguish these to the user.
 */
export async function consumeEmailVerificationToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken)

  const record = await db.verificationToken.findUnique({ where: { token: tokenHash } })
  if (!record) return null

  // Delete first, then act. If the token is expired we still delete it — an
  // expired token has no further legitimate use and leaving it behind lets an
  // attacker keep probing the same value.
  await db.verificationToken.deleteMany({ where: { token: tokenHash } })
  if (record.expires < new Date()) return null

  // `updateMany` rather than `update`: the account may have been deleted
  // between the email being sent and the link being clicked, and that should be
  // a quiet no-op rather than a 500.
  await db.user.updateMany({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })

  return record.identifier
}

// ── Password reset ──────────────────────────────────────────────────────────

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const raw = generateToken()

  // Invalidate outstanding resets for this user for the same reason as above.
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })

  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expires: new Date(Date.now() + RESET_TTL_MS),
    },
  })

  return raw
}

/**
 * Claims a reset token atomically and returns the userId it belongs to.
 *
 * The claim is an `updateMany` guarded on `usedAt: null`, and Postgres reports
 * how many rows it actually changed. If two requests race, exactly one sees
 * `count === 1`. A read-then-write would let both through and allow a password
 * to be set twice from one emailed link.
 */
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken)

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!record) return null
  if (record.usedAt !== null) return null
  if (record.expires < new Date()) return null

  const claimed = await db.passwordResetToken.updateMany({
    where: { tokenHash, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (claimed.count !== 1) return null

  return record.userId
}
