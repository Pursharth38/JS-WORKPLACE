import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared label / description / error scaffolding for every form control.
 *
 * The error is `role="alert"` + `aria-live="polite"` so a screen reader
 * announces a validation failure without the user having to hunt for it
 * (DETAILED-PLAN §4.6). Controls wire to it via `aria-describedby`.
 */
export function Field({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string | undefined;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="block text-[15px] font-semibold text-[var(--brand-ink)]"
      >
        {label}
        {required && (
          <span
            className="ml-1 text-[var(--brand-danger)]"
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      {description && (
        <p id={`${id}-desc`} className="text-[14px] text-[var(--brand-muted)]">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="text-[14px] font-medium text-[var(--brand-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Builds the aria-describedby value from whichever helpers are present. */
export function describedBy(
  id: string,
  hasDescription: boolean,
  hasError: boolean,
): string | undefined {
  const ids = [
    hasDescription ? `${id}-desc` : null,
    hasError ? `${id}-error` : null,
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export const CONTROL_BASE =
  "w-full rounded-[var(--radius-md)] border bg-[var(--brand-elevated)] px-3.5 py-2.5 " +
  "text-[16px] text-[var(--brand-ink)] placeholder:text-[var(--brand-muted)]/70 " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--brand-focus)] disabled:opacity-60";
