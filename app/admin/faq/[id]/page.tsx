// CMS migration M2 — /admin/faq/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FaqForm } from '@/components/admin/faq-form'
import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit FAQ' }
export const dynamic = 'force-dynamic'

export default async function AdminFaqEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const faq =
    id === 'new'
      ? null
      : await db.faq.findUnique({
          where: { id },
          select: { id: true, question: true, answer: true, category: true, isPublished: true },
        })

  if (id !== 'new' && !faq) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={faq ? 'Edit question' : 'New question'} />
      <AdminCard>
        <FaqForm faq={faq} />
      </AdminCard>
    </div>
  )
}
