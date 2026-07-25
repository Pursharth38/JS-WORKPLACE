"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Scroll-reveal: fades, lifts and un-blurs an element as it enters the viewport.
 *
 * Pattern adapted from the BoltClaw reference repo, with one change that matters
 * here: `useReducedMotion` short-circuits to a plain render. DETAILED-PLAN §4.6
 * requires `prefers-reduced-motion` be honoured, and on a site about workplace
 * wellbeing, motion that ignores that setting is a bad look as well as a bug.
 *
 * `once: true` — content must never re-animate on scroll-back. On a long legal
 * guide that would be actively distracting.
 */
export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.5,
  offset = 12,
  direction = "up",
  blur = "6px",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  blur?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const sign = direction === "right" || direction === "down" ? -offset : offset;

  return (
    <motion.div
      ref={ref}
      initial={{ [axis]: sign, opacity: 0, filter: `blur(${blur})` }}
      animate={
        inView
          ? { [axis]: 0, opacity: 1, filter: "blur(0px)" }
          : { [axis]: sign, opacity: 0, filter: `blur(${blur})` }
      }
      transition={{ delay: 0.04 + delay, duration, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggers BlurFade across a list of children. Saves threading an incrementing
 * `delay` through every call site, which is where stagger bugs come from.
 */
export function BlurFadeStagger({
  children,
  className,
  step = 0.08,
  initialDelay = 0,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  initialDelay?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <BlurFade key={i} delay={initialDelay + i * step}>
          {child}
        </BlurFade>
      ))}
    </div>
  );
}
