// CMS migration M4 — /admin/posh-hub/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { PoshSectionForm } from '@/components/admin/posh-section-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit hub section' }
export const dynamic = 'force-dynamic'

export default async function AdminPoshSectionEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const section =
    id === 'new'
      ? null
      : await db.poshSection.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            anchor: true,
            group: true,
            summary: true,
            isFaq: true,
            body: true,
            isPublished: true,
          },
        })

  if (id !== 'new' && !section) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={section ? 'Edit section' : 'New section'} />
      <AdminCard>
        <PoshSectionForm section={section} />
      </AdminCard>
    </div>
  )
}
