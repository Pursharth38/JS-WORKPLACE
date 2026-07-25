'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DEV B — form primitives for the auth pages ONLY.
//
// These deliberately live under components/auth/ rather than components/ui/,
// which is Dev A's territory (task P1-04). Keeping them separate means this
// branch cannot collide with Dev A's primitives on merge. Once Dev A's
// components/ui/{input,checkbox,button} land, these should be replaced with
// them — see MERGE-NOTES.md.
//
// Colour comes only from the --brand-* CSS custom properties so Dev A's real
// token file can replace app/globals.css without touching these components.
// ─────────────────────────────────────────────────────────────────────────────

import { useId } from 'react'
import { useFormStatus } from 'react-dom'

export function Field({
  label,
  name,
  type = 'text',
  required = false,
  autoComplete,
  defaultValue,
  hint,
  placeholder,
  inputMode,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  defaultValue?: string
  hint?: string
  placeholder?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-medium">
        {label}
        {!required && <span className="ml-1.5 text-[13px] text-[var(--brand-muted)]">optional</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-describedby={hintId}
        className="w-full rounded-md border border-[var(--brand-line)] bg-white px-3 py-2.5 text-[16px] text-[var(--brand-ink)] outline-none transition-colors focus:border-[var(--brand-teal)]"
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] leading-relaxed text-[var(--brand-muted)]">
          {hint}
        </p>
      )}
    </div>
  )
}

export function ConsentCheckbox({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <div className="mb-5 flex items-start gap-2.5">
      {/*
        DPDP Act: this box MUST render unticked. Never add `defaultChecked`.
        A pre-ticked consent box is not consent.
      */}
      <input
        id={id}
        name={name}
        type="checkbox"
        required
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-teal)]"
      />
      <label htmlFor={id} className="text-[14px] leading-relaxed text-[var(--brand-muted)]">
        {children}
      </label>
    </div>
  )
}

/** Invisible to humans, irresistible to bots. Paired with the `website` field in signupSchema. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website">Leave this field empty</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-[var(--brand-teal)] px-4 py-3 text-[17px] font-semibold text-white transition-colors hover:bg-[var(--brand-teal-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Please wait…' : children}
    </button>
  )
}

/**
 * `role="status"` + `aria-live="polite"` so a screen reader announces the
 * result of a Server Action, which produces no navigation to announce.
 */
export function FormAlert({ state }: { state: { status: string; message?: string } }) {
  if (state.status === 'idle' || !state.message) return null
  const isError = state.status === 'error'

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 rounded-md border px-3.5 py-3 text-[15px] leading-relaxed"
      style={{
        borderColor: isError ? 'var(--brand-danger)' : 'var(--brand-success)',
        color: isError ? 'var(--brand-danger)' : 'var(--brand-success)',
        background: isError ? '#fdf3f1' : '#f1f8f4',
      }}
    >
      {state.message}
    </div>
  )
}
