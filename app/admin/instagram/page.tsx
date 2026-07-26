// CMS migration M2 — /admin/instagram grid manager.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'
import { imageSrc } from '@/lib/images'
import { moveInstagramPost } from './actions'

export const metadata: Metadata = { title: 'Instagram' }
export const dynamic = 'force-dynamic'

export default async function AdminInstagramPage() {
  const rows = await db.instagramPost.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, imageKey: true, caption: true, isPublished: true },
  })

  return (
    <div>
      <AdminPageHeader
        title="Instagram grid"
        description="The home-page Instagram strip. Managed by hand on purpose — the Instagram API's tokens expire every 60 days and fail silently, so this never breaks on a weekend."
        newHref="/admin/instagram/new"
        newLabel="Add post"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No posts in the database yet — the site is still serving the Sanity grid. The
          first post you add (or migrate) flips the strip to this list.
        </AdminEmpty>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((p, i) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]"
            >
              <Link href={`/admin/instagram/${p.id}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc(p.imageKey)}
                  alt={p.caption}
                  className="aspect-square w-full object-cover"
                />
              </Link>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <ReorderButtons
                  id={p.id}
                  isFirst={i === 0}
                  isLast={i === rows.length - 1}
                  action={moveInstagramPost}
                />
                <PublishBadge published={p.isPublished} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
