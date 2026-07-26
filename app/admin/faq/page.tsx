// CMS migration M2 — /admin/faq list, grouped by category.
import type { Metadata } from 'next'
import Link from 'next/link'

import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'
import { moveFaq } from './actions'

export const metadata: Metadata = { title: 'FAQ' }
export const dynamic = 'force-dynamic'

export default async function AdminFaqPage() {
  const rows = await db.faq.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
    select: { id: true, question: true, category: true, isPublished: true },
  })

  const byCategory = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? []
    list.push(row)
    byCategory.set(row.category, list)
  }

  return (
    <div>
      <AdminPageHeader
        title="FAQ"
        description="Questions shown on /faq, grouped by category. Order within a category is the order visitors see."
        newHref="/admin/faq/new"
        newLabel="New question"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No FAQs in the database yet — the site is still serving the Sanity content. The
          first question you create (or migrate) flips /faq to this list.
        </AdminEmpty>
      ) : (
        [...byCategory.entries()].map(([category, items]) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-[18px]">{category}</h2>
            <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
              {items.map((f, i) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
                >
                  <ReorderButtons
                    id={f.id}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                    action={moveFaq}
                  />
                  <Link
                    href={`/admin/faq/${f.id}`}
                    className="min-w-0 flex-1 truncate text-[15px] hover:text-[var(--brand-primary)] hover:underline"
                  >
                    {f.question}
                  </Link>
                  <PublishBadge published={f.isPublished} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
