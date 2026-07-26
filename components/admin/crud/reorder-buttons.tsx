'use client'

// CMS migration M1e — ↑/↓ reordering, used on ~6 list screens.
//
// Buttons over drag-and-drop, deliberately: keyboard-accessible for free,
// zero library weight, and a swap of two `order` values server-side cannot
// corrupt an ordering the way an interrupted drag reindex can. The bound
// server action swaps orders and revalidates; the router refresh re-renders
// the list.
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ReorderButtons({
  id,
  isFirst,
  isLast,
  action,
}: {
  id: string
  isFirst: boolean
  isLast: boolean
  /** Server action: move the row one step in `direction`. */
  action: (id: string, direction: 'up' | 'down') => Promise<void>
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const move = async (direction: 'up' | 'down') => {
    setBusy(true)
    try {
      await action(id, direction)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const btn =
    'rounded border border-[var(--brand-line)] px-2 py-0.5 text-[13px] text-[var(--brand-muted)] hover:bg-[var(--brand-line)] disabled:opacity-30 disabled:cursor-not-allowed'

  return (
    <span className="inline-flex gap-1">
      <button
        type="button"
        aria-label="Move up"
        disabled={isFirst || busy}
        onClick={() => move('up')}
        className={btn}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={isLast || busy}
        onClick={() => move('down')}
        className={btn}
      >
        ↓
      </button>
    </span>
  )
}
