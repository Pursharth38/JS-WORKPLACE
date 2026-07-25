"use client";

import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Spring-animated number counter, triggered on scroll into view.
 *
 * The animated value is written straight to `textContent` rather than through
 * React state — sixty state updates a second would re-render the whole subtree.
 *
 * ⚠️ This component animates a number. It does not INVENT one. Every figure
 * passed to it must come from the client (CLAUDE.md: never invent
 * trained-employee counts). See StatBand.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.8,
  delay = 0,
  separator = ",",
  suffix = "",
  prefix = "",
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  separator?: string;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(from);
  const inView = useInView(ref, { once: true, margin: "0px" });

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const spring = useSpring(motionValue, { damping, stiffness });

  const format = useCallback(
    (n: number) => {
      const rounded = Math.round(n);
      const formatted = new Intl.NumberFormat("en-IN", {
        useGrouping: Boolean(separator),
      }).format(rounded);
      return `${prefix}${separator ? formatted.replace(/,/g, separator) : formatted}${suffix}`;
    },
    [separator, prefix, suffix],
  );

  // Reduced motion: render the final value immediately, no animation.
  useEffect(() => {
    if (ref.current && reduced) ref.current.textContent = format(to);
  }, [reduced, to, format]);

  useEffect(() => {
    if (reduced) return;
    if (ref.current) ref.current.textContent = format(from);
  }, [reduced, from, format]);

  useEffect(() => {
    if (reduced || !inView) return;
    const id = setTimeout(() => motionValue.set(to), delay * 1000);
    return () => clearTimeout(id);
  }, [reduced, inView, motionValue, to, delay]);

  useEffect(() => {
    if (reduced) return;
    return spring.on("change", (latest: number) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
  }, [reduced, spring, format]);

  return <span ref={ref} className={className} data-numeric />;
}
