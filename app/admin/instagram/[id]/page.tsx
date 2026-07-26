// CMS migration M2 — /admin/instagram/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { InstagramForm } from '@/components/admin/instagram-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit Instagram post' }
export const dynamic = 'force-dynamic'

export default async function AdminInstagramEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const post =
    id === 'new'
      ? null
      : await db.instagramPost.findUnique({
          where: { id },
          select: { id: true, imageKey: true, permalink: true, caption: true, isPublished: true },
        })

  if (id !== 'new' && !post) notFound()

  return (
    <div className="max-w-2xl">
      <AdminPageHeader title={post ? 'Edit post' : 'Add post'} />
      <AdminCard>
        <InstagramForm post={post} />
      </AdminCard>
    </div>
  )
}
