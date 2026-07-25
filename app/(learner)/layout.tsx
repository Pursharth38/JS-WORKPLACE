// DEV B — chrome for the learner area.
//
// Middleware has already redirected signed-out visitors, but this layout does
// NOT rely on that. Middleware only inspects a JWT; the pages below read a
// learner's payment history and certificates, so the session is re-checked here
// server-side. Defence in depth: if the matcher is ever edited, this still holds.
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { signOutAction } from '@/app/(learner)/actions'
import { getSession } from '@/lib/session'

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login?redirectTo=/dashboard')

  return (
    <div className="min-h-screen bg-[var(--brand-surface)]">
      <header className="border-b border-[var(--brand-line)] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-[18px] font-semibold text-[var(--brand-primary)]"
          >
            JS Workplace Wellness
          </Link>

          <nav className="flex items-center gap-5 text-[15px]" aria-label="Learner area">
            <Link href="/dashboard" className="hover:text-[var(--brand-primary)]">
              Dashboard
            </Link>
            <Link href="/dashboard/certificates" className="hover:text-[var(--brand-primary)]">
              Certificates
            </Link>
            <Link href="/dashboard/invoices" className="hover:text-[var(--brand-primary)]">
              Invoices
            </Link>
            {session.role === 'ADMIN' && (
              <Link href="/admin" className="font-medium text-[var(--brand-accent)]">
                Admin
              </Link>
            )}
          </nav>

          <form action={signOutAction} className="ml-auto">
            <button
              type="submit"
              className="text-[15px] text-[var(--brand-muted)] hover:text-[var(--brand-ink)] hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
