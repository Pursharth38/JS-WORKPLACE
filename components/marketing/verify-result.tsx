// DEV B — renders a verification outcome on the public /verify/[certId] page.
// Server component; receives already-fetched data, does no fetching itself.
//
// Copy note (CLAUDE.md §1): describes a "Certificate of Completion" only.
// None of the forbidden certification/government claim strings from §1 —
// not quoted here so a source-level grep stays clean.

export type VerifyOutcome =
  | { kind: 'valid'; learnerName: string; courseTitle: string; issuedAt: Date }
  | { kind: 'revoked'; learnerName: string; courseTitle: string; issuedAt: Date }
  | { kind: 'not_found' }

export function VerifyResult({ outcome, certId }: { outcome: VerifyOutcome; certId: string }) {
  if (outcome.kind === 'not_found') {
    return (
      <div className="rounded-lg border border-[var(--brand-danger)] bg-white p-7">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-danger)]">
          Not verified
        </p>
        <h2 className="mt-2 text-[24px]">No certificate matches this ID</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--brand-muted)]">
          The ID <strong className="font-mono text-[15px]">{certId}</strong> does not match
          any Certificate of Completion issued by JS Workplace Wellness. Check the ID for
          typing mistakes — the letters O, I and L are never used; read them as the digits
          0 and 1. If the ID came from a document presented to you, treat that document
          with caution.
        </p>
      </div>
    )
  }

  const issued = outcome.issuedAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (outcome.kind === 'revoked') {
    return (
      <div className="rounded-lg border border-[var(--brand-amber)] bg-white p-7">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-amber)]">
          Revoked
        </p>
        <h2 className="mt-2 text-[24px]">This certificate has been withdrawn</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--brand-muted)]">
          A Certificate of Completion with this ID was issued to{' '}
          <strong>{outcome.learnerName}</strong> on {issued} for{' '}
          <strong>{outcome.courseTitle}</strong>, but it has since been revoked by JS
          Workplace Wellness and is no longer valid. For questions about a revoked
          certificate,{' '}
          <a href="/contact" className="text-[var(--brand-teal)] underline">
            contact us
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--brand-success)] bg-white p-7">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-success)]">
        ✓ Verified
      </p>
      <h2 className="mt-2 text-[24px]">This certificate is genuine</h2>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[13px] uppercase tracking-wide text-[var(--brand-muted)]">
            Issued to
          </dt>
          <dd className="mt-0.5 text-[18px] font-medium">{outcome.learnerName}</dd>
        </div>
        <div>
          <dt className="text-[13px] uppercase tracking-wide text-[var(--brand-muted)]">
            Date of issue
          </dt>
          <dd className="mt-0.5 text-[18px] font-medium">{issued}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[13px] uppercase tracking-wide text-[var(--brand-muted)]">
            Programme
          </dt>
          <dd className="mt-0.5 text-[18px] font-medium">{outcome.courseTitle}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[13px] uppercase tracking-wide text-[var(--brand-muted)]">
            Certificate ID
          </dt>
          <dd className="mt-0.5 font-mono text-[16px]">{certId}</dd>
        </div>
      </dl>

      <p className="mt-6 border-t border-[var(--brand-line)] pt-4 text-[14px] leading-relaxed text-[var(--brand-muted)]">
        This record confirms completion of a self-paced awareness training programme
        delivered by JS Workplace Wellness. It is not a statutory or government-issued
        qualification.
      </p>
    </div>
  )
}
