// CMS migration M2 — /admin/services/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { ServiceForm } from '@/components/admin/service-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit service' }
export const dynamic = 'force-dynamic'

export default async function AdminServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const service =
    id === 'new'
      ? null
      : await db.service.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            icon: true,
            whoItIsFor: true,
            whatIsCovered: true,
            format: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            isPublished: true,
          },
        })

  if (id !== 'new' && !service) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={service ? 'Edit service' : 'New service'} />
      <AdminCard>
        <ServiceForm service={service} />
      </AdminCard>
    </div>
  )
}
