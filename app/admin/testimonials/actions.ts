'use server'

// CMS migration M2 — Testimonial CRUD. consentOnFile is hard-required: the
// action refuses to save a testimonial without written permission on file,
// same rule the Sanity schema enforced.
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, computeSwap, optStr, reqStr } from '@/lib/admin-content'
import { db } from '@/lib/db'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

const testimonialSchema = z.object({
  quote: z.string().trim().min(10).max(1000),
  authorName: z.string().trim().min(2).max(100),
  authorRole: z.string().trim().max(100).nullable(),
  organization: z.string().trim().max(150).nullable(),
  consentOnFile: z.literal(true, {
    errorMap: () => ({
      message: 'Written permission must be on file before a testimonial is stored.',
    }),
  }),
  isPublished: z.boolean(),
})

function bust() {
  updateTag(TAGS.testimonial)
  revalidatePath('/admin/testimonials')
}

export async function saveTestimonial(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const parsed = testimonialSchema.safeParse({
    quote: reqStr(fd, 'quote'),
    authorName: reqStr(fd, 'authorName'),
    authorRole: optStr(fd, 'authorRole'),
    organization: optStr(fd, 'organization'),
    consentOnFile: checkbox(fd, 'consentOnFile'),
    isPublished: checkbox(fd, 'isPublished'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      status: 'error',
      message: first?.message ?? 'Check the form — quote and author are required.',
    }
  }

  try {
    if (id) {
      await db.testimonial.update({ where: { id }, data: parsed.data })
      bust()
      return { status: 'success', message: 'Saved.' }
    }

    const max = await db.testimonial.aggregate({ _max: { order: true } })
    await db.testimonial.create({ data: { ...parsed.data, order: (max._max.order ?? 0) + 1 } })
  } catch (err) {
    console.error('[admin:testimonial:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust()
  redirect('/admin/testimonials')
}

export async function deleteTestimonial(id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    await db.testimonial.delete({ where: { id } })
    bust()
  } catch (err) {
    console.error('[admin:testimonial:delete]', err)
  }
  redirect('/admin/testimonials')
}

export async function moveTestimonial(id: string, direction: 'up' | 'down'): Promise<void> {
  if (!(await requireAdmin())) return
  const rows = await db.testimonial.findMany({ select: { id: true, order: true } })
  const swap = computeSwap(rows, id, direction)
  if (!swap) return

  await db.$transaction([
    db.testimonial.update({ where: { id: swap.a.id }, data: { order: swap.a.order } }),
    db.testimonial.update({ where: { id: swap.b.id }, data: { order: swap.b.order } }),
  ])
  bust()
}
