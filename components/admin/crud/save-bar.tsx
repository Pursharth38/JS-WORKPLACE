'use client'

// CMS migration M1e — save/delete bar every content form ends with.
//
// Delete requires an explicit second click within the same visit ("Delete" →
// "Really delete?") rather than a browser confirm() dialog, which blocks
// automation and reads poorly with screen readers.
import { useState } from 'react'
import { useFormStatus } from 'react-dom'

import type { CrudState } from './types'

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

export function CrudAlert({ state }: { state: CrudState }) {
  if (state.status === 'idle') return null
  const isError = state.status === 'error'
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-[14px] leading-relaxed"
      style={{
        borderColor: isError ? 'var(--brand-danger)' : 'var(--brand-success)',
        color: isError ? 'var(--brand-danger)' : 'var(--brand-success)',
        background: isError ? 'var(--brand-danger-soft)' : 'var(--brand-success-soft)',
      }}
    >
      {state.message}
    </div>
  )
}

export function SaveBar({
  state,
  saveLabel = 'Save',
  onDelete,
  deleteLabel = 'Delete',
}: {
  state: CrudState
  saveLabel?: string
  /** Bound server action for deletion; omit to hide the delete button. */
  onDelete?: () => Promise<void>
  deleteLabel?: string
}) {
  const [arming, setArming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="mt-2 border-t border-[var(--brand-line)] pt-4">
      <CrudAlert state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <SaveButton label={saveLabel} />

        {onDelete &&
          (arming ? (
            <>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await onDelete()
                  } finally {
                    setDeleting(false)
                    setArming(false)
                  }
                }}
                className="rounded-[var(--radius-sm)] bg-[var(--brand-danger)] px-4 py-2.5 text-[15px] font-semibold text-[var(--brand-danger-on)] disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : `Really ${deleteLabel.toLowerCase()}?`}
              </button>
              <button
                type="button"
                onClick={() => setArming(false)}
                className="px-2 py-2 text-[14px] text-[var(--brand-muted)] hover:underline"
              >
                Keep it
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setArming(true)}
              className="ml-auto rounded-[var(--radius-sm)] border border-[var(--brand-danger)] px-4 py-2.5 text-[15px] font-medium text-[var(--brand-danger)] hover:bg-[var(--brand-danger-soft)]"
            >
              {deleteLabel}
            </button>
          ))}
      </div>
    </div>
  )
}
