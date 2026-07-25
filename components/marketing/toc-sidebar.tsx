"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

export type TocGroup = {
  group: string;
  items: { anchor: string; title: string }[];
};

/**
 * Sticky table of contents with scroll-spy, collapsible on mobile.
 *
 * Scroll-spy uses IntersectionObserver with a top-weighted rootMargin rather
 * than scroll maths: it fires only when a heading crosses the band just under
 * the sticky header, which is what "the section I am reading" actually means.
 *
 * Anchors here are permanent shared URLs — see the warning on the `anchor`
 * field in sanity/schemas/poshSection.ts. Never rename one without a redirect.
 */
export function TocSidebar({ groups }: { groups: readonly TocGroup[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ids = groups.flatMap((g) => g.items.map((i) => i.anchor));
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the topmost heading currently inside the band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const first = visible[0];
        if (first) setActiveId(first.target.id);
      },
      // Band sits just below the 72px sticky header.
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [groups]);

  const list = (
    <nav aria-label="On this page">
      {groups.map((g) => (
        <div key={g.group} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
            {g.group}
          </p>
          <ul className="mt-2 space-y-0.5 border-l border-[var(--brand-line)]">
            {g.items.map((item) => (
              <li key={item.anchor}>
                <a
                  href={`#${item.anchor}`}
                  aria-current={activeId === item.anchor ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "-ml-px block border-l-2 py-1.5 pl-3 text-[15px] leading-snug transition-colors",
                    activeId === item.anchor
                      ? "border-[var(--brand-primary)] font-semibold text-[var(--brand-primary)]"
                      : "border-transparent text-[var(--brand-muted)] hover:text-[var(--brand-ink)]",
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile: collapsible */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="toc-mobile"
          className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-4 py-3 text-[16px] font-semibold"
        >
          On this page
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            className={cn("transition-transform", open && "rotate-180")}
          >
            <path
              d="M4 6.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div
          id="toc-mobile"
          hidden={!open}
          className="mt-3 max-h-[60vh] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-4"
        >
          {list}
        </div>
      </div>

      {/* Desktop: sticky rail */}
      <div className="hidden lg:block">
        <div className="sticky top-[96px] max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          {list}
        </div>
      </div>
    </>
  );
}
