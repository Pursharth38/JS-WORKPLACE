'use client'

// CMS migration M1e — admin nav tabs. Client only for the active-state check.
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/posh-hub', label: 'POSH Hub' },
  { href: '/admin/ic-reference', label: 'Quick Ref' },
  { href: '/admin/faq', label: 'FAQ' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/instagram', label: 'Instagram' },
  { href: '/admin/cta-bands', label: 'CTA bands' },
  { href: '/admin/settings', label: 'Settings' },
] as const

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin sections" className="overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-6">
        {TABS.map((tab) => {
          const active =
            tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  active
                    ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'border-transparent text-[var(--brand-muted)] hover:text-[var(--brand-ink)]'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
