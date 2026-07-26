'use server'

// CMS migration M2 — SiteSettings singleton. Upsert pinned to id "singleton";
// there is no delete — the site always has settings.
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, lines, optStr, reqStr } from '@/lib/admin-content'
import { db } from '@/lib/db'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).nullable(),
  whatsappNumber: z.string().trim().max(30).nullable(),
  whatsappDefaultMessage: z.string().trim().max(300).nullable(),
  addressLines: z.array(z.string().max(200)).max(6),
  linkedinUrl: z.string().url().max(300).nullable(),
  instagramUrl: z.string().url().max(300).nullable(),
  youtubeUrl: z.string().url().max(300).nullable(),
  announcementEnabled: z.boolean(),
  announcementText: z.string().trim().max(200).nullable(),
  announcementHref: z.string().trim().max(300).nullable(),
  heroHeading: z.string().trim().max(160).nullable(),
  heroSubheading: z.string().trim().max(300).nullable(),
  heroPrimaryCtaLabel: z.string().trim().max(60).nullable(),
  heroPrimaryCtaHref: z.string().trim().max(300).nullable(),
  legalEntityName: z.string().trim().max(160).nullable(),
  gstin: z.string().trim().max(20).nullable(),
  supportEmail: z.string().trim().email().max(254).nullable(),
})

export async function saveSettings(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const parsed = settingsSchema.safeParse({
    businessName: reqStr(fd, 'businessName'),
    email: reqStr(fd, 'email'),
    phone: optStr(fd, 'phone'),
    whatsappNumber: optStr(fd, 'whatsappNumber'),
    whatsappDefaultMessage: optStr(fd, 'whatsappDefaultMessage'),
    addressLines: lines(fd, 'addressLines'),
    linkedinUrl: optStr(fd, 'linkedinUrl'),
    instagramUrl: optStr(fd, 'instagramUrl'),
    youtubeUrl: optStr(fd, 'youtubeUrl'),
    announcementEnabled: checkbox(fd, 'announcementEnabled'),
    announcementText: optStr(fd, 'announcementText'),
    announcementHref: optStr(fd, 'announcementHref'),
    heroHeading: optStr(fd, 'heroHeading'),
    heroSubheading: optStr(fd, 'heroSubheading'),
    heroPrimaryCtaLabel: optStr(fd, 'heroPrimaryCtaLabel'),
    heroPrimaryCtaHref: optStr(fd, 'heroPrimaryCtaHref'),
    legalEntityName: optStr(fd, 'legalEntityName'),
    gstin: optStr(fd, 'gstin'),
    supportEmail: optStr(fd, 'supportEmail'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      status: 'error',
      message: first
        ? `${first.path.join('.')}: ${first.message}`
        : 'Check the form and try again.',
    }
  }

  try {
    await db.siteSettingsRow.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data },
      update: parsed.data,
    })
  } catch (err) {
    console.error('[admin:settings:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  updateTag(TAGS.siteSettings)
  revalidatePath('/admin/settings')
  return {
    status: 'success',
    message: 'Saved. The site now reads settings from this page, not Sanity.',
  }
}
