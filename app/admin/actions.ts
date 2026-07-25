'use server'

// DEV B — admin server actions. Every action re-checks ADMIN from the database.
import { revalidatePath } from 'next/cache'

import { normalizeCertId } from '@/lib/cert-id'
import { db } from '@/lib/db'
import { revokeSchema } from '@/lib/schemas/certificate'
import { requireAdmin } from '@/lib/session'

export type AdminActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

export async function revokeCertificateAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin()
  if (!admin) return { status: 'error', message: 'Not authorised.' }

  const certId = normalizeCertId(String(formData.get('certId') ?? ''))
  const parsed = revokeSchema.safeParse({ reason: formData.get('reason') })
  if (!certId) return { status: 'error', message: 'That certificate ID is not valid.' }
  if (!parsed.success) return { status: 'error', message: 'Give a short reason (3–500 characters).' }

  try {
    const updated = await db.certificate.updateMany({
      where: { certId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: parsed.data.reason },
    })

    if (updated.count === 0) {
      const exists = await db.certificate.findUnique({
        where: { certId },
        select: { revokedAt: true },
      })
      if (!exists) return { status: 'error', message: `No certificate found with ID ${certId}.` }
      return { status: 'error', message: `${certId} is already revoked.` }
    }

    console.warn('[admin] certificate revoked', { certId, by: admin.userId })
    revalidatePath('/admin')
    return { status: 'success', message: `${certId} has been revoked.` }
  } catch (err) {
    console.error('[admin:revoke]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
}
