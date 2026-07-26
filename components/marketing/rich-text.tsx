// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M1b — the read-side twin of lib/richtext.ts.
//
// Server component. Renders a stored Tiptap document as React, mapping the
// custom node types onto the SAME components ProseBlock uses for Portable Text
// (CalloutBox, DataTable) so a page whose content migrated from Sanity is
// pixel-identical to one that hasn't. Typography is copied from ProseBlock
// verbatim — if a size changes there it must change here, and vice versa,
// until ProseBlock retires at cutover.
//
// There is deliberately no dangerouslySetInnerHTML in this file. Structured
// data in, React elements out.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";

import { cn } from "@/lib/cn";
import {
  safeParseRichText,
  type RichTextBlock,
  type RichTextDoc,
  type RichTextInline,
} from "@/lib/richtext";
import { CalloutBox } from "./callout-box";
import { DataTable } from "./data-table";

/* ── Inline rendering ─────────────────────────────────────────────────────── */

function renderInline(node: RichTextInline, key: number): React.ReactNode {
  if (node.type === "hardBreak") return <br key={key} />;

  let el: React.ReactNode = node.text;

  // Marks nest inside-out; order is stable so hydration cannot mismatch.
  for (const m of node.marks ?? []) {
    if (m.type === "bold") {
      el = <strong className="font-semibold">{el}</strong>;
    } else if (m.type === "italic") {
      el = <em>{el}</em>;
    } else if (m.type === "link") {
      const href = m.attrs.href;
      const isInternal = href.startsWith("/") || href.startsWith("#");
      el = isInternal ? (
        <Link
          href={href}
          className="font-medium text-[var(--brand-primary)] underline decoration-[var(--brand-primary)]/40 underline-offset-2 hover:decoration-[var(--brand-primary)]"
        >
          {el}
        </Link>
      ) : (
        // External links get a fixed rel — whatever the editor stored is
        // normalized away, same policy ProseBlock applies.
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--brand-primary)] underline decoration-[var(--brand-primary)]/40 underline-offset-2 hover:decoration-[var(--brand-primary)]"
        >
          {el}
        </a>
      );
    }
  }

  return <span key={key}>{el}</span>;
}

function inlines(content: RichTextInline[] | undefined): React.ReactNode {
  return (content ?? []).map(renderInline);
}

/* ── Block rendering ──────────────────────────────────────────────────────── */

function renderBlock(node: RichTextBlock, key: number): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="mt-5 text-[17px] leading-[1.7] text-[var(--brand-ink)]">
          {inlines(node.content)}
        </p>
      );

    case "heading": {
      const level = node.attrs.level;
      const cls =
        level === 2
          ? "mt-12 font-serif text-[31px] font-semibold"
          : level === 3
            ? "mt-9 font-serif text-[25px] font-semibold"
            : "mt-7 font-serif text-[20px] font-semibold";
      const Tag = `h${level}` as "h2" | "h3" | "h4";
      return (
        <Tag key={key} className={cls}>
          {inlines(node.content)}
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="mt-6 border-l-4 border-[var(--brand-primary)] bg-[var(--brand-primary-tint)] py-3 pl-5 pr-4 text-[17px] italic leading-[1.7] [&>p]:mt-2 [&>p:first-child]:mt-0"
        >
          {node.content.map(renderBlock)}
        </blockquote>
      );

    case "bulletList":
      return (
        <ul key={key} className="mt-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.7]">
          {node.content.map((li, i) => (
            <li key={i} className="[&>p]:mt-0 [&>p+p]:mt-2">
              {li.content.map(renderBlock)}
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={key}
          start={node.attrs?.start}
          className="mt-5 list-decimal space-y-2 pl-6 text-[17px] leading-[1.7]"
        >
          {node.content.map((li, i) => (
            <li key={i} className="[&>p]:mt-0 [&>p+p]:mt-2">
              {li.content.map(renderBlock)}
            </li>
          ))}
        </ol>
      );

    case "image": {
      const alt = node.attrs.alt ?? "";
      return (
        <figure key={key} className="mt-7">
          {/* Plain <img>, matching ProseBlock — body images are variable-size
              editorial content; next/image's layout demands don't fit here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={alt} src={node.attrs.src} className="w-full rounded-[var(--radius-lg)]" />
          {alt && (
            <figcaption className="mt-2 text-[14px] text-[var(--brand-muted)]">{alt}</figcaption>
          )}
        </figure>
      );
    }

    case "calloutBox":
      return (
        <CalloutBox key={key} tone={node.attrs.tone} title={node.attrs.title ?? undefined}>
          {node.content.map(renderBlock)}
        </CalloutBox>
      );

    case "dataTable":
      return (
        <DataTable
          key={key}
          caption={node.attrs.caption ?? undefined}
          headers={node.attrs.headers}
          rows={node.attrs.rows.map((cells) => ({ cells }))}
        />
      );
  }
}

/* ── Entry point ──────────────────────────────────────────────────────────── */

/**
 * `value` is `unknown` on purpose: it arrives straight from a Prisma `Json`
 * column, and this component re-validates rather than trusting the database.
 * A row edited outside the admin (manual SQL, a buggy import) renders as
 * nothing, not as a crash — same degrade-to-empty posture as sanityFetch.
 */
export function RichText({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const doc: RichTextDoc | null =
    value && typeof value === "object" ? safeParseRichText(value) : null;

  if (!doc || doc.content.length === 0) return null;

  return (
    <div className={cn("[&>*:first-child]:mt-0", className)}>
      {doc.content.map(renderBlock)}
    </div>
  );
}
