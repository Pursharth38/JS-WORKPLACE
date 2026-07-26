"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { SplitText } from "@/components/motion/split-text";
import { Container } from "./container";

/**
 * Hero.
 *
 * The heading animates word-by-word via SplitText, which exposes the full string
 * through `aria-label` — the reveal is decoration and never gates the text.
 *
 * The right column previously had nothing in it, which left half the fold empty.
 * It now takes an `aside` and the home page passes a real panel into it.
 */
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
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[var(--brand-line)] bg-[var(--brand-primary-tint)]">
      {/* Soft depth wash — slow orbiting drift via the shared `orbit-drift`
          keyframe (globals.css). No JS reduced-motion check needed: the
          global `@media (prefers-reduced-motion: reduce)` rule already
          collapses every CSS animation's duration to near-zero, so this
          freezes automatically for anyone who asked for less motion.
          Purely decorative, pointer-events off. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[var(--brand-primary)] opacity-[0.06] blur-3xl"
        style={{ animation: "orbit-drift 18s ease-in-out infinite" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -left-32 h-[420px] w-[420px] rounded-full bg-[var(--brand-accent)] opacity-[0.07] blur-3xl"
        style={{ animation: "orbit-drift 22s ease-in-out infinite reverse" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[18%] top-1/3 hidden h-[220px] w-[220px] rounded-full bg-[var(--brand-primary)] opacity-[0.05] blur-2xl md:block"
        style={{ animation: "orbit-drift 14s ease-in-out infinite" }}
      />

      <Container className="relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          {eyebrow && (
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]"
            >
              {eyebrow}
            </motion.p>
          )}

          <SplitText
            as="h1"
            text={heading}
            className="mt-4 font-serif text-[39px] font-semibold leading-[1.12] md:text-[49px]"
            step={0.045}
            duration={0.65}
          />

          {subheading && (
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 max-w-[56ch] text-[19px] leading-[1.65] text-[var(--brand-muted)]"
            >
              {subheading}
            </motion.p>
          )}

          {(primaryCta || secondaryCta) && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.48,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-9 flex flex-wrap gap-3"
            >
              {primaryCta && (
                <ButtonLink href={primaryCta.href} size="lg">
                  {primaryCta.label}
                </ButtonLink>
              )}
              {secondaryCta && (
                <ButtonLink href={secondaryCta.href} variant="outline" size="lg">
                  {secondaryCta.label}
                </ButtonLink>
              )}
            </motion.div>
          )}
        </div>

        {aside && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {aside}
          </motion.div>
        )}
      </Container>
    </section>
  );
}
