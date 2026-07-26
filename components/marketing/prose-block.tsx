import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { isTiptapDoc, type RichBody } from "@/lib/richtext";
import { CalloutBox } from "./callout-box";
import { DataTable } from "./data-table";
import { RichText } from "./rich-text";

/**
 * Renders Sanity Portable Text.
 *
 * Typography is set here rather than with a prose plugin so the measure, line
 * height and heading faces match the design tokens exactly. Body is 17px/1.7
 * per DETAILED-PLAN §4.2.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-5 text-[17px] leading-[1.7] text-[var(--brand-ink)]">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-12 font-serif text-[31px] font-semibold">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-9 font-serif text-[25px] font-semibold">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-7 font-serif text-[20px] font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-4 border-[var(--brand-primary)] bg-[var(--brand-primary-tint)] py-3 pl-5 pr-4 text-[17px] italic leading-[1.7]">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.7]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-2 pl-6 text-[17px] leading-[1.7]">
        {children}
      </ol>
    ),
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    link: ({ value, children }) => {
      const href = (value as { href?: string } | undefined)?.href ?? "#";
      const isInternal = href.startsWith("/");

      if (isInternal) {
        return (
          <Link
            href={href}
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            {children}
          </Link>
        );
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--brand-primary)] underline underline-offset-2"
        >
          {children}
        </a>
      );
    },
  },

  types: {
    calloutBox: ({ value }) => (
      <CalloutBox
        tone={value.tone}
        title={value.title}
        body={value.body as PortableTextBlock[]}
      />
    ),
    dataTable: ({ value }) => (
      <DataTable
        caption={value.caption}
        headers={value.headers ?? []}
        rows={value.rows ?? []}
      />
    ),
    image: ({ value }) => {
      const alt = (value as { alt?: string }).alt ?? "";
      return (
        <figure className="mt-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={alt}
            src={value.asset?.url ?? ""}
            className="w-full rounded-[var(--radius-lg)]"
          />
          {alt && (
            <figcaption className="mt-2 text-[14px] text-[var(--brand-muted)]">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

/**
 * The single rich-body entry point for every page.
 *
 * COEXISTENCE (CMS migration M2): accepts BOTH body formats — legacy Portable
 * Text arrays from Sanity and Tiptap docs from Postgres — and dispatches to
 * the matching renderer. Pages pass whatever the content getter returned and
 * never know which system a row came from. At cutover this collapses to a
 * thin wrapper over RichText.
 */
export function ProseBlock({
  value,
  className,
}: {
  value: RichBody | undefined | null;
  className?: string;
}) {
  if (!value) return null;

  if (isTiptapDoc(value)) {
    return <RichText value={value} className={className} />;
  }

  if (value.length === 0) return null;

  return (
    <div className={cn("[&>*:first-child]:mt-0", className)}>
      <PortableText value={value} components={components} />
    </div>
  );
}
