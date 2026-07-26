// CMS migration M4 — /admin/ic-reference/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { QuickReferenceForm } from '@/components/admin/quick-reference-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit reference card' }
export const dynamic = 'force-dynamic'

export default async function AdminQuickReferenceEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const card =
    id === 'new'
      ? null
      : await db.quickReference.findUnique({
          where: { id },
          select: { id: true, title: true, anchor: true, intro: true, body: true, isPublished: true },
        })

  if (id !== 'new' && !card) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={card ? 'Edit card' : 'New card'} />
      <AdminCard>
        <QuickReferenceForm card={card} />
      </AdminCard>
    </div>
  )
}
