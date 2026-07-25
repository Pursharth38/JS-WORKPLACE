import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { CourseCard } from "@/components/marketing/course-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { getCourses } from "@/lib/sanity";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Self-paced POSH awareness training. Work through it at your own pace and finish with a Certificate of Completion.",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <Container className="py-14">
      <h1 className="font-serif text-[39px] font-semibold">Courses</h1>
      <p className="mt-4 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
        Self-paced training you can take at your own speed. Each course ends with
        a final test and a Certificate of Completion that anyone can verify.
      </p>

      {courses.length > 0 ? (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c._id}>
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
          Courses are being prepared. If you need training for a team in the
          meantime, we run live sessions —{" "}
          <Link
            href="/services"
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            see what we offer
          </Link>
          .
        </p>
      )}

      <CtaBand
        heading="Training a whole team?"
        body="Live sessions are usually a better fit than individual enrolments once you are past a handful of people."
        buttonLabel="Talk to us"
        buttonHref="/book-demo"
      />
    </Container>
  );
}
