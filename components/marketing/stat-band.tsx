import { Container } from "./container";

export type Stat = { value: string; label: string };

/**
 * ⚠️ NEVER INVENT A NUMBER FOR THIS COMPONENT.
 *
 * CLAUDE.md: "Never invent testimonials, client logos, or trained-employee
 * counts." A fabricated "10,000+ employees trained" is the kind of claim that
 * is trivially challenged and destroys the credibility this whole site exists
 * to build.
 *
 * It takes stats as props and renders NOTHING when the list is empty, so the
 * homepage degrades to no band rather than to placeholder numbers. Real figures
 * come from the client.
 */
export function StatBand({ stats }: { stats: readonly Stat[] }) {
  if (stats.length === 0) return null;

  return (
    <section className="border-y border-[var(--brand-line)] bg-[var(--brand-elevated)]">
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p
              data-numeric
              className="font-serif text-[39px] font-semibold text-[var(--brand-primary)]"
            >
              {s.value}
            </p>
            <p className="mt-1 text-[15px] text-[var(--brand-muted)]">
              {s.label}
            </p>
          </div>
        ))}
      </Container>
    </section>
  );
}
