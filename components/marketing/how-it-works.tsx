"use client";

import { Award, ClipboardCheck, CreditCard, PlayCircle } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { Container } from "./container";

/**
 * "How it works" — the sequential connection-diagram section: steps pop in
 * one after another along a connector rail, each with its own explanation.
 * Same house rules as components/motion/index.ts: real DOM text throughout
 * (no canvas/JSON render path), `useReducedMotion` swaps every animated value
 * for its resting state, and the rail's continuous shimmer is decoration on
 * top of content that's already fully readable without it.
 */

type Step = {
  icon: typeof CreditCard;
  title: string;
  detail: string;
};

const STEPS: Step[] = [
  {
    icon: CreditCard,
    title: "Enrol",
    detail: "Pay once via Razorpay — instant access, no subscription.",
  },
  {
    icon: PlayCircle,
    title: "Watch each module",
    detail: "Sequential unlock. Resume exactly where you left off.",
  },
  {
    icon: ClipboardCheck,
    title: "Pass the assessment",
    detail: "Chapter quizzes from a randomised pool, unlimited retries.",
  },
  {
    icon: Award,
    title: "Get certified",
    detail: "A Certificate of Completion anyone can verify online.",
  },
];

const STEP_DELAY = 0.35;

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const animate = inView && !reduced;
  const railDoneDelay = (STEPS.length - 1) * STEP_DELAY + 0.4;

  return (
    <section className="bg-[var(--brand-elevated)] py-20">
      <Container>
        <div className="mx-auto max-w-[62ch] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
            How it works
          </p>
          <h2 className="mt-3 font-serif text-[31px] font-semibold md:text-[39px]">
            From sign-up to certificate
          </h2>
          <p className="mt-4 text-[17px] leading-[1.7] text-[var(--brand-muted)]">
            Four steps, entirely self-paced — no cohort to wait for, no
            deadline to miss.
          </p>
        </div>

        <div ref={ref} className="relative mt-16">
          {/* Desktop rail: a horizontal line behind the icon row, revealing
              left-to-right, then shimmering continuously once fully drawn. */}
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px overflow-hidden bg-[var(--brand-line)] md:block"
          >
            <motion.span
              className="block h-full w-full origin-left bg-[var(--brand-primary)]"
              initial={{ scaleX: 0 }}
              animate={animate ? { scaleX: 1 } : { scaleX: reduced ? 1 : 0 }}
              transition={{
                delay: STEP_DELAY * 0.5,
                duration: railDoneDelay,
                ease: "linear",
              }}
            />
            {!reduced && (
              <motion.span
                className="absolute inset-y-0 w-1/4"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--brand-accent), transparent)",
                }}
                initial={{ x: "-100%", opacity: 0 }}
                animate={
                  inView
                    ? {
                        x: ["-100%", "400%"],
                        opacity: [0, 1, 1, 0],
                      }
                    : { x: "-100%", opacity: 0 }
                }
                transition={{
                  delay: railDoneDelay + 0.3,
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>

          <ol className="relative grid gap-8 md:grid-cols-4 md:gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex flex-col items-center text-center">
                  <motion.span
                    aria-hidden="true"
                    className="relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--brand-primary)] bg-[var(--brand-elevated)] text-[var(--brand-primary)]"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={
                      animate
                        ? { scale: 1, opacity: 1 }
                        : { scale: reduced ? 1 : 0.5, opacity: reduced ? 1 : 0 }
                    }
                    transition={{
                      delay: i * STEP_DELAY,
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </motion.span>

                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={
                      animate
                        ? { opacity: 1, y: 0 }
                        : { opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }
                    }
                    transition={{
                      delay: i * STEP_DELAY + 0.15,
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <p className="font-serif text-[17px] font-semibold text-[var(--brand-ink)]">
                      {i + 1}. {step.title}
                    </p>
                    <p className="mt-1.5 max-w-[24ch] text-[14px] leading-[1.55] text-[var(--brand-muted)]">
                      {step.detail}
                    </p>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
