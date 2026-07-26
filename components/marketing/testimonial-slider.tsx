"use client";

import { useState } from "react";

import type { Testimonial } from "@/lib/content";
import { Container } from "./container";

/**
 * ⚠️ REAL TESTIMONIALS ONLY. `getTestimonials()` filters to documents with
 * `consentOnFile == true`; this component never fabricates or pads the list.
 *
 * Implemented as a tab-style slider rather than an auto-advancing carousel:
 * auto-advance moves content out from under people who read slowly and is a
 * WCAG 2.2.2 failure unless you add pause controls nobody uses.
 */
export function TestimonialSlider({
  testimonials,
}: {
  testimonials: readonly Testimonial[];
}) {
  const [index, setIndex] = useState(0);

  if (testimonials.length === 0) return null;

  const active = testimonials[index] ?? testimonials[0];
  if (!active) return null;

  return (
    <section className="bg-[var(--brand-primary-tint)] py-16">
      <Container>
        <h2 className="font-serif text-[31px] font-semibold">
          What clients say
        </h2>

        <figure className="mt-8 max-w-[62ch]">
          <blockquote className="font-serif text-[25px] leading-[1.45] text-[var(--brand-ink)]">
            &ldquo;{active.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-[16px] text-[var(--brand-muted)]">
            <span className="font-semibold text-[var(--brand-ink)]">
              {active.authorName}
            </span>
            {active.authorRole && <>, {active.authorRole}</>}
            {active.organization && <> · {active.organization}</>}
          </figcaption>
        </figure>

        {testimonials.length > 1 && (
          <div className="mt-8 flex gap-2" role="tablist" aria-label="Testimonials">
            {testimonials.map((t, i) => (
              <button
                key={t._id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Testimonial ${i + 1} of ${testimonials.length}`}
                onClick={() => setIndex(i)}
                className={
                  i === index
                    ? "h-2.5 w-8 rounded-full bg-[var(--brand-primary)]"
                    : "h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]/30"
                }
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
