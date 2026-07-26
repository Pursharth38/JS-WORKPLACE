// CMS migration M4 — /admin/cta-bands/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CtaBandForm } from '@/components/admin/cta-band-form'
import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit CTA band' }
export const dynamic = 'force-dynamic'

export default async function AdminCtaBandEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const band =
    id === 'new'
      ? null
      : await db.ctaBand.findUnique({
          where: { id },
          select: {
            id: true,
            heading: true,
            body: true,
            buttonLabel: true,
            buttonHref: true,
            afterGroup: true,
            isPublished: true,
          },
        })

  if (id !== 'new' && !band) notFound()

  return (
    <div className="max-w-2xl">
      <AdminPageHeader title={band ? 'Edit band' : 'New band'} />
      <AdminCard>
        <CtaBandForm band={band} />
      </AdminCard>
    </div>
  )
}
