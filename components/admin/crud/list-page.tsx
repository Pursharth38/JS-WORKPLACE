// CMS migration M1e — server-component chrome for admin list screens.
import Link from 'next/link'

export function AdminPageHeader({
  title,
  description,
  newHref,
  newLabel,
}: {
  title: string
  description?: string
  newHref?: string
  newLabel?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-[64ch] text-[15px] leading-relaxed text-[var(--brand-muted)]">
            {description}
          </p>
        )}
      </div>
      {newHref && (
        <Link
          href={newHref}
          className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          {newLabel ?? 'New'}
        </Link>
      )}
    </div>
  )
}

export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--brand-line)] bg-[var(--brand-elevated)] p-8 text-center text-[15px] text-[var(--brand-muted)]">
      {children}
    </p>
  )
}

export function AdminCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6">
      {children}
    </div>
  )
}

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
      style={
        published
          ? { color: 'var(--brand-success)', background: 'var(--brand-success-soft)' }
          : { color: 'var(--brand-muted)', background: 'var(--brand-line)' }
      }
    >
      {published ? 'Published' : 'Draft'}
    </span>
  )
}
