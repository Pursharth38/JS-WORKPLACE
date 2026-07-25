"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/**
 * "The complaint journey" — the explainer from DETAILED-PLAN §4.4, animation B,
 * flagged there as the highest-value of the three because the timeline is what
 * people actually search for.
 *
 * BUILT WITH MOTION, NOT LOTTIE. The plan assumed a Lottie file from After
 * Effects (P11-02, Dev C). Doing it in DOM + motion instead is better here for
 * three reasons that matter more than fidelity:
 *   · the text is real DOM, so it is indexable and readable by a screen reader —
 *     the plan's own requirement (§4.4) that every animation have a static HTML
 *     equivalent is satisfied by construction, not bolted on underneath
 *   · no 150 KB JSON payload, no external asset to go missing
 *   · the client can have the steps changed without a designer round-trip
 *
 * ⚠️ THE DAY COUNTS ARE FROM DETAILED-PLAN §4.4 AND MUST BE CLIENT-VERIFIED
 * BEFORE LAUNCH. They are stated in the project spec, not invented here, but
 * this component puts statutory-looking numbers on screen and Jyoti is the one
 * whose name is on them. Once Sanity content lands these should move into a
 * `poshSection` or a dedicated document so she can correct them herself.
 */

export type JourneyStep = {
  label: string;
  detail: string;
  duration?: string;
};

const DEFAULT_STEPS: JourneyStep[] = [
  {
    label: "Complaint made",
    detail: "A written complaint reaches the Internal Committee.",
  },
  {
    label: "Committee acts",
    detail: "The IC begins the process and notifies the respondent.",
    duration: "within 7 days",
  },
  {
    label: "Response",
    detail: "The respondent files their reply.",
    duration: "within 10 days",
  },
  {
    label: "Inquiry",
    detail: "The committee hears both sides and examines evidence.",
    duration: "within 90 days",
  },
  {
    label: "Report",
    detail: "Findings go to the employer.",
    duration: "within 10 days",
  },
  {
    label: "Action",
    detail: "The employer acts on the recommendations.",
    duration: "within 60 days",
  },
];

export function ComplaintJourney({
  steps = DEFAULT_STEPS,
  className,
}: {
  steps?: JourneyStep[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <div ref={ref} className={className}>
      <ol className="relative space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;

          return (
            <li key={step.label} className="relative flex gap-5 pb-8 last:pb-0">
              {/* Connector rail — draws downward as the sequence advances. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-[2px] overflow-hidden bg-[var(--brand-line)]"
                >
                  <motion.span
                    className="block h-full w-full origin-top bg-[var(--brand-primary)]"
                    initial={{ scaleY: 0 }}
                    animate={animate ? { scaleY: 1 } : { scaleY: reduced ? 1 : 0 }}
                    transition={{
                      delay: 0.25 + i * 0.35,
                      duration: 0.4,
                      ease: "easeInOut",
                    }}
                  />
                </span>
              )}

              {/* Node */}
              <motion.span
                aria-hidden="true"
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--brand-primary)] bg-[var(--brand-surface)] text-[13px] font-semibold text-[var(--brand-primary)]"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={
                  animate
                    ? { scale: 1, opacity: 1 }
                    : { scale: reduced ? 1 : 0.6, opacity: reduced ? 1 : 0 }
                }
                transition={{
                  delay: i * 0.35,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {i + 1}
              </motion.span>

              <motion.div
                className="pt-0.5"
                initial={{ opacity: 0, x: -8 }}
                animate={
                  animate
                    ? { opacity: 1, x: 0 }
                    : { opacity: reduced ? 1 : 0, x: reduced ? 0 : -8 }
                }
                transition={{
                  delay: 0.1 + i * 0.35,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-serif text-[20px] font-semibold text-[var(--brand-ink)]">
                    {step.label}
                  </span>
                  {step.duration && (
                    <span
                      data-numeric
                      className="rounded-full bg-[var(--brand-primary-tint)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--brand-primary)]"
                    >
                      {step.duration}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[16px] leading-[1.6] text-[var(--brand-muted)]">
                  {step.detail}
                </p>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
