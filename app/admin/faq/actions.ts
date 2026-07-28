'use server'

// CMS migration M2 — FAQ CRUD actions. Every action re-checks ADMIN.
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, computeSwap, jsonField, optStr, reqStr } from '@/lib/admin-content'
import { db } from '@/lib/db'
import { richTextSchema } from '@/lib/richtext'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

const faqSchema = z.object({
  question: z.string().trim().min(3).max(500),
  answer: richTextSchema,
  category: z.string().trim().min(1).max(100),
  isPublished: z.boolean(),
})

function bust() {
  // updateTag (Next 16): Server-Action-scoped invalidation with
  // read-your-own-writes — the admin sees their save immediately, and the
  // public pages cached under this tag re-render on next request.
  updateTag(TAGS.faq)
  revalidatePath('/admin/faq')
}

export async function saveFaq(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const parsed = faqSchema.safeParse({
    question: reqStr(fd, 'question'),
    answer: jsonField(fd, 'answer'),
    category: reqStr(fd, 'category'),
    isPublished: checkbox(fd, 'isPublished'),
  })
  if (!parsed.success) {
    return { status: 'error', message: 'Check the form — the question, category and answer are required.' }
  }

  try {
    if (id) {
      await db.faq.update({ where: { id }, data: parsed.data })
      bust()
      return { status: 'success', message: 'Saved.' }
    }

    const max = await db.faq.aggregate({
      where: { category: parsed.data.category },
      _max: { order: true },
    })
    await db.faq.create({
      data: { ...parsed.data, order: (max._max.order ?? 0) + 1 },
    })
  } catch (err) {
    console.error('[admin:faq:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust()
  redirect('/admin/faq')
}

export async function deleteFaq(id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    await db.faq.delete({ where: { id } })
    bust()
  } catch (err) {
    console.error('[admin:faq:delete]', err)
  }
  redirect('/admin/faq')
}

/** Flips Published/Draft from the list view — no need to open the full editor. */
export async function togglePublish(id: string): Promise<void> {
  if (!(await requireAdmin())) return
  const row = await db.faq.findUnique({ where: { id }, select: { isPublished: true } })
  if (!row) return
  await db.faq.update({ where: { id }, data: { isPublished: !row.isPublished } })
  bust()
}

export async function moveFaq(id: string, direction: 'up' | 'down'): Promise<void> {
  if (!(await requireAdmin())) return
  const row = await db.faq.findUnique({ where: { id }, select: { category: true } })
  if (!row) return

  const rows = await db.faq.findMany({
    where: { category: row.category },
    select: { id: true, order: true },
  })
  const swap = computeSwap(rows, id, direction)
  if (!swap) return

  await db.$transaction([
    db.faq.update({ where: { id: swap.a.id }, data: { order: swap.a.order } }),
    db.faq.update({ where: { id: swap.b.id }, data: { order: swap.b.order } }),
  ])
  bust()
}
