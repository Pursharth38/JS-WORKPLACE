// CMS migration M3 — /admin/blog/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogForm } from '@/components/admin/blog-form'
import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit post' }
export const dynamic = 'force-dynamic'

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [post, categories] = await Promise.all([
    id === 'new'
      ? null
      : db.blogPost.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            body: true,
            coverImageKey: true,
            coverImageAlt: true,
            categoryId: true,
            tags: true,
            relatedHubAnchors: true,
            seoTitle: true,
            seoDescription: true,
            isPublished: true,
          },
        }),
    db.blogCategory.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])

  if (id !== 'new' && !post) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={post ? 'Edit post' : 'New post'} />
      <AdminCard>
        <BlogForm post={post} categories={categories} />
      </AdminCard>
    </div>
  )
}
