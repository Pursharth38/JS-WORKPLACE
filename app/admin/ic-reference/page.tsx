// CMS migration M4 — /admin/ic-reference list.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'
import { moveQuickReference } from './actions'

export const metadata: Metadata = { title: 'IC Quick Reference' }
export const dynamic = 'force-dynamic'

export default async function AdminQuickReferencePage() {
  const rows = await db.quickReference.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, title: true, anchor: true, isPublished: true },
  })

  return (
    <div>
      <AdminPageHeader
        title="IC Quick Reference"
        description="The Internal Committee reference cards on /ic-quick-reference — timelines, composition rules, registers."
        newHref="/admin/ic-reference/new"
        newLabel="New card"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No cards in the database yet — the site is still serving the Sanity content.
        </AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {rows.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <ReorderButtons
                id={c.id}
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                action={moveQuickReference}
              />
              <Link
                href={`/admin/ic-reference/${c.id}`}
                className="min-w-0 flex-1 truncate text-[15px] hover:text-[var(--brand-primary)] hover:underline"
              >
                {c.title}
              </Link>
              <PublishBadge published={c.isPublished} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
