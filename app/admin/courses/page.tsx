// CMS migration M5 — /admin/courses list.
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  AdminEmpty,
  AdminPageHeader,
  PublishBadge,
} from '@/components/admin/crud/list-page'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Courses' }
export const dynamic = 'force-dynamic'

function inr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export default async function AdminCoursesPage() {
  const rows = await db.course.findMany({
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      priceInPaise: true,
      isPublished: true,
      summary: true,
      _count: { select: { chapters: true, enrollments: true } },
    },
  })

  return (
    <div>
      <AdminPageHeader
        title="Courses"
        description="Course structure, content, pricing and the assessment question pools. The price here is the price checkout charges."
        newHref="/admin/courses/new"
        newLabel="New course"
      />

      {rows.length === 0 ? (
        <AdminEmpty>No courses yet.</AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <Link
                href={`/admin/courses/${c.id}`}
                className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
              >
                <span className="block truncate text-[15px] font-medium">{c.title}</span>
                <span className="block text-[13px] text-[var(--brand-muted)]">
                  /courses/{c.slug} · {inr(c.priceInPaise)} · {c._count.chapters} chapters ·{' '}
                  {c._count.enrollments} enrolled
                  {c.summary === null ? ' · content still in Sanity' : ''}
                </span>
              </Link>
              <PublishBadge published={c.isPublished} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
