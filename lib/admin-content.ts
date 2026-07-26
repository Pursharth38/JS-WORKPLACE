// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M1e — shared server-side helpers for the admin content actions.
// NODE RUNTIME. Imported only by Server Actions under app/admin/**.
// ─────────────────────────────────────────────────────────────────────────────

/** FormData string, trimmed; '' → null. */
export function optStr(fd: FormData, name: string): string | null {
  const v = fd.get(name)
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

/** FormData string, trimmed, required at the parse layer (Zod re-checks). */
export function reqStr(fd: FormData, name: string): string {
  const v = fd.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

/** StringListField textarea → clean string[]. */
export function lines(fd: FormData, name: string): string[] {
  const v = fd.get(name)
  if (typeof v !== 'string') return []
  return v
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
}

export function checkbox(fd: FormData, name: string): boolean {
  const v = fd.get(name)
  return v === 'on' || v === 'true'
}

export function intOr(fd: FormData, name: string, fallback: number): number {
  const v = fd.get(name)
  if (typeof v !== 'string') return fallback
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

/** Editor hidden-input JSON → parsed object (caller runs parseRichText). */
export function jsonField(fd: FormData, name: string): unknown {
  const v = fd.get(name)
  if (typeof v !== 'string' || v === '') return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

/**
 * The reorder algorithm behind every ReorderButtons action: given the ordered
 * rows, find the neighbour in `direction` and return the two order-value swaps
 * to write (in one transaction). Null when already at the edge — a no-op, not
 * an error, since two admins racing is survivable.
 */
export function computeSwap(
  rows: { id: string; order: number }[],
  id: string,
  direction: 'up' | 'down',
): { a: { id: string; order: number }; b: { id: string; order: number } } | null {
  const sorted = [...rows].sort((x, y) => x.order - y.order)
  const idx = sorted.findIndex((r) => r.id === id)
  if (idx === -1) return null
  const other = direction === 'up' ? idx - 1 : idx + 1
  if (other < 0 || other >= sorted.length) return null
  const a = sorted[idx]!
  const b = sorted[other]!
  return { a: { id: a.id, order: b.order }, b: { id: b.id, order: a.order } }
}
