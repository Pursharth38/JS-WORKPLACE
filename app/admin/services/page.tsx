// CMS migration M2 — /admin/services list.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'
import { moveService } from './actions'

export const metadata: Metadata = { title: 'Services' }
export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const rows = await db.service.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, title: true, slug: true, summary: true, isPublished: true },
  })

  return (
    <div>
      <AdminPageHeader
        title="Services"
        description="The training practice's offerings, in the order they appear on /services."
        newHref="/admin/services/new"
        newLabel="New service"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No services in the database yet — the site is still serving the Sanity content.
          The first service you create (or migrate) flips /services to this list.
        </AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {rows.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <ReorderButtons
                id={s.id}
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                action={moveService}
              />
              <Link
                href={`/admin/services/${s.id}`}
                className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
              >
                <span className="block truncate text-[15px] font-medium">{s.title}</span>
                <span className="block truncate text-[13px] text-[var(--brand-muted)]">
                  /services/{s.slug} — {s.summary}
                </span>
              </Link>
              <PublishBadge published={s.isPublished} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
