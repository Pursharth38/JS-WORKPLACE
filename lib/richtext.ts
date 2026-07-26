// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M1b — the rich-text contract.
//
// Content bodies are stored as Tiptap JSON documents, NOT HTML. This module is
// the single definition of what a valid document is:
//
//   · The Zod schema below is the WRITE-side gate. Every admin save parses the
//     editor's output through `parseRichText` before it touches Postgres. It is
//     `.strict()` at every level — an unknown node type, an unknown attr, or a
//     disallowed link protocol is a rejected save, not a stored payload.
//   · The READ side (components/marketing/rich-text.tsx) maps node types to
//     React components. Because storage is structured data and rendering is
//     React, there is no dangerouslySetInnerHTML anywhere and therefore no XSS
//     surface for a sanitizer to guard. That is the amendment logged in the
//     DECISIONS LOG (2026-07-26) against CMS-MIGRATION-PLAN.md §5.2.
//
// The vocabulary is deliberately exactly what the site's existing content uses
// (see sanity/schemas/post.ts + objects.ts): paragraphs, h2–h4, blockquote,
// bullet/ordered lists, images, hard breaks, callout boxes, data tables; marks
// bold/italic/link. Adding a node type is a schema change HERE first, then the
// renderer, then the editor — in that order.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from "zod";

/* ── Link safety ──────────────────────────────────────────────────────────── */

/**
 * Same protocol allowlist the Sanity schema enforced: http, https, mailto,
 * tel, and app-relative (`/...` or `#...`). Everything else — javascript:,
 * data:, vbscript:, protocol-relative `//` — is rejected at save time.
 */
export function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (trimmed === "") return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  return /^(https?:\/\/|mailto:|tel:)/i.test(trimmed);
}

const safeHref = z
  .string()
  .max(2000)
  .refine(isSafeHref, { message: "Unsupported link destination" });

/* ── Marks ────────────────────────────────────────────────────────────────── */

const boldMark = z.object({ type: z.literal("bold") }).strict();
const italicMark = z.object({ type: z.literal("italic") }).strict();
const linkMark = z
  .object({
    type: z.literal("link"),
    attrs: z
      .object({
        href: safeHref,
        // Tiptap's link extension adds these; accepted but normalized at render
        // (the renderer applies its own fixed target/rel policy regardless).
        target: z.string().nullish(),
        rel: z.string().nullish(),
        class: z.string().nullish(),
        title: z.string().nullish(),
      })
      .strict(),
  })
  .strict();

const mark = z.discriminatedUnion("type", [boldMark, italicMark, linkMark]);

/* ── Inline nodes ─────────────────────────────────────────────────────────── */

const textNode = z
  .object({
    type: z.literal("text"),
    text: z.string().min(1),
    marks: z.array(mark).max(5).optional(),
  })
  .strict();

const hardBreakNode = z.object({ type: z.literal("hardBreak") }).strict();

const inlineNode = z.union([textNode, hardBreakNode]);

/* ── Block nodes ──────────────────────────────────────────────────────────── */

const paragraphNode = z
  .object({
    type: z.literal("paragraph"),
    content: z.array(inlineNode).optional(), // empty paragraph = blank line
  })
  .strict();

const headingNode = z
  .object({
    type: z.literal("heading"),
    // h1 is the page title's alone — content headings start at h2, same rule
    // the Sanity block styles enforced.
    attrs: z.object({ level: z.union([z.literal(2), z.literal(3), z.literal(4)]) }).strict(),
    content: z.array(inlineNode).optional(),
  })
  .strict();

const imageNode = z
  .object({
    type: z.literal("image"),
    attrs: z
      .object({
        // App-relative image URL (`/api/images/<r2-key>`) or an https URL
        // during the coexistence window (Sanity CDN). Never data: URIs — a
        // 5 MB base64 blob inside a Json column is a database, not an image.
        src: safeHref,
        alt: z.string().max(500).nullish(),
        title: z.string().max(500).nullish(),
      })
      .strict(),
  })
  .strict();

