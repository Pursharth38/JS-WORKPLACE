// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-03. Certificate identifiers.
//
// Format: JSWW-{year}-{6 chars}   e.g. JSWW-2026-A7K2P9
//
// Kept in its own module with no database or React imports so the unit tests
// can exercise it directly, and so nothing heavy is pulled in when only the
// parser is needed.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto'

/**
 * Crockford's base32 alphabet: no I, L, O or U.
 *
 * I/L/1 and O/0 are the pairs people misread off a printed certificate, and U
 * is excluded so the generator cannot accidentally spell something unfortunate.
 * 32^6 ≈ 1.07 billion combinations.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const SUFFIX_LENGTH = 6

export const CERT_ID_PATTERN = /^JSWW-(\d{4})-([0-9ABCDEFGHJKMNPQRSTVWXYZ]{6})$/

/**
 * Generates a candidate certificate id.
 *
 * ★ NON-SEQUENTIAL AND NON-GUESSABLE BY CONSTRUCTION. ★
 * A sequential id (JSWW-2026-000001) would let anyone enumerate every
 * certificate ever issued through the public verification endpoint, and would
 * publish exactly how many people have taken the course.
 *
 * `crypto.randomInt` is used rather than `randomBytes[i] % 32`. The modulo
 * version is biased: 256 is not a multiple of 32 for every alphabet size, and
 * for non-power-of-two alphabets the low indices come up measurably more often.
 * `randomInt` does rejection sampling internally and is uniform.
 */
export function generateCertId(year: number = new Date().getFullYear()): string {
  let suffix = ''
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    suffix += ALPHABET[crypto.randomInt(0, ALPHABET.length)]
  }
  return `JSWW-${year}-${suffix}`
}

/**
 * Normalizes an id a human typed off a printed certificate.
 *
 * Applies Crockford's decoding rules — O reads as 0, I and L read as 1 — and
 * tolerates lowercase, stray whitespace, and missing or extra hyphens. Someone
 * verifying a candidate's credential is reading characters off paper; making
 * them get the ambiguous glyphs exactly right is a self-inflicted support
 * ticket.
 *
 * Returns null when the input cannot be a certificate id at all, so the caller
 * can skip the database round-trip.
 */
export function normalizeCertId(input: string): string | null {
  if (typeof input !== 'string') return null

  const cleaned = input
    .toUpperCase()
    .replace(/[\s\-_]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')

  // "JSWW" + 4-digit year + 6-char suffix
  const m = /^JSWW(\d{4})([0-9ABCDEFGHJKMNPQRSTVWXYZ]{6})$/.exec(cleaned)
  if (!m) return null

  return `JSWW-${m[1]}-${m[2]}`
}

/** Deterministic R2 object key for a certificate PDF. */
export function certificateObjectKey(certId: string): string {
  return `certificates/${certId}.pdf`
}
