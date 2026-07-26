'use client'

// CMS migration M2 — cover/grid image picker for admin forms.
// Uploads through /api/admin/upload and stores the R2 KEY in a hidden input
// (the database stores keys, never URLs — lib/images.ts derives the URL).
import { useId, useState } from 'react'

export function ImageField({
  label,
  name,
  defaultKey,
  required,
  hint,
}: {
  label: string
  name: string
  defaultKey?: string | null
  required?: boolean
  hint?: string
}) {
  const id = useId()
  const [key, setKey] = useState(defaultKey ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const payload: { success: boolean; message: string; data: { key: string } | null } =
        await res.json()
      if (payload.success && payload.data) {
        setKey(payload.data.key)
      } else {
        // Surface the server's actual reason (wrong type, too large, storage
        // unconfigured) instead of a one-size-fits-all guess — "R2 env vars
        // missing" and "use JPEG/PNG/WebP/GIF" need different next actions.
        setError(payload.message || 'Upload failed. Please try again.')
      }
    } catch {
      setError('Upload failed — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[14px] font-medium">
        {label}
        {!required && <span className="ml-1.5 font-normal text-[var(--brand-muted)]">optional</span>}
      </p>

      <input type="hidden" name={name} value={key} />

      <div className="flex items-start gap-4">
        {key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${key}`}
            alt=""
            className="h-24 w-24 rounded-[var(--radius-sm)] border border-[var(--brand-line)] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--brand-line)] text-[12px] text-[var(--brand-muted)]">
            No image
          </div>
        )}

        <div>
          <label
            htmlFor={id}
            className="inline-block cursor-pointer rounded-[var(--radius-sm)] border border-[var(--brand-line)] px-3 py-2 text-[14px] font-medium hover:bg-[var(--brand-line)]"
          >
            {busy ? 'Uploading…' : key ? 'Replace image' : 'Upload image'}
          </label>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={upload}
            disabled={busy}
            className="sr-only"
          />
          {key && (
            <button
              type="button"
              onClick={() => setKey('')}
              className="ml-2 text-[13px] text-[var(--brand-muted)] hover:underline"
            >
              Remove
            </button>
          )}
          {hint && <p className="mt-1.5 text-[13px] text-[var(--brand-muted)]">{hint}</p>}
          {error && (
            <p role="alert" className="mt-1.5 text-[13px] text-[var(--brand-danger)]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
