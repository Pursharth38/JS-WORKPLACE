// DEV B — codebase.md lists tests/unit/certId.test.ts as a Dev B deliverable.
//
// A certificate id is the only thing standing between a stranger and someone
// else's credential record on the public verification endpoint, so "random" has
// to mean random.
import { describe, expect, it } from 'vitest'

import { CERT_ID_PATTERN, certificateObjectKey, generateCertId, normalizeCertId } from '@/lib/cert-id'

describe('generateCertId', () => {
  it('matches the documented JSWW-{year}-{6} format', () => {
    expect(generateCertId(2026)).toMatch(CERT_ID_PATTERN)
  })

  it('uses the year it is given', () => {
    expect(generateCertId(2027).startsWith('JSWW-2027-')).toBe(true)
  })

  it('defaults to the current year', () => {
    const year = new Date().getFullYear()
    expect(generateCertId().startsWith(`JSWW-${year}-`)).toBe(true)
  })

  it('never emits the ambiguous glyphs I, L, O or U', () => {
    // These are excluded so a printed id can be typed back correctly.
    for (let i = 0; i < 2000; i += 1) {
      const suffix = generateCertId(2026).split('-')[2] ?? ''
      expect(suffix).not.toMatch(/[ILOU]/)
    }
  })

  it('★ is NOT sequential — 5,000 ids collide fewer than 5 times', () => {
    // Birthday bound over 32^6 ≈ 1.07e9: expected collisions among 5,000 draws
    // is ~0.012. Anything near 5 means the generator is not uniform, and a
    // predictable id makes the public verify endpoint enumerable.
    const ids = new Set<string>()
    for (let i = 0; i < 5000; i += 1) ids.add(generateCertId(2026))
    expect(5000 - ids.size).toBeLessThan(5)
  })

  it('★ has no positional bias — every alphabet symbol appears at every index', () => {
    // A `randomBytes[i] % 32` implementation passes the uniqueness test above
    // but skews toward low indices. Sampling per position catches that.
    const positions: Set<string>[] = Array.from({ length: 6 }, () => new Set<string>())
    for (let i = 0; i < 6000; i += 1) {
      const suffix = generateCertId(2026).split('-')[2] ?? ''
      for (let p = 0; p < 6; p += 1) positions[p]?.add(suffix[p] ?? '')
    }
    // With 6,000 draws, seeing fewer than 30 of the 32 symbols at any position
    // would indicate real skew.
    for (const seen of positions) expect(seen.size).toBeGreaterThanOrEqual(30)
  })
})

describe('normalizeCertId', () => {
  it('passes a well-formed id through unchanged', () => {
    expect(normalizeCertId('JSWW-2026-A7K2P9')).toBe('JSWW-2026-A7K2P9')
  })

  it('accepts lowercase', () => {
    expect(normalizeCertId('jsww-2026-a7k2p9')).toBe('JSWW-2026-A7K2P9')
  })

  it('accepts an id with the hyphens missing', () => {
    expect(normalizeCertId('JSWW2026A7K2P9')).toBe('JSWW-2026-A7K2P9')
  })

  it('tolerates surrounding and internal whitespace', () => {
    expect(normalizeCertId('  JSWW 2026 A7K2P9  ')).toBe('JSWW-2026-A7K2P9')
  })

  it('applies Crockford decoding: O reads as zero', () => {
    expect(normalizeCertId('JSWW-2026-AOK2P9')).toBe('JSWW-2026-A0K2P9')
  })

  it('applies Crockford decoding: I and L read as one', () => {
    expect(normalizeCertId('JSWW-2026-AIK2P9')).toBe('JSWW-2026-A1K2P9')
    expect(normalizeCertId('JSWW-2026-ALK2P9')).toBe('JSWW-2026-A1K2P9')
  })

  it('round-trips anything the generator produces', () => {
    for (let i = 0; i < 500; i += 1) {
      const id = generateCertId(2026)
      expect(normalizeCertId(id)).toBe(id)
    }
  })

  it('rejects input that cannot be a certificate id', () => {
    expect(normalizeCertId('')).toBeNull()
    expect(normalizeCertId('hello')).toBeNull()
    expect(normalizeCertId('JSWW-2026-A7K2P')).toBeNull() // too short
    expect(normalizeCertId('JSWW-2026-A7K2P99')).toBeNull() // too long
    expect(normalizeCertId('ABCD-2026-A7K2P9')).toBeNull() // wrong prefix
    expect(normalizeCertId("JSWW-2026-A7K2P9' OR 1=1--")).toBeNull()
  })
})

describe('certificateObjectKey', () => {
  it('derives the storage key from the id alone', () => {
    // Deterministic, so a certificate whose upload failed can be regenerated
    // and re-stored at the same key without a database migration.
    expect(certificateObjectKey('JSWW-2026-A7K2P9')).toBe('certificates/JSWW-2026-A7K2P9.pdf')
  })
})
