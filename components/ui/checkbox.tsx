import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * NOTE ON `defaultChecked`: it is deliberately NOT exposed with a truthy
 * default anywhere in this codebase. Under the DPDP Act a consent checkbox
 * must render UNTICKED and be an affirmative action by the user. A pre-ticked
 * consent box is not consent. See ConsentCheckbox below.
 */
export function Checkbox({
  id,
  label,
  description,
  error,
  className,
  ...props
}: {
  id: string;
  label: ReactNode;
  description?: string;
  error?: string | undefined;
} & Omit<ComponentProps<"input">, "id" | "type" | "children">) {
  const describedByIds = [
    description ? `${id}-desc` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={props.name ?? id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={
            describedByIds.length > 0 ? describedByIds.join(" ") : undefined
          }
          className={cn(
            "mt-1 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[4px] border",
            "accent-[var(--brand-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-focus)]",
            error ? "border-[var(--brand-danger)]" : "border-[var(--brand-line)]",
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-[15px] leading-relaxed text-[var(--brand-ink)]"
        >
          {label}
        </label>
      </div>

      {description && (
        <p
          id={`${id}-desc`}
          className="pl-[30px] text-[14px] text-[var(--brand-muted)]"
        >
          {description}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="pl-[30px] text-[14px] font-medium text-[var(--brand-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The DPDP consent control. Every lead form on this site must use this and not
 * a bare Checkbox, so the wording and the unticked default live in exactly one
 * place. `required` is on: the server rejects `consentGiven: false` with a 400,
 * and this stops the round trip.
 *
 * There is no `defaultChecked` prop by design — it cannot be pre-ticked.
 */
export function ConsentCheckbox({
  id = "consentGiven",
  error,
}: {
  id?: string;
  error?: string | undefined;
}) {
  return (
    <Checkbox
      id={id}
      name={id}
      required
      error={error}
      label={
        <>
          I agree to JS Workplace Wellness storing the details I have submitted
          so they can respond to my enquiry.
        </>
      }
      description="We will not share your details with anyone else. You can ask us to delete them at any time."
    />
  );
}
