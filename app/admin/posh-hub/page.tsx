// CMS migration M4 — /admin/posh-hub: sections grouped by the 11 hub groups.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'
import { POSH_GROUPS } from '@/lib/posh-groups'
import { moveSection } from './actions'

export const metadata: Metadata = { title: 'POSH Hub' }
export const dynamic = 'force-dynamic'

export default async function AdminPoshHubPage() {
  const rows = await db.poshSection.findMany({
    orderBy: [{ group: 'asc' }, { order: 'asc' }],
    select: { id: true, title: true, anchor: true, group: true, isPublished: true },
  })

  const byGroup = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = byGroup.get(row.group) ?? []
    list.push(row)
    byGroup.set(row.group, list)
  }

  return (
    <div>
      <AdminPageHeader
        title="POSH Hub"
        description="The /posh-act knowledge hub — the site's SEO centerpiece. Anchors are permanent shared links; treat them like published URLs, because they are."
        newHref="/admin/posh-hub/new"
        newLabel="New section"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No sections in the database yet — the site is still serving the Sanity content.
          The first section you create (or migrate) flips /posh-act to this list.
        </AdminEmpty>
      ) : (
        // Groups render in the guide's reading order, not alphabetically.
        POSH_GROUPS.filter((g) => byGroup.has(g)).map((group) => {
          const items = byGroup.get(group)!
          return (
            <section key={group} className="mb-8">
              <h2 className="mb-3 text-[18px]">{group}</h2>
              <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
                {items.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
                  >
                    <ReorderButtons
                      id={s.id}
                      isFirst={i === 0}
                      isLast={i === items.length - 1}
                      action={moveSection}
                    />
                    <Link
                      href={`/admin/posh-hub/${s.id}`}
                      className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
                    >
                      <span className="block truncate text-[15px]">{s.title}</span>
                      <span className="block truncate font-mono text-[12px] text-[var(--brand-muted)]">
                        /posh-act#{s.anchor}
                      </span>
                    </Link>
                    <PublishBadge published={s.isPublished} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
