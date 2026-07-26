'use client'

// CMS migration M1d — the client half of the image pipeline; plugs straight
// into RichTextEditor's onUploadImage prop and the cover-image fields.
//
// Returns the server's actual message on failure (not just a boolean) — "R2
// is not configured" and "file too large" call for different next actions,
// and collapsing them into one generic string sends the admin down the wrong
// troubleshooting path.
export type UploadResult = { ok: true; src: string } | { ok: false; message: string }

export async function uploadContentImage(file: File): Promise<UploadResult> {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const payload: { success: boolean; message: string; data: { src: string } | null } =
      await res.json()
    if (payload.success && payload.data) return { ok: true, src: payload.data.src }
    return { ok: false, message: payload.message || 'Upload failed. Please try again.' }
  } catch {
    return { ok: false, message: 'Upload failed — check your connection and try again.' }
  }
}
