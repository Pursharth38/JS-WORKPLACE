import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page gutter. `max-w-7xl · px-4 md:px-8` per DETAILED-PLAN §4.3.
 *
 * `measure` narrows to 68ch for long-form reading (Knowledge Hub, blog posts) —
 * line length is the single biggest readability lever on a text-heavy site.
 */
export function Container({
  as: Tag = "div",
  measure = false,
  className,
  children,
}: {
  as?: ElementType;
  measure?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 md:px-8",
        measure ? "max-w-[68ch]" : "max-w-7xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
