import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  as: Tag = "h3",
  className,
  children,
  ...props
}: ComponentProps<"h3"> & { as?: "h2" | "h3" | "h4"; children: ReactNode }) {
  return (
    <Tag
      className={cn("font-serif text-[20px] font-semibold", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
