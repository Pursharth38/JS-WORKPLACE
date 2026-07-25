// DEV B — P10-06. POST /api/admin/certificate/:certId/revoke — ADMIN only.
//
// Revocation is a status transition, never a delete (data-model.md: soft-delete
// anything auditable). The row survives so /verify/[certId] can answer "this
// was withdrawn" — which an employer holding a printout needs to hear —
// and so a corrected certificate can be re-issued (the partial unique index
// only spans revokedAt IS NULL).
import type { NextRequest } from 'next/server'

import { normalizeCertId } from '@/lib/cert-id'
import { db } from '@/lib/db'
import { apiError, apiResponse, invalidInput } from '@/lib/response'
import { revokeSchema } from '@/lib/schemas/certificate'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ certId: string }> },
) {
  try {
    const admin = await requireAdmin()
    if (!admin) return apiResponse(403, 'Forbidden')

    const { certId: raw } = await params
    const certId = normalizeCertId(raw)
    if (!certId) return apiResponse(404, 'Certificate not found')

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return invalidInput()
    }
    const parsed = revokeSchema.safeParse(body)
    if (!parsed.success) return invalidInput()

    // Guarded update: only an ACTIVE certificate can be revoked. Running it as
    // updateMany-with-condition makes a concurrent double-revoke a no-op count
    // instead of clobbering the first revocation's reason and timestamp.
    const updated = await db.certificate.updateMany({
      where: { certId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: parsed.data.reason },
    })

    if (updated.count === 0) {
      const exists = await db.certificate.findUnique({
        where: { certId },
        select: { revokedAt: true },
      })
      if (!exists) return apiResponse(404, 'Certificate not found')
      return apiResponse(409, 'Certificate is already revoked')
    }

    console.warn('[admin] certificate revoked', { certId, by: admin.userId })
    return apiResponse(200, 'Certificate revoked', { certId })
  } catch (err) {
    return apiError('admin/certificate-revoke', err)
  }
}
