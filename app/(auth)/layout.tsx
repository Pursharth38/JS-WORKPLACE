// DEV B — shell for every /login /signup /verify-email /forgot-password
// /reset-password page. Deliberately chrome-free: no header nav, no mega-menu.
// An auth page with a full site header invites the user to wander off mid-flow.
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--brand-sand)]">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-[19px] font-semibold text-[var(--brand-teal)]"
        >
          JS Workplace Wellness
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-16">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="px-6 py-6 text-center text-[13px] text-[var(--brand-muted)]">
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        <span className="px-2">·</span>
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
        <span className="px-2">·</span>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
      </footer>
    </div>
  )
}
