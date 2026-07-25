"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog. Deliberately hand-rolled rather than <dialog>, because
 * Safari's <dialog> focus behaviour is still inconsistent and the lead-magnet
 * modal is a conversion path we cannot afford to have half-work.
 *
 * Handles: Escape to close · focus trap · focus restore on close · body scroll
 * lock · backdrop click. Focus moves to the panel on open so a screen reader
 * announces the dialog rather than leaving the user in the page behind it.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreTo.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(16,24,40,0.55)] p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--brand-elevated)] p-6 shadow-[var(--shadow-lg)] focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-serif text-[25px] font-semibold text-[var(--brand-ink)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--brand-muted)] hover:bg-[var(--brand-surface)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {description && (
          <p
            id={descId}
            className="mt-2 text-[16px] leading-relaxed text-[var(--brand-muted)]"
          >
            {description}
          </p>
        )}

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
