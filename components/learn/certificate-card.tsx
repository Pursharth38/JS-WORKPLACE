// DEV B — a single certificate on /dashboard/certificates. Server component.
import Link from "next/link";

export function CertificateCard({
  certId,
  courseTitle,
  learnerName,
  issuedAt,
  revoked,
}: {
  certId: string;
  courseTitle: string;
  learnerName: string;
  issuedAt: Date;
  revoked: boolean;
}) {
  return (
    <div
      className="rounded-lg border bg-[var(--brand-elevated)] p-6"
      style={{
        borderColor: revoked ? "var(--brand-danger)" : "var(--brand-line)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] uppercase tracking-wide text-[var(--brand-muted)]">
            Certificate of Completion
          </p>
          <h2 className="mt-1 text-[20px]">{courseTitle}</h2>
          <p className="mt-1 text-[15px] text-[var(--brand-muted)]">
            Issued to{" "}
            <strong className="text-[var(--brand-ink)]">{learnerName}</strong>{" "}
            on{" "}
            {issuedAt.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-2 font-mono text-[14px] text-[var(--brand-muted)]">
            {certId}
          </p>
        </div>

        {revoked ? (
          <span className="rounded-full border border-[var(--brand-danger)] px-3 py-1 text-[13px] font-medium text-[var(--brand-danger)]">
            Revoked
          </span>
        ) : (
          <div className="flex shrink-0 flex-col gap-2">
            <a
              href={`/api/certificate/${certId}/pdf`}
              className="rounded-md bg-[var(--brand-primary)] px-4 py-2.5 text-center text-[15px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
            >
              Download PDF
            </a>
            <Link
              href={`/verify/${certId}`}
              className="rounded-md border border-[var(--brand-line)] px-4 py-2.5 text-center text-[15px] font-medium hover:bg-[var(--brand-surface)]"
            >
              Public verification page
            </Link>
          </div>
        )}
      </div>

      {revoked && (
        <p className="mt-4 border-t border-[var(--brand-line)] pt-3 text-[14px] leading-relaxed text-[var(--brand-muted)]">
          This certificate has been withdrawn and can no longer be downloaded or
          verified. If you believe this is a mistake,{" "}
          <Link
            href="/contact"
            className="text-[var(--brand-primary)] underline"
          >
            contact us
          </Link>
          .
        </p>
      )}
    </div>
  );
}
