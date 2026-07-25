"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type AccordionItem = {
  id?: string;
  question: string;
  answer: ReactNode;
};

/**
 * Native <button> + aria-expanded rather than <details>/<summary>: <summary>
 * cannot be styled consistently across browsers and its open state is not
 * controllable, which the FAQ page needs for deep-linking to a question.
 *
 * `allowMultiple` defaults true — on an FAQ, collapsing the answer someone is
 * reading because they opened another one is hostile.
 */
export function Accordion({
  items,
  allowMultiple = true,
  className,
}: {
  items: readonly AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());

  function toggle(index: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!allowMultiple) next.clear();
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div
      className={cn(
        "divide-y divide-[var(--brand-line)] rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]",
        className,
      )}
    >
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const panelId = item.id ? `${item.id}-panel` : `${uid}-panel-${i}`;
        const buttonId = item.id ? `${item.id}-button` : `${uid}-button-${i}`;

        return (
          <div key={item.id ?? i} id={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-serif text-[19px] font-semibold text-[var(--brand-ink)]">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 shrink-0 text-[var(--brand-primary)] transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 3v12M3 9h12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 text-[17px] leading-[1.7] text-[var(--brand-muted)]"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
