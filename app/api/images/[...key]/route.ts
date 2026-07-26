// CMS migration M1d — GET /api/images/<key>. PUBLIC.
//
// Streams content images out of the private R2 bucket.
//
// ★ THE PREFIX CHECK IS A SECURITY BOUNDARY. The same bucket holds
//   certificates/ and invoices/ — personal documents served only through
//   authenticated routes. This public route refuses everything outside
//   content/, so a crafted key like /api/images/certificates/JSWW-....pdf
//   is a 404 by construction, not by luck.
import type { NextRequest } from 'next/server'

import { CONTENT_IMAGE_PREFIX, CONTENT_TYPE_BY_EXT } from '@/lib/images'
import { getObject, isR2Configured } from '@/lib/r2'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params
  const key = segments.map(decodeURIComponent).join('/')

  // Refuse traversal and anything outside the public prefix.
  if (
    !key.startsWith(CONTENT_IMAGE_PREFIX) ||
    key.includes('..') ||
    key.includes('//') ||
    key.length > 300
  ) {
    return new Response('Not found', { status: 404 })
  }

  const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase()
  const contentType = CONTENT_TYPE_BY_EXT[ext]
  if (!contentType) return new Response('Not found', { status: 404 })

  if (!isR2Configured()) return new Response('Not found', { status: 404 })

  const body = await getObject(key)
  if (!body) return new Response('Not found', { status: 404 })

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Keys carry a random component and are never overwritten, so immutable
      // is safe — a changed image is a new key.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
