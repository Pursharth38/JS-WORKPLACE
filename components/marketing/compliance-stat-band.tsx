import { CountUp } from "@/components/motion/count-up";
import { Container } from "./container";
import type { Stat } from "./stat-band";

/**
 * Theme-aware navy + gold band. Runs on the same `--brand-elevated` /
 * `--brand-ink` / `--brand-accent` / `--brand-muted` tokens as the rest of
 * the site rather than hardcoded hex, so it gets a white card with dark-ink
 * text in light mode (matching every other elevated card, e.g. the service
 * cards under "How we can help") and the navy-with-gold look in dark mode —
 * which is what the hardcoded values below used to force permanently. The
 * dark-theme values of those four tokens happen to equal the original
 * hardcoded hex exactly, so dark mode is visually unchanged; only light mode
 * moves off "always dark" (2026-07-26, client-directed — the always-dark
 * navy card read as broken in light mode, not intentional). Copy here is
 * original, written for this site — not lifted from any reference image or
 * competitor page, per CLAUDE.md "original content only."
 *
 * ⚠️ DIFFERENT RULE FROM StatBand, on purpose. StatBand exists specifically
 * to keep out invented BUSINESS metrics ("10,000+ employees trained" — a
 * claim about Jyoti's own track record, which cannot be fabricated). This
 * component is for STATUTORY facts instead — numbers the Act itself states
 * (headcount thresholds, penalty amounts, committee composition) — which is
 * the same category of content as complaint-journey.tsx's day-counts, and
 * carries the same caveat: **figures must be client/legal-verified before
 * launch**, tracked wherever complaint-journey.tsx's equivalent note is
 * tracked. It is not gated behind demo mode, because it is not a claim about
 * her business — it is a claim about the law, sourced the same way every
 * other POSH Act fact on this site is.
 *
 * The three figures below carry the SAME caveat as complaint-journey.tsx's
 * DEFAULT_STEPS durations: they reflect the POSH Act, 2013 as commonly
 * summarised at the time this was written. Statutory figures and thresholds
 * can be amended — confirm current provisions before treating this as
 * authoritative.
 */
const DEFAULT_STATS: readonly Stat[] = [
  { value: "10", suffix: "+", label: "Employees before an Internal Committee is legally mandatory" },
  { value: "50000", prefix: "₹", label: "Penalty for a first non-compliance (Section 26)" },
  { value: "3", suffix: "+", label: "Members required on every Internal Committee, one from outside the organisation" },
];

export function ComplianceStatBand({
  stats = DEFAULT_STATS,
  heading = "POSH compliance is a legal obligation, not a courtesy",
  eyebrow = "Why this matters",
}: {
  stats?: readonly Stat[];
  heading?: string;
  eyebrow?: string;
}) {
  if (stats.length === 0) return null;

  return (
    <section
      className="border-y border-[var(--brand-line)] py-20"
      style={{ background: "var(--brand-elevated)", color: "var(--brand-ink)" }}
    >
      <Container>
        <div className="mx-auto max-w-[62ch] text-center">
          <p
            className="text-[13px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--brand-accent-text)" }}
          >
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[31px] font-semibold md:text-[39px]">
            {heading}
          </h2>
        </div>

        <dl className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {stats.map((s, i) => {
            const numeric = Number(String(s.value).replace(/[,\s]/g, ""));
            const isAnimatable = Number.isFinite(numeric) && numeric > 0;

            return (
              <div key={s.label} className="text-center">
                <dd
                  className="font-serif text-[39px] font-semibold leading-none md:text-[49px]"
                  style={{ color: "var(--brand-accent)" }}
                >
                  {isAnimatable ? (
                    <CountUp
                      to={numeric}
                      duration={1.6}
                      delay={i * 0.12}
                      prefix={s.prefix ?? ""}
                      suffix={s.suffix ?? ""}
                    />
                  ) : (
                    <span data-numeric>
                      {s.prefix}
                      {s.value}
                      {s.suffix}
                    </span>
                  )}
                </dd>
                <dt
                  className="mt-2 text-[15px] leading-snug"
                  style={{ color: "var(--brand-muted)" }}
                >
                  {s.label}
                </dt>
              </div>
            );
          })}
        </dl>
      </Container>
    </section>
  );
}
