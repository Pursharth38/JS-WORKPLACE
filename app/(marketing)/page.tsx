import Link from "next/link";

import { AboutIntro } from "@/components/marketing/about-intro";
import { BlurFade } from "@/components/motion/blur-fade";
import { BorderBeam } from "@/components/motion/border-beam";
import { LoopVideo } from "@/components/motion/loop-video";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { ComplaintJourney } from "@/components/marketing/complaint-journey";
import { ComplianceStatBand } from "@/components/marketing/compliance-stat-band";
import { Container } from "@/components/marketing/container";
import { CourseCard } from "@/components/marketing/course-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { HarassmentSpectrum } from "@/components/marketing/harassment-spectrum";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { InstaGrid } from "@/components/marketing/insta-grid";
import { PostCard } from "@/components/marketing/post-card";
import { ServiceCard } from "@/components/marketing/service-card";
import { StatBand } from "@/components/marketing/stat-band";
import { TestimonialSection } from "@/components/marketing/testimonial-section";
import { WorkplaceProtection } from "@/components/marketing/workplace-protection";
import { YouTubeLite } from "@/components/marketing/youtube-lite";
import { ABOUT_HEADING, ABOUT_PHOTO, aboutParagraphs } from "@/lib/about";
import { DEMO_ABOUT_PILLS, DEMO_STATS } from "@/lib/demo-content";
import {
  getCourses,
  getInstagramPosts,
  getPosts,
  getServices,
  getSiteSettings,
  getTestimonials,
  usingDemoContent,
} from "@/lib/content";
import { getLatestVideos } from "@/lib/youtube";

export const revalidate = 3600;

