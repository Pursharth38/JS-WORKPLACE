import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]",
  // Amber fills carry an INK label, never white — white-on-amber is 3.29:1 and
  // fails AA. See design/colour-boards/CONTRAST-REPORT.md Finding 2.
  accent:
    "bg-[var(--brand-accent)] text-[var(--brand-accent-on)] hover:bg-[var(--brand-accent-hover)] hover:text-white",
  outline:
    "border border-[var(--brand-primary)] text-[var(--brand-primary)] bg-transparent hover:bg-[var(--brand-primary-tint)]",
  ghost:
    "text-[var(--brand-primary)] bg-transparent hover:bg-[var(--brand-primary-tint)]",
  danger: "bg-[var(--brand-danger)] text-white hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[14px]",
  md: "h-11 px-5 text-[16px]",
  lg: "h-13 px-7 text-[18px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold " +
  "transition-colors duration-150 disabled:opacity-55 disabled:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-focus)]";

/**
 * `accent` is forced to `lg`. Amber on Sand only clears 4.5:1 at ≥18px, so a
 * small amber button is an accessibility failure by construction. Making it
 * unrepresentable is better than documenting it and hoping.
 */
function resolveSize(variant: Variant, size: Size): Size {
  return variant === "accent" ? "lg" : size;
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: CommonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[resolveSize(variant, size)],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Same visual language as Button, but renders an anchor. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  href,
  ...props
}: CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[resolveSize(variant, size)],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
