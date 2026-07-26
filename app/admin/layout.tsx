// CMS migration M1e — shared chrome for every /admin screen.
//
// requireAdmin() runs HERE for every admin render (database role re-read, not
// the 30-day JWT) — and each mutation re-checks it again in its own Server
// Action, because a layout guard alone protects reads, not writes.
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/admin/nav'
import { requireAdmin } from '@/lib/session'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  if (!admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[var(--brand-surface)]">
      <header className="border-b border-[var(--brand-line)] bg-[var(--brand-elevated)]">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="font-[family-name:var(--font-heading)] text-[18px] font-semibold text-[var(--brand-primary)]">
              Admin — JS Workplace Wellness
            </span>
            <Link
              href="/dashboard"
              className="ml-auto text-[15px] text-[var(--brand-muted)] hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
          <AdminNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}
