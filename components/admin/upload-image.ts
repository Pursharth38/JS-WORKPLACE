'use client'

// CMS migration M1d — the client half of the image pipeline; plugs straight
// into RichTextEditor's onUploadImage prop and the cover-image fields.
export async function uploadContentImage(file: File): Promise<string | null> {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const payload: { success: boolean; data: { src: string } | null } = await res.json()
    return payload.success && payload.data ? payload.data.src : null
  } catch {
    return null
  }
}
