import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";

import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "legal";

const TONES: Record<Tone, { wrap: string; label: string }> = {
  info: {
    wrap: "border-[var(--brand-primary)] bg-[var(--brand-primary-tint)]",
    label: "Good to know",
  },
  warning: {
    wrap: "border-[var(--brand-warning)] bg-[var(--brand-warning-soft)]",
    label: "Important",
  },
  legal: {
    wrap: "border-[var(--brand-muted)] bg-[var(--brand-line)]",
    label: "Legal note",
  },
};

export function CalloutBox({
  tone = "info",
  title,
  body,
}: {
  tone?: Tone;
  title?: string;
  body: PortableTextBlock[];
}) {
  const style = TONES[tone] ?? TONES.info;

  return (
    <aside
      className={cn(
        "mt-7 rounded-[var(--radius-md)] border-l-4 p-5",
        style.wrap,
      )}
    >
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
        {title || style.label}
      </p>
      <div className="mt-2 text-[16px] leading-[1.65] [&>p]:mt-2 [&>p:first-child]:mt-0">
        <PortableText value={body} />
      </div>
    </aside>
  );
}
