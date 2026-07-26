"use client";

import {
  CircleAlert,
  Hand,
  ImageOff,
  MessageSquare,
  MessageSquareWarning,
  Scale,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { Container } from "./container";

/**
 * Phase 11, Animation A — "what counts as harassment" (DETAILED-PLAN §4.4).
 *
 * BUILT WITH MOTION, NOT LOTTIE. Same call as components/marketing/
 * complaint-journey.tsx (Animation B), extended here for consistency: real DOM
 * text is indexable and screen-reader-readable by construction, satisfying the
 * "static accessible equivalent" requirement without a second render path, and
 * there is no After Effects pipeline on this team for anyone to hand a JSON
 * file to. See complaint-journey.tsx's header comment for the full reasoning
 * and orchestrate/tasks.md DECISIONS LOG for the record of this choice.
 *
 * Content is the five acts listed in the POSH Act, 2013, Section 2(n) — quoted
 * in paraphrase, not copied from any competitor site. This list illustrates,
 * it does not replace, the fuller treatment on /posh-act.
 */

type Behaviour = {
  icon: typeof Hand;
  label: string;
  detail: string;
};

const BEHAVIOURS: Behaviour[] = [
  {
    icon: Hand,
    label: "Physical contact and advances",
    detail: "Any unwelcome physical contact, not just the obvious kind.",
  },
  {
    icon: MessageSquareWarning,
    label: "A demand or request for sexual favours",
    detail: "Explicit or implied — including as a condition of work.",
  },
  {
    icon: MessageSquare,
    label: "Sexually coloured remarks",
    detail: "Comments, jokes, or messages of a sexual nature.",
  },
  {
    icon: ImageOff,
    label: "Showing pornography",
    detail: "In person, on a screen, or shared over chat.",
  },
  {
    icon: CircleAlert,
    label: "Other unwelcome conduct of a sexual nature",
    detail: "Physical, verbal, or non-verbal — the list above isn't exhaustive.",
  },
];

export function HarassmentSpectrum() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <section className="bg-[var(--brand-elevated)] py-20">
      <Container>
        <div className="mx-auto max-w-[62ch] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
            The legal definition
          </p>
          <h2 className="mt-3 font-serif text-[31px] font-semibold md:text-[39px]">
            What the law actually calls harassment
          </h2>
          <p className="mt-4 text-[17px] leading-[1.7] text-[var(--brand-muted)]">
            The Act does not require physical contact to have occurred. Any one
            of these, unwelcome, is enough to meet the definition.
          </p>
        </div>

        <div ref={ref} className="mt-12">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BEHAVIOURS.map((b, i) => {
              const Icon = b.icon;
              return (
                <li key={b.label}>
                  <motion.div
                    className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-surface)] p-5"
                    initial={{ opacity: 0, y: 16 }}
                    animate={
                      animate
                        ? { opacity: 1, y: 0 }
                        : { opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }
                    }
                    transition={{
                      delay: i * 0.09,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]"
                    >
                      <Icon size={19} strokeWidth={2} />
                    </span>
                    <p className="font-serif text-[16px] font-semibold leading-snug text-[var(--brand-ink)]">
                      {b.label}
                    </p>
                    <p className="text-[14px] leading-[1.55] text-[var(--brand-muted)]">
                      {b.detail}
                    </p>
                  </motion.div>
                </li>
              );
            })}
          </ol>

          {/* Convergence arrow — purely decorative; the citation below carries the meaning. */}
          <div
            aria-hidden="true"
            className="mx-auto flex h-10 w-px items-center justify-center"
          >
            <motion.span
              className="block h-full w-px origin-top bg-[var(--brand-line)]"
              initial={{ scaleY: 0 }}
              animate={animate ? { scaleY: 1 } : { scaleY: reduced ? 1 : 0 }}
              transition={{ delay: 0.55, duration: 0.35, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            className="mx-auto flex max-w-[46ch] items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--brand-primary)] px-6 py-5 text-white"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={
              animate
                ? { opacity: 1, scale: 1 }
                : { opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.94 }
            }
            transition={{ delay: 0.65, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15"
            >
              <Scale size={20} strokeWidth={2} />
            </span>
            <p className="text-[15px] leading-[1.5]">
              <span className="font-serif text-[17px] font-semibold">
                Sexual harassment,
              </span>{" "}
              as defined under Section 2(n) of the POSH Act, 2013.
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
