// CMS migration M4 — /admin/cta-bands list.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'CTA bands' }
export const dynamic = 'force-dynamic'

export default async function AdminCtaBandsPage() {
  const rows = await db.ctaBand.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      heading: true,
      buttonLabel: true,
      afterGroup: true,
      isPublished: true,
    },
  })

  return (
    <div>
      <AdminPageHeader
        title="CTA bands"
        description="Conversion bands placed between Knowledge Hub groups on /posh-act."
        newHref="/admin/cta-bands/new"
        newLabel="New band"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No bands in the database yet — the site is still serving the Sanity content.
        </AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {rows.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <Link
                href={`/admin/cta-bands/${b.id}`}
                className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
              >
                <span className="block truncate text-[15px] font-medium">{b.heading}</span>
                <span className="block text-[13px] text-[var(--brand-muted)]">
                  [{b.buttonLabel}]
                  {b.afterGroup ? ` · after "${b.afterGroup}"` : ' · not placed'}
                </span>
              </Link>
              <PublishBadge published={b.isPublished} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
