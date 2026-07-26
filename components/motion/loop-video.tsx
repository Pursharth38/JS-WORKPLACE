"use client";

import { useReducedMotion } from "motion/react";

/**
 * Autoplaying, looping, muted background video — decorative only, per this
 * folder's house rules (index.ts): `prefers-reduced-motion` short-circuits to
 * a static poster `<img>` rather than a paused `<video>` (rule 1 — no
 * animation, not reduced animation), and if the video fails to load the
 * poster is still a complete frame, not a blank box (rule 4). No captions
 * track is provided because there is no spoken or essential audio content —
 * the source clips are muted motion graphics.
 */
export function LoopVideo({
  src,
  poster,
  alt,
  className,
}: {
  src: string;
  poster: string;
  alt: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={poster} alt={alt} className={className} />
    );
  }

  return (
    <video
      className={className}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={alt}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
