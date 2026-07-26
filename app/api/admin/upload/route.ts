// CMS migration M1d — POST /api/admin/upload. ADMIN only.
//
// Accepts one image file (multipart), sniffs its real type from magic bytes
// (the claimed MIME and filename are never trusted), stores it in R2 under the
// content/ prefix, and returns { key, src }. SVG is deliberately unsupported:
// it is scriptable markup, and this endpoint's output goes straight into
// public pages.
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

import { CONTENT_IMAGE_PREFIX, imageSrc, sniffImage } from '@/lib/images'
import { isR2Configured, putObject } from '@/lib/r2'
import { apiError, apiResponse } from '@/lib/response'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB — marketing images, not originals

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return apiResponse(403, 'Forbidden')

    if (!isR2Configured()) {
      return apiResponse(503, 'Image storage is not configured (R2 env vars missing)')
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return apiResponse(400, 'Invalid input')
    }

    const file = form.get('file')
    if (!(file instanceof File)) return apiResponse(400, 'Invalid input')
    if (file.size === 0) return apiResponse(400, 'Empty file')
    if (file.size > MAX_BYTES) {
      return apiResponse(413, 'Image is too large — keep it under 5 MB')
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const sniffed = sniffImage(bytes)
    if (!sniffed) {
      return apiResponse(415, 'Unsupported image type — use JPEG, PNG, WebP or GIF')
    }

    // Content-addressed-ish key: date bucket + random. Random suffix means the
    // serving route can cache immutably — a re-upload is a new key, never an
    // overwrite.
    const stamp = new Date().toISOString().slice(0, 7) // yyyy-mm
    const key = `${CONTENT_IMAGE_PREFIX}${stamp}/${crypto.randomBytes(8).toString('hex')}.${sniffed.ext}`

    await putObject({ key, body: Buffer.from(bytes), contentType: sniffed.contentType })

    return apiResponse(200, 'Uploaded', { key, src: imageSrc(key) })
  } catch (err) {
    return apiError('admin/upload', err)
  }
}