type BlockNodeInput =
  | z.infer<typeof paragraphNode>
  | z.infer<typeof headingNode>
  | z.infer<typeof imageNode>
  | { type: "blockquote"; content: BlockNodeInput[] }
  | { type: "bulletList"; content: ListItemInput[] }
  | {
      type: "orderedList";
      content: ListItemInput[];
      attrs?: { start: number; type?: string | null };
    }
  | {
      type: "calloutBox";
      attrs: { tone: "info" | "warning" | "legal"; title?: string | null };
      content: BlockNodeInput[];
    }
  | {
      type: "dataTable";
      attrs: { caption?: string | null; headers: string[]; rows: string[][] };
    };

type ListItemInput = { type: "listItem"; content: BlockNodeInput[] };

const blockNode: z.ZodType<BlockNodeInput> = z.lazy(() =>
  z.union([
    paragraphNode,
    headingNode,
    imageNode,
    z
      .object({
        type: z.literal("blockquote"),
        content: z.array(blockNode).min(1).max(50),
      })
      .strict(),
    z
      .object({
        type: z.literal("bulletList"),
        content: z.array(listItemNode).min(1).max(200),
      })
      .strict(),
    z
      .object({
        type: z.literal("orderedList"),
        content: z.array(listItemNode).min(1).max(200),
        // Tiptap v3 emits { start, type: null } — `type` is the HTML list
        // numbering style attr, presentational and safe.
        attrs: z
          .object({
            start: z.number().int().min(1),
            type: z.string().nullish(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("calloutBox"),
        attrs: z
          .object({
            tone: z.enum(["info", "warning", "legal"]),
            title: z.string().max(200).nullish(),
          })
          .strict(),
        content: z.array(blockNode).min(1).max(50),
      })
      .strict(),
    z
      .object({
        type: z.literal("dataTable"),
        attrs: z
          .object({
            caption: z.string().max(500).nullish(),
            headers: z.array(z.string().max(500)).min(1).max(12),
            rows: z.array(z.array(z.string().max(2000)).max(12)).max(200),
          })
          .strict(),
      })
      .strict(),
  ]),
);

const listItemNode: z.ZodType<ListItemInput> = z.lazy(() =>
  z
    .object({
      type: z.literal("listItem"),
      content: z.array(blockNode).min(1).max(20),
    })
    .strict(),
);

/* ── Document ─────────────────────────────────────────────────────────────── */

export const richTextSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(blockNode).max(2000),
  })
  .strict();

export type RichTextDoc = z.infer<typeof richTextSchema>;
export type RichTextBlock = BlockNodeInput;
export type RichTextInline = z.infer<typeof inlineNode>;
export type RichTextMark = z.infer<typeof mark>;

export const EMPTY_DOC: RichTextDoc = { type: "doc", content: [] };

/**
 * The write gate. Throws ZodError on anything outside the vocabulary — admin
 * actions catch it and return "Invalid content", never store the payload.
 */
export function parseRichText(input: unknown): RichTextDoc {
  return richTextSchema.parse(input);
}

export function safeParseRichText(input: unknown): RichTextDoc | null {
  const res = richTextSchema.safeParse(input);
  return res.success ? res.data : null;
}

/* ── Derivations ──────────────────────────────────────────────────────────── */

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[]; attrs?: Record<string, unknown> };
  if (n.type === "text") return n.text ?? "";
  if (n.type === "hardBreak") return "\n";
  if (n.type === "dataTable") {
    const attrs = n.attrs as { headers?: string[]; rows?: string[][] } | undefined;
    return [...(attrs?.headers ?? []), ...(attrs?.rows ?? []).flat()].join(" ");
  }
  const inner = (n.content ?? []).map(nodeText).join("");
  // Block-level nodes separate with newlines so words don't concatenate.
  return inner + "\n";
}

/** Plain text of a document — feeds reading time, search, and excerpt fallback. */
export function richTextToPlainText(doc: RichTextDoc | null | undefined): string {
  if (!doc) return "";
  return doc.content.map(nodeText).join("").replace(/\n{2,}/g, "\n").trim();
}

/** ~200 wpm, minimum 1 minute — same convention as lib/reading-time.ts. */
export function richTextReadingMinutes(doc: RichTextDoc | null | undefined): number {
  const words = richTextToPlainText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function isEmptyDoc(doc: RichTextDoc | null | undefined): boolean {
  if (!doc || doc.content.length === 0) return true;
  return richTextToPlainText(doc) === "";
}
