import Link from "next/link";

import type { ServiceSummary } from "@/lib/sanity";
import { Card } from "@/components/ui/card";
import { BorderBeam } from "@/components/motion/border-beam";

export function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <BorderBeam className="h-full">
      <Card className="group relative h-full transition-transform duration-200 hover:-translate-y-0.5">
        <div className="p-6">
          {service.icon && (
            <span
              aria-hidden="true"
              className="mb-3 inline-flex text-[24px] leading-none"
            >
              {service.icon}
            </span>
          )}

          <h3 className="font-serif text-[20px] font-semibold">
            {/* Whole-card link target: the anchor covers the card via ::after so
                the entire tile is clickable without nesting interactive elements. */}
            <Link
              href={`/services/${service.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {service.title}
            </Link>
          </h3>

          <p className="mt-2 text-[16px] leading-[1.6] text-[var(--brand-muted)]">
            {service.summary}
          </p>

          <span className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-[var(--brand-primary)]">
            Learn more
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </Card>
    </BorderBeam>
  );
}
