import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "./container";

export function Hero({
  eyebrow,
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  aside,
}: {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  aside?: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--brand-line)] bg-[var(--brand-primary-tint)]">
      <Container className="grid gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          {eyebrow && (
            <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-3 font-serif text-[39px] font-semibold leading-[1.15] md:text-[49px]">
            {heading}
          </h1>

          {subheading && (
            <p className="mt-5 max-w-[58ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
              {subheading}
            </p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta && (
                <ButtonLink href={primaryCta.href} size="lg">
                  {primaryCta.label}
                </ButtonLink>
              )}
              {secondaryCta && (
                <ButtonLink
                  href={secondaryCta.href}
                  variant="outline"
                  size="lg"
                >
                  {secondaryCta.label}
                </ButtonLink>
              )}
            </div>
          )}
        </div>

        {aside && <div>{aside}</div>}
      </Container>
    </section>
  );
}
