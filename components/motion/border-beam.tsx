"use client";

import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * A slow-rotating gradient "beam" traveling around a card's border — the
 * ambient glow effect requested for the marketing cards. Pure CSS: a
 * conic-gradient on an oversized, absolutely-positioned layer behind the
 * content, rotating continuously; the content layer sits on top with its own
 * background, so only a thin ring of the gradient shows through around the
 * edge (no `mask`/`clip-path` needed, so it stays broadly compatible).
 *
 * `prefers-reduced-motion` swaps the spin for a static gradient ring — still
 * visually distinct, no motion. Never fully hidden: the beam is decoration on
 * top of real content, not a loading state, so there's nothing wrong with a
 * user seeing it as a still ring instead of an animation.
 */
export function BorderBeam({
  children,
  className,
  radius = "var(--radius-lg)",
  duration = 6,
  colorFrom = "var(--brand-accent)",
  colorTo = "var(--brand-primary)",
}: {
  children: ReactNode;
  className?: string;
  /** Must match the wrapped card's own border-radius, so the beam ring and
   *  the card corners line up. Defaults to the design system's card radius. */
  radius?: string;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className={`group relative isolate ${className ?? ""}`}
      style={{ borderRadius: radius }}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-px overflow-hidden rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-70"
      >
        <div
          className="absolute inset-[-150%]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${colorFrom} 8%, ${colorTo} 16%, transparent 28%)`,
            animation: reduced
              ? undefined
              : `border-beam-spin ${duration}s linear infinite`,
          }}
        />
      </div>
      <div className="relative z-[1] h-full rounded-[inherit] bg-[var(--brand-elevated)]">
        {children}
      </div>
    </div>
  );
}
