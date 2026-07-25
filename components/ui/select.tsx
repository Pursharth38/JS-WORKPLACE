import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_BASE, describedBy, Field } from "./field";

export type SelectOption = { value: string; label: string };

export function Select({
  id,
  label,
  description,
  error,
  options,
  placeholder,
  className,
  required,
  ...props
}: {
  id: string;
  label: string;
  description?: string;
  error?: string | undefined;
  options: readonly SelectOption[];
  placeholder?: string;
} & Omit<ComponentProps<"select">, "id" | "children">) {
  return (
    <Field
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <select
        id={id}
        name={props.name ?? id}
        required={required}
        defaultValue={props.defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, !!description, !!error)}
        className={cn(
          CONTROL_BASE,
          "appearance-none bg-[length:16px] bg-[right_0.875rem_center] bg-no-repeat pr-10",
          error
            ? "border-[var(--brand-danger)]"
            : "border-[var(--brand-line)] focus:border-[var(--brand-primary)]",
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23475467' stroke-width='1.6'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
