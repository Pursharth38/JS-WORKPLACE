// CMS migration M2 — /admin/settings (singleton).
import type { Metadata } from 'next'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { SettingsForm } from '@/components/admin/settings-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Site settings' }
export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await db.siteSettingsRow.findUnique({ where: { id: 'singleton' } })

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Site settings"
        description="Contact details, social links, the announcement bar and the home-page hero. Saving here for the first time switches the site from Sanity's settings to this page."
      />
      <AdminCard>
        <SettingsForm settings={settings} />
      </AdminCard>
    </div>
  )
}
