"use client";

import { useEffect, useState } from "react";

/**
 * Thin progress bar showing how far through a long article you are.
 *
 * `aria-hidden` — it is decoration. A screen-reader user gets no value from a
 * percentage that changes on every scroll tick, and announcing it would be
 * actively hostile.
 */
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let frame = 0;

    function update() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const next =
        scrollable > 0
          ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))
          : 0;
      setPercent(next);
      frame = 0;
    }

    function onScroll() {
      // rAF-coalesced: scroll fires far more often than we can usefully paint.
      if (frame === 0) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent"
    >
      <div
        className="h-full bg-[var(--brand-accent)] transition-[width] duration-75"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
