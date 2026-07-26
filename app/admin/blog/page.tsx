// CMS migration M3 — /admin/blog: posts list + category manager.
import type { Metadata } from 'next'
import Link from 'next/link'

import { CategoryManager } from '@/components/admin/category-manager'
import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Blog' }
export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const [posts, categories] = await Promise.all([
    db.blogPost.findMany({
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'first' } }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        publishedAt: true,
        category: { select: { title: true } },
      },
    }),
    db.blogCategory.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, _count: { select: { posts: true } } },
    }),
  ])

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Posts on /blog. Drafts are visible only here; publishing stamps the date readers see."
        newHref="/admin/blog/new"
        newLabel="New post"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {posts.length === 0 ? (
            <AdminEmpty>
              No posts in the database yet — the site is still serving the Sanity blog.
              The first post you create (or migrate) flips /blog to this list.
            </AdminEmpty>
          ) : (
            <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
                >
                  <Link
                    href={`/admin/blog/${p.id}`}
                    className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
                  >
                    <span className="block truncate text-[15px] font-medium">{p.title}</span>
                    <span className="block truncate text-[13px] text-[var(--brand-muted)]">
                      /blog/{p.slug}
                      {p.category ? ` · ${p.category.title}` : ''}
                      {p.publishedAt
                        ? ` · ${p.publishedAt.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : ''}
                    </span>
                  </Link>
                  <PublishBadge published={p.isPublished} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <CategoryManager
          categories={categories.map((c) => ({
            id: c.id,
            title: c.title,
            postCount: c._count.posts,
          }))}
        />
      </div>
    </div>
  )
}
