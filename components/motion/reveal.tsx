"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * A drawn-line accent that wipes in beneath a heading, plus a soft rise for the
 * block underneath. Used to give section headers a sense of arrival without
 * animating the text itself.
 */
export function Reveal({
  children,
  className,
  accent = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className}>
        {accent && (
          <span className="mb-4 block h-[3px] w-14 rounded-full bg-[var(--brand-accent)]" />
        )}
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      {accent && (
        <motion.span
          aria-hidden="true"
          className="mb-4 block h-[3px] origin-left rounded-full bg-[var(--brand-accent)]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "3.5rem" }}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ delay: delay + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
