"use client";

import { CountUp } from "@/components/motion/count-up";
import { Container } from "./container";

export type Stat = {
  /** Display string. Use a plain number to get the count-up animation. */
  value: string;
  label: string;
  suffix?: string;
  /** e.g. "₹" — StatBand itself doesn't render this; ComplianceStatBand does. */
  prefix?: string;
};

/**
 * ⚠️ NEVER INVENT A NUMBER FOR THIS COMPONENT.
 *
 * CLAUDE.md: "Never invent testimonials, client logos, or trained-employee
 * counts." A fabricated "10,000+ employees trained" is trivially challenged and
 * destroys the credibility this entire site exists to build.
 *
 * The component takes stats as props and renders NOTHING when the list is empty,
 * so the home page degrades to no band rather than to invented figures.
 *
 * Values that parse as a number animate with a count-up. Values that do not —
 * including the `[00]` placeholders used while the client's real figures are
 * outstanding — render as static text. That is deliberate: a placeholder should
 * look like a placeholder, not perform like real data.
 */
export function StatBand({
  stats,
  heading,
}: {
  stats: readonly Stat[];
  heading?: string;
}) {
  if (stats.length === 0) return null;

  return (
    <section className="border-y border-[var(--brand-line)] bg-[var(--brand-elevated)]">
      <Container className="py-14">
        {heading && (
          <p className="mb-8 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-muted)]">
            {heading}
          </p>
        )}

        <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const numeric = Number(String(s.value).replace(/[,\s]/g, ""));
            const isAnimatable = Number.isFinite(numeric) && numeric > 0;

            return (
              <div key={s.label} className="text-center">
                <dd className="font-serif text-[39px] font-semibold leading-none text-[var(--brand-primary)] md:text-[49px]">
                  {isAnimatable ? (
                    <CountUp
                      to={numeric}
                      duration={1.6}
                      delay={i * 0.12}
                      suffix={s.suffix ?? ""}
                    />
                  ) : (
                    <span data-numeric>{s.value}</span>
                  )}
                </dd>
                <dt className="mt-2 text-[15px] leading-snug text-[var(--brand-muted)]">
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
