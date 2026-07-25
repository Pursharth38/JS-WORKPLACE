"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { label: string; content: ReactNode };

/**
 * WAI-ARIA tabs with roving tabindex: only the active tab is in the tab order,
 * and Arrow/Home/End move between them. Tabbing straight into the panel is the
 * expected behaviour for keyboard users and is what axe-core checks for.
 */
export function Tabs({
  items,
  className,
}: {
  items: readonly TabItem[];
  className?: string;
}) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number) {
    const clamped = (index + items.length) % items.length;
    setActive(clamped);
    tabRefs.current[clamped]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTab(0);
        break;
      case "End":
        e.preventDefault();
        focusTab(items.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-[var(--brand-line)]"
      >
        {items.map((item, i) => (
          <button
            key={item.label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${uid}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-[16px] font-semibold transition-colors",
              active === i
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--brand-muted)] hover:text-[var(--brand-ink)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.map((item, i) => (
        <div
          key={item.label}
          role="tabpanel"
          id={`${uid}-panel-${i}`}
          aria-labelledby={`${uid}-tab-${i}`}
          hidden={active !== i}
          tabIndex={0}
          className="pt-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-focus)]"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
