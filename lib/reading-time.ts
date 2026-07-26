import type { PortableTextBlock } from "@portabletext/react";

import { isTiptapDoc, richTextToPlainText, type RichBody } from "@/lib/richtext";

/** Average adult reading speed for non-fiction prose. */
const WORDS_PER_MINUTE = 225;

/**
 * Estimates reading time from either body format (CMS migration M2 — Portable
 * Text from Sanity or a Tiptap doc from Postgres).
 *
 * Only counts prose text — images, tables and callouts are skipped rather than
 * counted as zero-length, because a post that is mostly a compliance table
 * should not claim to be a one-minute read.
 */
export function readingTimeMinutes(blocks: RichBody | undefined): number {
  if (!blocks) return 1;

  if (isTiptapDoc(blocks)) {
    const words = richTextToPlainText(blocks).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  if (blocks.length === 0) return 1;

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
