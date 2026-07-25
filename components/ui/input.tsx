import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_BASE, describedBy, Field } from "./field";

type Shared = {
  id: string;
  label: string;
  description?: string;
  error?: string | undefined;
};

export function Input({
  id,
  label,
  description,
  error,
  className,
  required,
  ...props
}: Shared & Omit<ComponentProps<"input">, "id">) {
  return (
    <Field
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <input
        id={id}
        name={props.name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!description, !!error)}
        className={cn(
          CONTROL_BASE,
          error
            ? "border-[var(--brand-danger)]"
            : "border-[var(--brand-line)] focus:border-[var(--brand-primary)]",
          className,
        )}
        {...props}
      />
    </Field>
  );
}

export function Textarea({
  id,
  label,
  description,
  error,
  className,
  required,
  rows = 5,
  ...props
}: Shared & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <Field
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <textarea
        id={id}
        name={props.name ?? id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!description, !!error)}
        className={cn(
          CONTROL_BASE,
          "resize-y",
          error
            ? "border-[var(--brand-danger)]"
            : "border-[var(--brand-line)] focus:border-[var(--brand-primary)]",
          className,
        )}
        {...props}
      />
    </Field>
  );
}

/**
 * The honeypot. A real user never sees it; a bot fills every field it finds.
 * `/api/leads` returns 200 and silently discards when this arrives non-empty.
 *
 * Hidden with off-screen positioning rather than `display:none` — some bots
 * skip `display:none` fields specifically because they know it is a trap.
 */
export function Honeypot() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden"
    >
      <label htmlFor="website">Website (leave blank)</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
