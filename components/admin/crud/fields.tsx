'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M1e — form fields shared by every admin content screen.
//
// These are ADMIN-side conveniences; nothing here validates anything for real.
// Every value they emit is re-parsed by a Zod schema inside the Server Action.
// ─────────────────────────────────────────────────────────────────────────────
import { useId, useState } from 'react'

const labelCls = 'mb-1.5 block text-[14px] font-medium text-[var(--brand-ink)]'
const inputCls =
  'w-full rounded-[var(--radius-sm)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-3 py-2 text-[15px] text-[var(--brand-ink)] outline-none transition-colors focus:border-[var(--brand-primary)]'
const hintCls = 'mt-1 text-[13px] leading-relaxed text-[var(--brand-muted)]'

export function TextField({
  label,
  name,
  defaultValue,
  required,
  hint,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string | null
  required?: boolean
  hint?: string
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls}>
        {label}
        {!required && <span className="ml-1.5 font-normal text-[var(--brand-muted)]">optional</span>}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputCls}
      />
      {hint && (
        <p id={`${id}-hint`} className={hintCls}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  required,
  hint,
  rows = 3,
}: {
  label: string
  name: string
  defaultValue?: string | null
  required?: boolean
  hint?: string
  rows?: number
}) {
  const id = useId()
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls}>
        {label}
        {!required && <span className="ml-1.5 font-normal text-[var(--brand-muted)]">optional</span>}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        rows={rows}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputCls}
      />
      {hint && (
        <p id={`${id}-hint`} className={hintCls}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function NumberField({
  label,
  name,
  defaultValue,
  required,
  hint,
  min,
  step,
}: {
  label: string
  name: string
  defaultValue?: number | null
  required?: boolean
  hint?: string
  min?: number
  step?: number
}) {
  const id = useId()
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls}>
        {label}
        {!required && <span className="ml-1.5 font-normal text-[var(--brand-muted)]">optional</span>}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        defaultValue={defaultValue ?? undefined}
        required={required}
        min={min}
        step={step}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputCls}
      />
      {hint && (
        <p id={`${id}-hint`} className={hintCls}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  required,
  hint,
}: {
  label: React.ReactNode
  name: string
  defaultChecked?: boolean
  required?: boolean
  hint?: string
}) {
  const id = useId()
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        required={required}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div>
        <label htmlFor={id} className="text-[14px] font-medium leading-snug">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className={hintCls}>
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

/**
 * Slug/anchor input with generate-from-title. When `locked`, editing requires
 * an explicit unlock click and shows the caller's warning — used for POSH Hub
 * anchors, which are permanent public deep links.
 */
export function SlugField({
  label = 'Slug',
  name,
  defaultValue,
  sourceValue,
  locked,
  lockWarning,
  hint,
  confirmName,
}: {
  label?: string
  name: string
  defaultValue?: string | null
  /** Current title text to generate from (pass state or a ref value). */
  sourceValue?: () => string
  locked?: boolean
  lockWarning?: string
  hint?: string
  /**
   * When set, unlocking a locked field also submits this hidden checkbox-style
   * flag ("on") — the server action's backstop that the change was deliberate.
   */
  confirmName?: string
}) {
  const id = useId()
  const [value, setValue] = useState(defaultValue ?? '')
  const [unlocked, setUnlocked] = useState(!locked)

  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {confirmName && locked && unlocked && (
        <input type="hidden" name={confirmName} value="on" />
      )}
      <div className="flex gap-2">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(slugify(e.target.value))}
          readOnly={!unlocked}
          required
          aria-describedby={`${id}-hint`}
          className={`${inputCls} ${!unlocked ? 'bg-[var(--brand-surface)] text-[var(--brand-muted)]' : ''}`}
        />
        {unlocked ? (
          sourceValue && (
            <button
              type="button"
              onClick={() => setValue(slugify(sourceValue()))}
              className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--brand-line)] px-3 text-[13px] text-[var(--brand-muted)] hover:bg-[var(--brand-line)]"
            >
              Generate
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => setUnlocked(true)}
            className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--brand-warning)] px-3 text-[13px] text-[var(--brand-warning)] hover:bg-[var(--brand-warning-soft)]"
          >
            Unlock
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className={hintCls}>
        {!unlocked && lockWarning ? lockWarning : hint}
      </p>
    </div>
  )
}

/**
 * One-entry-per-line editor for String[] columns. The Server Action splits on
 * newlines — simple, visible, and paste-friendly for a non-technical owner.
 */
export function StringListField({
  label,
  name,
  defaultValue,
  hint,
  rows = 4,
}: {
  label: string
  name: string
  defaultValue?: string[]
  hint?: string
  rows?: number
}) {
  const id = useId()
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls}>
        {label}
        <span className="ml-1.5 font-normal text-[var(--brand-muted)]">one per line</span>
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={(defaultValue ?? []).join('\n')}
        rows={rows}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputCls}
      />
      {hint && (
        <p id={`${id}-hint`} className={hintCls}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string | null
  options: { value: string; label: string }[]
  hint?: string
}) {
  const id = useId()
  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${id}-hint`} className={hintCls}>
          {hint}
        </p>
      )}
    </div>
  )
}
