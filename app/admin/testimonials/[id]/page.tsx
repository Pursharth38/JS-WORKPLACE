// CMS migration M2 — /admin/testimonials/[id] edit screen ("new" creates).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { TestimonialForm } from '@/components/admin/testimonial-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit testimonial' }
export const dynamic = 'force-dynamic'

export default async function AdminTestimonialEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const testimonial =
    id === 'new'
      ? null
      : await db.testimonial.findUnique({
          where: { id },
          select: {
            id: true,
            quote: true,
            authorName: true,
            authorRole: true,
            organization: true,
            consentOnFile: true,
            isPublished: true,
          },
        })

  if (id !== 'new' && !testimonial) notFound()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={testimonial ? 'Edit testimonial' : 'New testimonial'} />
      <AdminCard>
        <TestimonialForm testimonial={testimonial} />
      </AdminCard>
    </div>
  )
}
