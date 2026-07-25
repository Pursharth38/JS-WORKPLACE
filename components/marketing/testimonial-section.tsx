import type { Testimonial } from "@/lib/sanity";
import { BlurFade } from "@/components/motion/blur-fade";
import { Container } from "./container";

/**
 * Three-card testimonial grid.
 *
 * ⚠️ REAL TESTIMONIALS ONLY. `getTestimonials()` filters to documents with
 * `consentOnFile == true`, and this component renders NOTHING when the list is
 * empty. It never pads the grid to three.
 *
 * The reference mockup this layout came from used invented people at invented
 * companies ("HR Head, TechCorp India"). That is precisely what CLAUDE.md
 * forbids — a fabricated quote attributed to a named person at a named employer
 * is a live legal exposure for the client, not placeholder text. The layout is
 * reproduced; the fabricated content is not.
 */
export function TestimonialSection({
  testimonials,
  eyebrow = "What clients say",
  heading = "Trusted by HR teams across India",
}: {
  testimonials: readonly Testimonial[];
  eyebrow?: string;
  heading?: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-[var(--brand-primary-tint)] py-20">
      <Container>
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[31px] font-semibold md:text-[39px]">
            {heading}
          </h2>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((t, i) => (
            <li key={t._id}>
              <BlurFade delay={i * 0.1}>
                <figure className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-7 shadow-[var(--shadow-sm)]">
                  <span
                    aria-hidden="true"
                    className="font-serif text-[40px] leading-none text-[var(--brand-accent)]"
                  >
                    &rdquo;
                  </span>

                  <blockquote className="mt-4 flex-1 text-[17px] leading-[1.7] text-[var(--brand-ink)]">
                    {t.quote}
                  </blockquote>

                  <figcaption className="mt-6 border-t border-[var(--brand-line)] pt-5">
                    <p className="text-[17px] font-semibold text-[var(--brand-ink)]">
                      {t.authorName}
                    </p>
                    {(t.authorRole || t.organization) && (
                      <p className="mt-0.5 text-[15px] text-[var(--brand-muted)]">
                        {[t.authorRole, t.organization]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </figcaption>
                </figure>
              </BlurFade>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
