// DEV B — the card every auth page sits in. Server component.
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-7">
      <h1 className="mb-1.5 text-[26px]">{title}</h1>
      {subtitle && (
        <p className="mb-6 text-[15px] leading-relaxed text-[var(--brand-muted)]">{subtitle}</p>
      )}
      {children}
    </div>
  )
}

/** Separator between the OAuth button and the email/password form. */
export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--brand-line)]" />
      <span className="text-[13px] text-[var(--brand-muted)]">or</span>
      <span className="h-px flex-1 bg-[var(--brand-line)]" />
    </div>
  )
}
