import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Filled variants (primary/accent/danger) glow via `box-shadow` — a soft
  // blur of the fill's own colour, no spread, so it reads as ambient light
  // rather than a hard outline. Outline/ghost have no fill to glow, so their
  // hover is a `text-shadow` on the label instead — "the words glow."
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] hover:shadow-[0_0_18px_var(--brand-primary)]",
  // Accent fills carry an accent-on label, NEVER a hardcoded white — accent is
  // theme-aware (brighter gold in dark mode) and white-on-gold fails AA at any
  // brightness. This includes the HOVER state: the old palette's darker amber
  // hover made `hover:text-white` safe, but --brand-accent-hover is also
  // theme-aware now, so the label must stay accent-on on hover too.
  accent:
    "bg-[var(--brand-accent)] text-[var(--brand-accent-on)] hover:bg-[var(--brand-accent-hover)] hover:shadow-[0_0_20px_var(--brand-accent)]",
  outline:
    "border border-[var(--brand-primary)] text-[var(--brand-primary)] bg-transparent hover:bg-[var(--brand-primary-tint)] hover:[text-shadow:0_0_12px_var(--brand-primary)]",
  ghost:
    "text-[var(--brand-primary)] bg-transparent hover:bg-[var(--brand-primary-tint)] hover:[text-shadow:0_0_12px_var(--brand-primary)]",
  // --brand-danger is also theme-aware (brighter red in dark mode, for text-
  // on-navy readability), so its button-fill label needs the same accent-on
  // treatment rather than a hardcoded white.
  danger:
    "bg-[var(--brand-danger)] text-[var(--brand-danger-on)] hover:brightness-110 hover:shadow-[0_0_18px_var(--brand-danger)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[14px]",
  md: "h-11 px-5 text-[16px]",
  lg: "h-13 px-7 text-[18px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold " +
  "transition-[color,background-color,border-color,box-shadow,text-shadow] duration-150 " +
  "disabled:opacity-55 disabled:pointer-events-none disabled:shadow-none " +
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
}: CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
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
