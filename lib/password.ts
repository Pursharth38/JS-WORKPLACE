// DEV B — password hashing and token minting.
// NODE RUNTIME ONLY. bcryptjs must never be pulled into edge middleware.
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

/**
 * Verifies a password. Callers MUST use `verifyPasswordConstantTime` on the
 * login path instead — a plain early return when `hash` is null leaks, by
 * response timing, whether an account exists.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/**
 * A valid bcrypt hash of a value nobody knows. Used to burn the same ~250ms of
 * CPU when the account does not exist or is OAuth-only, so an attacker cannot
 * enumerate registered emails by timing the login endpoint.
 */
const DUMMY_HASH = '$2a$12$DpPdoHbKurSheTj8ydSQVeJtPgXc2pSbbjo58LQgrxOzIbsj1GuXO'

export async function verifyPasswordConstantTime(
  plain: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(plain, DUMMY_HASH)
    return false
  }
  return bcrypt.compare(plain, hash)
}

/**
 * A single-use token for an email link. 32 random bytes, base64url — 256 bits of
 * entropy, so it cannot be guessed or brute-forced through the endpoint.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Only the hash is stored. A leaked database backup must not hand the attacker
 * a set of live password-reset links.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
