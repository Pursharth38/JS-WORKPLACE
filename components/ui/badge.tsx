import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-[var(--brand-line)] text-[var(--brand-ink)]",
  primary: "bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]",
  success: "bg-[var(--brand-success-soft)] text-[var(--brand-success)]",
  warning: "bg-[var(--brand-warning-soft)] text-[var(--brand-warning)]",
  danger: "bg-[var(--brand-danger-soft)] text-[var(--brand-danger)]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
