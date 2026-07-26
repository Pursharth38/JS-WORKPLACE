// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M1b — Portable Text → Tiptap JSON converter.
//
// Used by the one-time migration script (M6) and by nothing at runtime. The
// output is passed through `parseRichText` by the caller, so anything this
// produces still has to clear the same write gate as the admin editor —
// the converter cannot smuggle in a node the schema would reject.
//
// Unknown block types are NOT silently dropped: they are collected into
// `warnings` so the dry run prints exactly what would be lost, per the plan's
// "row count / spot-check step" requirement.
// ─────────────────────────────────────────────────────────────────────────────
import type { RichTextBlock, RichTextDoc, RichTextInline, RichTextMark } from "@/lib/richtext";
import { isSafeHref } from "@/lib/richtext";

/* ── Portable Text input shapes (loose — this is external data) ───────────── */

type PtSpan = { _type?: string; text?: string; marks?: string[] };
type PtMarkDef = { _key?: string; _type?: string; href?: string };
type PtBlock = {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  children?: PtSpan[];
  markDefs?: PtMarkDef[];
  // calloutBox
  tone?: string;
  title?: string;
  body?: PtBlock[];
  // dataTable
  caption?: string;
  headers?: string[];
  rows?: { cells?: string[] }[];
  // image
  asset?: { _ref?: string; url?: string };
  alt?: string;
};

export type ConversionResult = {
  doc: RichTextDoc;
  /** Human-readable notes about anything that could not be carried across. */
  warnings: string[];
};

/**
 * Resolves a Sanity image to the src the Tiptap image node should store.
 * The migration script passes a resolver that has already uploaded the asset
 * to R2; returning null drops the image WITH a warning.
 */
export type ImageResolver = (ref: string) => string | null;

/* ── Inline conversion ────────────────────────────────────────────────────── */

function spanToInline(
  span: PtSpan,
  markDefs: PtMarkDef[],
  warnings: string[],
): RichTextInline | null {
  const text = span.text ?? "";
  if (text === "") return null; // schema requires min 1 char; empty spans are PT noise

  const marks: RichTextMark[] = [];
  for (const m of span.marks ?? []) {
    if (m === "strong") marks.push({ type: "bold" });
    else if (m === "em") marks.push({ type: "italic" });
    else {
      const def = markDefs.find((d) => d._key === m);
      if (def?._type === "link" && typeof def.href === "string") {
        if (isSafeHref(def.href)) {
          marks.push({ type: "link", attrs: { href: def.href } });
        } else {
          warnings.push(`link dropped (unsafe href): ${def.href}`);
        }
      } else {
        warnings.push(`unknown mark "${m}" dropped on text "${text.slice(0, 40)}"`);
      }
    }
  }

  return marks.length > 0 ? { type: "text", text, marks } : { type: "text", text };
}

function blockChildren(block: PtBlock, warnings: string[]): RichTextInline[] {
  return (block.children ?? [])
    .map((s) => spanToInline(s, block.markDefs ?? [], warnings))
    .filter((n): n is RichTextInline => n !== null);
}

/* ── Block conversion ─────────────────────────────────────────────────────── */

function styledBlock(block: PtBlock, warnings: string[]): RichTextBlock | null {
  const content = blockChildren(block, warnings);
  const style = block.style ?? "normal";

  if (style === "h2" || style === "h3" || style === "h4") {
    return {
      type: "heading",
      attrs: { level: Number(style[1]) as 2 | 3 | 4 },
      content,
    };
  }
  if (style === "blockquote") {
    return { type: "blockquote", content: [{ type: "paragraph", content }] };
  }
  if (style !== "normal") warnings.push(`unknown block style "${style}" treated as paragraph`);
  return { type: "paragraph", content };
}

type ListAccumulator = {
  kind: "bullet" | "number";
  items: { type: "listItem"; content: RichTextBlock[] }[];
};

/**
 * Converts a Portable Text array to a Tiptap document.
 *
 * List handling: PT marks list membership per-block (`listItem` + `level`);
 * Tiptap nests real list nodes. Consecutive same-kind list blocks group into
 * one list. Nesting levels flatten to level 1 with a warning — the site's
 * seed content has no nested lists, and a flattened list is readable while a
 * mis-nested one is corrupt.
 */
export function portableTextToTiptap(
  blocks: unknown,
  resolveImage: ImageResolver = () => null,
): ConversionResult {
  const warnings: string[] = [];
  const out: RichTextBlock[] = [];
  let list: ListAccumulator | null = null;

  const flushList = () => {
    if (!list) return;
    out.push(
      list.kind === "bullet"
        ? { type: "bulletList", content: list.items }
        : { type: "orderedList", content: list.items },
    );
    list = null;
  };

  if (!Array.isArray(blocks)) {
    if (blocks != null) warnings.push("body was not an array — treated as empty");
    return { doc: { type: "doc", content: [] }, warnings };
  }

  for (const raw of blocks as PtBlock[]) {
    const type = raw?._type;

    if (type === "block") {
      if (raw.listItem === "bullet" || raw.listItem === "number") {
        if ((raw.level ?? 1) > 1) {
          warnings.push(`nested list (level ${raw.level}) flattened to level 1`);
        }
        const kind = raw.listItem;
        const para: RichTextBlock = { type: "paragraph", content: blockChildren(raw, warnings) };
        if (!list || list.kind !== kind) {
          flushList();
          list = { kind, items: [] };
        }
        list.items.push({ type: "listItem", content: [para] });
        continue;
      }

      flushList();
      const node = styledBlock(raw, warnings);
      if (node) out.push(node);
      continue;
    }

    flushList();

    if (type === "calloutBox") {
      const inner = portableTextToTiptap(raw.body ?? [], resolveImage);
      warnings.push(...inner.warnings);
      const tone = raw.tone === "warning" || raw.tone === "legal" ? raw.tone : "info";
      if (inner.doc.content.length > 0) {
        out.push({
          type: "calloutBox",
          attrs: { tone, title: raw.title ?? null },
          content: inner.doc.content,
        });
      } else {
        warnings.push(`calloutBox "${raw.title ?? "untitled"}" had no convertible body — dropped`);
      }
      continue;
    }

    if (type === "dataTable") {
      const headers = (raw.headers ?? []).filter((h): h is string => typeof h === "string");
      if (headers.length === 0) {
        warnings.push(`dataTable "${raw.caption ?? "uncaptioned"}" had no headers — dropped`);
        continue;
      }
      out.push({
        type: "dataTable",
        attrs: {
          caption: raw.caption ?? null,
          headers,
          rows: (raw.rows ?? []).map((r) => (r.cells ?? []).map((c) => String(c ?? ""))),
        },
      });
      continue;
    }

    if (type === "image") {
      const ref = raw.asset?._ref;
      const src = ref ? resolveImage(ref) : (raw.asset?.url ?? null);
      if (src && isSafeHref(src)) {
        out.push({ type: "image", attrs: { src, alt: raw.alt ?? null } });
      } else {
        warnings.push(`image ${ref ?? "(no ref)"} could not be resolved — dropped`);
      }
      continue;
    }

    warnings.push(`unknown block type "${type ?? "undefined"}" dropped`);
  }

  flushList();
  return { doc: { type: "doc", content: out }, warnings };
}
