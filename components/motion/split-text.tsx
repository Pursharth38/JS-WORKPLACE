"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";

/**
 * Word-by-word reveal for headings.
 *
 * Splits on WORDS, not characters. Character-splitting looks impressive on a
 * marketing site and is hostile on this one: it shatters the heading into
 * hundreds of nodes, and some screen readers announce each fragment separately.
 * Words keep the reveal effect while staying readable.
 *
 * The whole string is also exposed via `aria-label` with the animated spans
 * hidden, so assistive tech gets one clean heading regardless.
 */
export function SplitText({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  step = 0.05,
  duration = 0.6,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  delay?: number;
  step?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();

  const words = useMemo(() => text.split(" "), [text]);

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={className}
      aria-label={text}
    >
      <span aria-hidden="true">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block whitespace-pre"
            initial={{ opacity: 0, y: "0.4em", filter: "blur(4px)" }}
            animate={
              inView
                ? { opacity: 1, y: "0em", filter: "blur(0px)" }
                : { opacity: 0, y: "0.4em", filter: "blur(4px)" }
            }
            transition={{
              delay: delay + i * step,
              duration,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </span>
    </Tag>
  );
}
