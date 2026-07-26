'use server'

// CMS migration M2 — Instagram grid CRUD (Sanity-managed grid successor; still
// no Basic Display API, per the pre-start DECISIONS LOG entry).
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, computeSwap, optStr, reqStr } from '@/lib/admin-content'
import { CONTENT_IMAGE_PREFIX } from '@/lib/images'
import { db } from '@/lib/db'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

const instagramSchema = z.object({
  imageKey: z
    .string()
    .startsWith(CONTENT_IMAGE_PREFIX, { message: 'Upload an image first.' })
    .max(300),
  permalink: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://www.instagram.com/') || u.startsWith('https://instagram.com/'), {
      message: 'Paste the post URL from instagram.com.',
    }),
  caption: z.string().trim().min(1).max(500),
  isPublished: z.boolean(),
})

function bust() {
  updateTag(TAGS.instagramPost)
  revalidatePath('/admin/instagram')
}

export async function saveInstagramPost(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const parsed = instagramSchema.safeParse({
    imageKey: reqStr(fd, 'imageKey'),
    permalink: reqStr(fd, 'permalink'),
    caption: reqStr(fd, 'caption'),
    isPublished: checkbox(fd, 'isPublished'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { status: 'error', message: first?.message ?? 'Check the form and try again.' }
  }

  try {
    if (id) {
      await db.instagramPost.update({ where: { id }, data: parsed.data })
      bust()
      return { status: 'success', message: 'Saved.' }
    }

    const max = await db.instagramPost.aggregate({ _max: { order: true } })
    await db.instagramPost.create({ data: { ...parsed.data, order: (max._max.order ?? 0) + 1 } })
  } catch (err) {
    console.error('[admin:instagram:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust()
  redirect('/admin/instagram')
}

export async function deleteInstagramPost(id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    await db.instagramPost.delete({ where: { id } })
    bust()
  } catch (err) {
    console.error('[admin:instagram:delete]', err)
  }
  redirect('/admin/instagram')
}

export async function moveInstagramPost(id: string, direction: 'up' | 'down'): Promise<void> {
  if (!(await requireAdmin())) return
  const rows = await db.instagramPost.findMany({ select: { id: true, order: true } })
  const swap = computeSwap(rows, id, direction)
  if (!swap) return

  await db.$transaction([
    db.instagramPost.update({ where: { id: swap.a.id }, data: { order: swap.a.order } }),
    db.instagramPost.update({ where: { id: swap.b.id }, data: { order: swap.b.order } }),
  ])
  bust()
}
