import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { CourseSummary } from "@/lib/sanity";

/**
 * Prices are stored in paise and rendered in rupees. The DATABASE is the price
 * authority for checkout — this is display only, and `/api/checkout/create-order`
 * never trusts a number that came from the browser.
 */
export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Card className="group relative flex h-full flex-col transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-[22px] font-semibold">
          <Link
            href={`/courses/${course.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {course.title}
          </Link>
        </h3>

        <p className="mt-2 flex-1 text-[16px] leading-[1.6] text-[var(--brand-muted)]">
          {course.summary}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4">
          <p
            data-numeric
            className="font-serif text-[25px] font-semibold text-[var(--brand-primary)]"
          >
            {formatPrice(course.priceInPaise)}
          </p>
          {course.durationMinutes ? (
            <p className="text-[14px] text-[var(--brand-muted)]">
              {Math.round(course.durationMinutes / 60)} hours
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
