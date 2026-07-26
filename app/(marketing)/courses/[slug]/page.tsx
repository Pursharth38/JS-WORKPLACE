import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import { Container } from "@/components/marketing/container";
import { formatPrice } from "@/components/marketing/course-card";
import { ProseBlock } from "@/components/marketing/prose-block";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { isEnrolled } from "@/lib/enrollment";
import { getCourseBySlug } from "@/lib/content";
import { getSession } from "@/lib/session";
import Link from "next/link";

// Session-dependent (enrolled state, checkout), so this cannot be static.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found" };

  return {
    title: course.seoTitle || course.title,
    description: course.seoDescription || course.summary,
  };
}

/**
 * Course sales page (P3 / P7-02 wiring).
 *
 * ⚠️ PRICE COMES FROM POSTGRES, NOT SANITY. The `Course` row is the only price
 * authority — `/api/checkout/create-order` reads it by `courseId` and ignores
 * anything the browser sends. Sanity's `priceInPaise` is mirrored into that row
 * by the publish webhook, but if the two ever disagree the database wins, so
 * this page displays the database figure. Showing the Sanity number would mean
 * advertising one price and charging another.
 *
 * ⚠️ The syllabus lists titles and durations only. No `videoUid` is fetched at
 * any depth — see the note on getCourseBySlug().
 */
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [course, session] = await Promise.all([
    getCourseBySlug(slug),
    getSession(),
  ]);

  if (!course) notFound();

  // The structural mirror. Without this row there is nothing to buy, because
  // checkout keys off the Postgres id.
  const dbCourse = await db.course.findUnique({
    where: { slug },
    select: { id: true, priceInPaise: true, isPublished: true },
  });

  const enrolled =
    session && dbCourse ? await isEnrolled(session.userId, dbCourse.id) : false;

  const purchasable = Boolean(dbCourse?.isPublished);
  const price = dbCourse?.priceInPaise ?? course.priceInPaise;

  const faqItems: AccordionItem[] = (course.faqs ?? []).map((f, i) => ({
    id: `course-faq-${i}`,
    question: f.question,
    answer: <p className="text-[17px] leading-[1.7]">{f.answer}</p>,
  }));

  return (
    <Container className="py-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-16">
        <div className="max-w-[68ch]">
          <h1 className="font-serif text-[39px] font-semibold leading-[1.15]">
            {course.title}
          </h1>
          <p className="mt-4 text-[19px] leading-[1.6] text-[var(--brand-muted)]">
            {course.summary}
          </p>

          <ProseBlock value={course.description} className="mt-8" />

          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-[25px] font-semibold">
                What you will be able to do
              </h2>
              <ul className="mt-4 space-y-2.5">
                {course.learningOutcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-[17px] leading-[1.6]">
                    <span
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-[var(--brand-success)]"
                    >
                      ✓
                    </span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.chapters && course.chapters.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-[25px] font-semibold">Syllabus</h2>
              <ol className="mt-5 space-y-6">
                {course.chapters.map((chapter) => (
                  <li key={chapter._id}>
                    <h3 className="font-serif text-[20px] font-semibold">
                      {chapter.order}. {chapter.title}
                    </h3>
                    {chapter.summary && (
                      <p className="mt-1 text-[16px] leading-[1.6] text-[var(--brand-muted)]">
                        {chapter.summary}
                      </p>
                    )}
                    <ul className="mt-3 divide-y divide-[var(--brand-line)] rounded-[var(--radius-md)] border border-[var(--brand-line)]">
                      {chapter.modules.map((m) => (
                        <li
                          key={m._id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <span className="text-[16px]">{m.title}</span>
                          <span className="flex shrink-0 items-center gap-3">
                            {m.isFreePreview && (
                              <Badge tone="success">Free preview</Badge>
                            )}
                            <span
                              data-numeric
                              className="text-[14px] text-[var(--brand-muted)]"
                            >
                              {Math.max(1, Math.round(m.durationSeconds / 60))} min
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {faqItems.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-[25px] font-semibold">
                Questions about this course
              </h2>
              <Accordion items={faqItems} className="mt-4" />
            </section>
          )}
        </div>

        {/* Purchase rail */}
        <aside className="lg:sticky lg:top-[96px]">
          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6">
            <p
              data-numeric
              className="font-serif text-[39px] font-semibold text-[var(--brand-primary)]"
            >
              {formatPrice(price)}
            </p>
            {course.durationMinutes ? (
              <p className="mt-1 text-[15px] text-[var(--brand-muted)]">
                About {Math.round(course.durationMinutes / 60)} hours of material
              </p>
            ) : null}

            <div className="mt-5">
              {purchasable && dbCourse ? (
                <CheckoutButton
                  courseId={dbCourse.id}
                  courseSlug={slug}
                  courseTitle={course.title}
                  priceInPaise={dbCourse.priceInPaise}
                  isEnrolled={enrolled}
                  isSignedIn={Boolean(session)}
                />
              ) : (
                <p className="rounded-[var(--radius-md)] bg-[var(--brand-surface)] p-4 text-[15px] leading-[1.6] text-[var(--brand-muted)]">
                  This course is not open for enrolment yet.{" "}
                  <Link
                    href="/contact"
                    className="text-[var(--brand-primary)] underline underline-offset-2"
                  >
                    Ask to be told when it is
                  </Link>
                  .
                </p>
              )}
            </div>

            <ul className="mt-6 space-y-2 border-t border-[var(--brand-line)] pt-5 text-[15px] leading-[1.6] text-[var(--brand-muted)]">
              <li>Work through it at your own pace</li>
              <li>Chapter assessments and a final test</li>
              <li>Certificate of Completion, publicly verifiable</li>
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
