'use server'

// CMS migration M4 — IC Quick Reference CRUD.
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, computeSwap, jsonField, optStr, reqStr } from '@/lib/admin-content'
import { db } from '@/lib/db'
import { richTextSchema } from '@/lib/richtext'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

const refSchema = z.object({
  title: z.string().trim().min(3).max(200),
  anchor: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(96),
  intro: z.string().trim().max(500).nullable(),
  body: richTextSchema,
  isPublished: z.boolean(),
})

function bust() {
  updateTag(TAGS.poshSection)
  revalidatePath('/admin/ic-reference')
}

export async function saveQuickReference(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const parsed = refSchema.safeParse({
    title: reqStr(fd, 'title'),
    anchor: reqStr(fd, 'anchor'),
    intro: optStr(fd, 'intro'),
    body: jsonField(fd, 'body'),
    isPublished: checkbox(fd, 'isPublished'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { status: 'error', message: first?.message ?? 'Check the form and try again.' }
  }

  try {
    if (id) {
      await db.quickReference.update({ where: { id }, data: parsed.data })
      bust()
      return { status: 'success', message: 'Saved.' }
    }
    const max = await db.quickReference.aggregate({ _max: { order: true } })
    await db.quickReference.create({ data: { ...parsed.data, order: (max._max.order ?? 0) + 1 } })
  } catch (err) {
    if (typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002') {
      return { status: 'error', message: 'That anchor is already in use.' }
    }
    console.error('[admin:ic-reference:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust()
  redirect('/admin/ic-reference')
}

export async function deleteQuickReference(id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    await db.quickReference.delete({ where: { id } })
    bust()
  } catch (err) {
    console.error('[admin:ic-reference:delete]', err)
  }
  redirect('/admin/ic-reference')
}

export async function moveQuickReference(id: string, direction: 'up' | 'down'): Promise<void> {
  if (!(await requireAdmin())) return
  const rows = await db.quickReference.findMany({ select: { id: true, order: true } })
  const swap = computeSwap(rows, id, direction)
  if (!swap) return

  await db.$transaction([
    db.quickReference.update({ where: { id: swap.a.id }, data: { order: swap.a.order } }),
    db.quickReference.update({ where: { id: swap.b.id }, data: { order: swap.b.order } }),
  ])
  bust()
}
