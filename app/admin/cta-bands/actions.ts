'use server'

// CMS migration M4 — CTA band CRUD (the conversion bands between hub groups).
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, optStr, reqStr } from '@/lib/admin-content'
import { db } from '@/lib/db'
import { POSH_GROUPS } from '@/lib/posh-groups'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

const bandSchema = z.object({
  heading: z.string().trim().min(3).max(200),
  body: z.string().trim().max(500).nullable(),
  buttonLabel: z.string().trim().min(2).max(60),
  buttonHref: z
    .string()
    .trim()
    .max(300)
    .refine((h) => h.startsWith('/') || h.startsWith('https://') || h.startsWith('mailto:'), {
      message: 'Button link must be a site path, https:// URL or mailto:',
    }),
  afterGroup: z.enum(POSH_GROUPS).nullable(),
  isPublished: z.boolean(),
})

function bust() {
  updateTag(TAGS.poshSection)
  revalidatePath('/admin/cta-bands')
}

export async function saveCtaBand(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const afterGroupRaw = optStr(fd, 'afterGroup')
  const parsed = bandSchema.safeParse({
    heading: reqStr(fd, 'heading'),
    body: optStr(fd, 'body'),
    buttonLabel: reqStr(fd, 'buttonLabel'),
    buttonHref: reqStr(fd, 'buttonHref'),
    afterGroup: afterGroupRaw === '' ? null : afterGroupRaw,
    isPublished: checkbox(fd, 'isPublished'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { status: 'error', message: first?.message ?? 'Check the form and try again.' }
  }

  try {
    if (id) {
      await db.ctaBand.update({ where: { id }, data: parsed.data })
      bust()
      return { status: 'success', message: 'Saved.' }
    }
    await db.ctaBand.create({ data: parsed.data })
  } catch (err) {
    console.error('[admin:cta-bands:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust()
  redirect('/admin/cta-bands')
}

export async function deleteCtaBand(id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    await db.ctaBand.delete({ where: { id } })
    bust()
  } catch (err) {
    console.error('[admin:cta-bands:delete]', err)
  }
  redirect('/admin/cta-bands')
}