export default async function HomePage() {
  const [
    settings,
    services,
    posts,
    courses,
    testimonials,
    videos,
    instagramPosts,
  ] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getPosts(3),
    getCourses(),
    getTestimonials(),
    getLatestVideos(3),
    getInstagramPosts(),
  ]);

  /*
    Statistics.
    ⚠️ CLAUDE.md forbids inventing trained-employee counts. Real figures come
    from the client (P0-04). Until then the band shows visible `[00]`
    placeholders — and ONLY in demo mode, so a configured production site with
    no stats simply has no band rather than a row of brackets.
  */
  const stats = usingDemoContent ? DEMO_STATS : [];

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
        aside={
          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-7 shadow-[var(--shadow-lg)]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-muted)]">
              How a complaint actually moves
            </p>
            <p className="mt-2 text-[15px] leading-[1.6] text-[var(--brand-muted)]">
              The part most organisations discover too late.
            </p>
            <ComplaintJourney className="mt-6" />
          </div>
        }
      />

      {/* Straight after the hero, as in the design this section comes from —
          a trainer's practice sells on the trainer, and the portrait is the
          first thing that makes the page feel like a person rather than a
          compliance vendor. Copy and chips: lib/about.ts. */}
      <AboutIntro
        heading={ABOUT_HEADING}
        paragraphs={aboutParagraphs(settings.businessName)}
        photo={ABOUT_PHOTO}
        pills={usingDemoContent ? DEMO_ABOUT_PILLS : []}
        action={{ label: "More about how we work", href: "/about" }}
      />

      {/* ── Looping explainer videos — mirror the native <video autoplay loop
          muted playsinline> pattern, contained and framed as cards (not
          full-bleed) rather than stray clips, each with its own heading so
          the pair reads as two short explainers, not decoration. Same
          Card + BorderBeam wrapping as every other card on this page, for
          the same hover treatment. */}
      <Container className="py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          {[
            {
              src: "/videos/posh-compliance-loop.mp4",
              poster: "/videos/posh-compliance-loop-poster.jpg",
              heading: "How compliance comes together",
              body: "Awareness training, a properly constituted Internal Committee, and complete workplace protection — in one picture.",
              alt: "Animated overview of POSH compliance essentials: awareness training, a properly constituted Internal Committee, and complete workplace protection.",
            },
            {
              src: "/videos/role-based-courses-loop.mp4",
              poster: "/videos/role-based-courses-loop-poster.jpg",
              heading: "Training built for every role",
              body: "Employees, managers, and Internal Committee members each get a course track suited to what they actually need to know.",
              alt: "Animated overview of role-based POSH training tracks for employees, managers, and Internal Committee members.",
            },
          ].map((v, i) => (
            <BlurFade key={v.src} delay={i * 0.1}>
              <BorderBeam className="h-full">
                <Card className="group relative h-full p-5">
                  <h3 className="font-serif text-[20px] font-semibold">
                    {v.heading}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-[1.6] text-[var(--brand-muted)]">
                    {v.body}
                  </p>
                  <LoopVideo
                    src={v.src}
                    poster={v.poster}
                    alt={v.alt}
                    className="mt-4 aspect-video w-full rounded-[var(--radius-md)] object-cover"
                  />
                </Card>
              </BorderBeam>
            </BlurFade>
          ))}
        </div>
      </Container>

      <StatBand stats={stats} heading="In practice" />

      <HarassmentSpectrum />

      <WorkplaceProtection />

      {/* ── Knowledge Hub teaser ─────────────────────────────────────────── */}
      <Container className="py-20">
        <BlurFade>
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-8 md:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--brand-accent)] opacity-[0.06] blur-2xl"
            />
            <Reveal className="relative">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                Free resource
              </p>
              <h2 className="mt-3 max-w-[22ch] font-serif text-[31px] font-semibold md:text-[39px]">
                A plain-English guide to the POSH Act
              </h2>
              <p className="mt-4 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
                What the law requires of an employer, how an Internal Committee
                is constituted, who can complain, and what the timelines
                actually are — written to be read by people who are not lawyers.
              </p>
              <Link
                href="/posh-act"
                className="group mt-7 inline-flex items-center gap-2 text-[17px] font-semibold text-[var(--brand-primary)]"
              >
                Read the guide
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </Reveal>
          </div>
        </BlurFade>
      </Container>

      {services.length > 0 && (
        <Container className="pb-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-serif text-[31px] font-semibold md:text-[39px]">
                How we can help
              </h2>
              <Link
                href="/services"
                className="shrink-0 text-[16px] font-semibold text-[var(--brand-primary)]"
              >
                All services →
              </Link>
            </div>
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s, i) => (
              <li key={s._id}>
                <BlurFade delay={i * 0.07}>
                  <ServiceCard service={s} />
                </BlurFade>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <ComplianceStatBand />

      {/* ── Self-check — explained, not just named ──────────────────────── */}
      <section className="bg-[var(--brand-primary)] py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Free · 2 minutes · no email required
              </p>
              <h2 className="mt-3 max-w-[20ch] font-serif text-[31px] font-semibold text-white md:text-[39px]">
                Is your organisation POSH compliant?
              </h2>
              <p className="mt-4 max-w-[56ch] text-[18px] leading-[1.65] text-white/85">
                Eight yes-or-no questions about the things the Act actually
                requires — a written policy, a properly constituted Internal
                Committee, training, and the annual report. You get your result
                on screen straight away, with the specific gaps listed.
              </p>
              <div className="mt-8">
                <Link
                  href="/posh-compliance-check"
                  className="inline-flex h-13 items-center rounded-[var(--radius-md)] bg-[var(--brand-accent)] px-7 text-[18px] font-semibold text-[var(--brand-accent-on)] transition-colors hover:bg-[var(--brand-accent-hover)]"
                >
                  Check where you stand
                </Link>
              </div>
            </div>

            <BlurFade direction="left" delay={0.15}>
              <ul className="space-y-3">
                {[
                  "Do you have a written policy on sexual harassment at work?",
                  "Have you formally constituted an Internal Committee?",
                  "Does that committee include an external member?",
                  "Did you file the annual report this year?",
                ].map((q) => (
                  <li
                    key={q}
                    className="flex items-start gap-3 rounded-[var(--radius-md)] bg-white/10 px-5 py-3.5 text-[16px] leading-[1.5] text-white"
                  >
                    <span aria-hidden="true" className="mt-0.5 text-white/60">
                      ?
                    </span>
                    {q}
                  </li>
                ))}
                <li className="pl-5 pt-1 text-[15px] text-white/60">
                  …and four more.
                </li>
              </ul>
            </BlurFade>
          </div>
        </Container>
      </section>

      <HowItWorks />

      {courses.length > 0 && (
        <Container className="py-20">
          <Reveal>
            <h2 className="font-serif text-[31px] font-semibold md:text-[39px]">
              Self-paced training
            </h2>
            <p className="mt-3 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
              Work through the material at your own pace and finish with a
              Certificate of Completion.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <li key={c._id}>
                <BlurFade delay={i * 0.07}>
                  <CourseCard course={c} />
                </BlurFade>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <TestimonialSection testimonials={testimonials} />

      {posts.length > 0 && (
        <Container className="py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-serif text-[31px] font-semibold md:text-[39px]">
                From the blog
              </h2>
              <Link
                href="/blog"
                className="shrink-0 text-[16px] font-semibold text-[var(--brand-primary)]"
              >
                All posts →
              </Link>
            </div>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <li key={p._id}>
                <BlurFade delay={i * 0.07}>
                  <PostCard post={p} />
                </BlurFade>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── YouTube + Instagram strip (P11-06/07) ───────────────────────── */}
      {(videos.length > 0 || instagramPosts.length > 0) && (
        <Container className="py-20">
          <Reveal>
            <h2 className="font-serif text-[31px] font-semibold md:text-[39px]">
              Follow along
            </h2>
            <p className="mt-3 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
              Short explainers and behind-the-scenes from sessions — on YouTube
              and Instagram.
            </p>
          </Reveal>

          {videos.length > 0 && (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, i) => (
                <li key={v.id}>
                  <BlurFade delay={i * 0.07}>
                    <YouTubeLite
                      videoId={v.id}
                      title={v.title}
                      thumbnailUrl={v.thumbnailUrl}
                    />
                  </BlurFade>
                </li>
              ))}
            </ul>
          )}

          {instagramPosts.length > 0 && (
            <BlurFade delay={0.15} className="mt-8">
              <InstaGrid posts={instagramPosts} />
            </BlurFade>
          )}
        </Container>
      )}

      <Container>
        <CtaBand
          heading="Talk to us about your organisation"
          body="A short conversation is usually enough to work out what you actually need — even if that turns out to be nothing."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </Container>
    </>
  );
}
