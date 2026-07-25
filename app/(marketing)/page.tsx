import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { CourseCard } from "@/components/marketing/course-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { Hero } from "@/components/marketing/hero";
import { PostCard } from "@/components/marketing/post-card";
import { ServiceCard } from "@/components/marketing/service-card";
import { TestimonialSlider } from "@/components/marketing/testimonial-slider";
import {
  getCourses,
  getPosts,
  getServices,
  getSiteSettings,
  getTestimonials,
} from "@/lib/sanity";

// ISR. The homepage is content-driven but changes rarely; the Sanity webhook
// revalidates on publish, so this is a backstop rather than the mechanism.
export const revalidate = 3600;

export default async function HomePage() {
  const [settings, services, posts, courses, testimonials] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getPosts(3),
    getCourses(),
    getTestimonials(),
  ]);

  return (
    <>
      <Hero
        eyebrow="POSH Act 2013 · India"
        heading={
          settings.heroHeading ||
          "Workplace training that stands up to scrutiny."
        }
        subheading={
          settings.heroSubheading ||
          "Awareness sessions, Internal Committee training, policy drafting and compliance support for organisations that want to get this right."
        }
        primaryCta={{
          label: settings.heroPrimaryCtaLabel || "Book a consultation",
          href: settings.heroPrimaryCtaHref || "/book-demo",
        }}
        secondaryCta={{ label: "Read the POSH Act guide", href: "/posh-act" }}
      />

      {/*
        NOTE: no StatBand here. CLAUDE.md forbids inventing trained-employee
        counts or client logos, and the client has not supplied real figures yet
        (P0-04). The component exists and takes props — wire it up the day she
        provides numbers, not before.
      */}

      {/* ── Knowledge Hub teaser — the SEO asset, promoted above the fold-ish */}
      <Container className="py-16">
        <div className="rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-8 md:p-10">
          <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
            Free resource
          </p>
          <h2 className="mt-3 max-w-[24ch] font-serif text-[31px] font-semibold">
            A plain-English guide to the POSH Act
          </h2>
          <p className="mt-4 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
            What the law requires of an employer, how an Internal Committee is
            constituted, who can complain, and what the timelines actually are —
            written to be read by people who are not lawyers.
          </p>
          <Link
            href="/posh-act"
            className="mt-6 inline-flex items-center gap-1.5 text-[17px] font-semibold text-[var(--brand-primary)]"
          >
            Read the guide
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </Container>

      {services.length > 0 && (
        <Container className="pb-16">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-serif text-[31px] font-semibold">
              How we can help
            </h2>
            <Link
              href="/services"
              className="shrink-0 text-[16px] font-semibold text-[var(--brand-primary)]"
            >
              All services
            </Link>
          </div>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s) => (
              <li key={s._id}>
                <ServiceCard service={s} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      {courses.length > 0 && (
        <Container className="pb-16">
          <h2 className="font-serif text-[31px] font-semibold">
            Self-paced training
          </h2>
          <p className="mt-3 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
            Work through the material at your own pace and finish with a
            Certificate of Completion.
          </p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <li key={c._id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      <TestimonialSlider testimonials={testimonials} />

      {posts.length > 0 && (
        <Container className="py-16">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-serif text-[31px] font-semibold">
              From the blog
            </h2>
            <Link
              href="/blog"
              className="shrink-0 text-[16px] font-semibold text-[var(--brand-primary)]"
            >
              All posts
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p._id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container>
        <CtaBand
          heading="Not sure where your organisation stands?"
          body="Answer eight questions and get a plain-English summary of the gaps worth looking at first."
          buttonLabel="Take the self-check"
          buttonHref="/posh-compliance-check"
        />
      </Container>
    </>
  );
}
