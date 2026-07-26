// CMS migration M2 — /admin/testimonials list.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'
import { moveTestimonial } from './actions'

export const metadata: Metadata = { title: 'Testimonials' }
export const dynamic = 'force-dynamic'

export default async function AdminTestimonialsPage() {
  const rows = await db.testimonial.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      quote: true,
      authorName: true,
      organization: true,
      consentOnFile: true,
      isPublished: true,
    },
  })

  return (
    <div>
      <AdminPageHeader
        title="Testimonials"
        description="Shown on the home page. Only entries with written permission on file are ever displayed."
        newHref="/admin/testimonials/new"
        newLabel="New testimonial"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No testimonials in the database yet — the site is still serving the Sanity
          content. The first entry you create (or migrate) flips the site to this list.
        </AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {rows.map((t, i) => (
            <li
              key={t.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <ReorderButtons
                id={t.id}
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                action={moveTestimonial}
              />
              <Link
                href={`/admin/testimonials/${t.id}`}
                className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
              >
                <span className="block truncate text-[15px]">&ldquo;{t.quote}&rdquo;</span>
                <span className="text-[13px] text-[var(--brand-muted)]">
                  {t.authorName}
                  {t.organization ? ` · ${t.organization}` : ''}
                </span>
              </Link>
              {!t.consentOnFile && (
                <span className="rounded-full bg-[var(--brand-danger-soft)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--brand-danger)]">
                  No consent
                </span>
              )}
              <PublishBadge published={t.isPublished} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
