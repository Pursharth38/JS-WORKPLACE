import type { PortableTextBlock } from "@portabletext/react";

/** Average adult reading speed for non-fiction prose. */
const WORDS_PER_MINUTE = 225;

/**
 * Estimates reading time from Portable Text.
 *
 * Only counts `block` children with text — images, tables and callouts are
 * skipped rather than counted as zero-length, because a post that is mostly a
 * compliance table should not claim to be a one-minute read.
 */
export function readingTimeMinutes(
  blocks: PortableTextBlock[] | undefined,
): number {
  if (!blocks || blocks.length === 0) return 1;

  let words = 0;

  for (const block of blocks) {
    if (block._type !== "block") continue;
    const children = (block as { children?: Array<{ text?: string }> }).children;
    if (!children) continue;
    for (const child of children) {
      if (typeof child.text === "string" && child.text.length > 0) {
        words += child.text.trim().split(/\s+/).filter(Boolean).length;
      }
    }
  }

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
