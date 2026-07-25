import type { Metadata } from "next";

import { BackToTop } from "@/components/marketing/back-to-top";
import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { LeadMagnetForm } from "@/components/marketing/lead-magnet-form";
import { ProseBlock } from "@/components/marketing/prose-block";
import { ReadingProgress } from "@/components/marketing/reading-progress";
import { TocSidebar, type TocGroup } from "@/components/marketing/toc-sidebar";
import { POSH_GROUPS } from "@/lib/posh-groups";
import { getCtaBands, getPoshSections, type PoshSection } from "@/lib/sanity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The POSH Act, explained",
  description:
    "A plain-English guide to the Sexual Harassment of Women at Workplace Act, 2013 — employer duties, Internal Committee constitution, complaint timelines, inquiry procedure and penalties.",
};

/**
 * THE KNOWLEDGE HUB — the SEO centerpiece and the business case for the project.
 *
 * ⚠️ EVERY WORD OF THE CONTENT IS CLIENT-SUPPLIED AND ORIGINAL.
 * This file renders `poshSection` documents from Sanity. It contains no POSH Act
 * content of its own, and none may ever be added here: copying or
 * close-paraphrasing a competitor does not rank and is copyright exposure the
 * client personally carries. If she delivers 6 groups instead of 11, this page
 * renders 6 — see the content-risk note in feature-inventory/knowledge-hub.md.
 *
 * Anchors are permanent URLs. People bookmark and share them. Renaming one
 * without a redirect breaks every link anyone has ever shared.
 */
export default async function PoshActPage() {
  const [sections, ctaBands] = await Promise.all([
    getPoshSections(),
    getCtaBands(),
  ]);

  // Group in the canonical order, not alphabetically, and drop empty groups so
  // a partial content delivery still reads as a finished page.
  const grouped = POSH_GROUPS.map((group) => ({
    group,
    sections: sections
      .filter((s) => s.group === group)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.sections.length > 0);

  const tocGroups: TocGroup[] = grouped.map((g) => ({
    group: g.group,
    items: g.sections.map((s) => ({ anchor: s.anchor, title: s.title })),
  }));

  if (sections.length === 0) {
    return (
      <Container className="py-14" measure>
        <h1 className="font-serif text-[39px] font-semibold">
          The POSH Act, explained
        </h1>
        <p className="mt-5 text-[17px] leading-[1.7] text-[var(--brand-muted)]">
          This guide is being written. In the meantime, if you have a question
          about your obligations under the Act, please{" "}
          <a
            href="/contact"
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            get in touch
          </a>
          .
        </p>
      </Container>
    );
  }

  return (
    <>
      <ReadingProgress />

      <Container className="py-12">
        <header className="max-w-[68ch]">
          <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
            The POSH Act, 2013
          </p>
          <h1 className="mt-3 font-serif text-[39px] font-semibold leading-[1.15] md:text-[49px]">
            The POSH Act, explained
          </h1>
          <p className="mt-5 text-[19px] leading-[1.6] text-[var(--brand-muted)]">
            What the law requires, who it protects, how a complaint is handled
            and what the timelines are — written for the people who have to apply
            it, not for lawyers.
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
          <aside className="lg:order-1">
            <TocSidebar groups={tocGroups} />
          </aside>

          <div className="lg:order-2">
            {grouped.map((g) => {
              const band = ctaBands.find((b) => b.afterGroup === g.group);

              return (
                <section key={g.group} className="mb-4">
                  <h2 className="mt-12 border-b border-[var(--brand-line)] pb-3 font-serif text-[14px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                    {g.group}
                  </h2>

                  {g.sections.map((section) => (
                    <HubSection key={section._id} section={section} />
                  ))}

                  {band && (
                    <CtaBand
                      heading={band.heading}
                      body={band.body}
                      buttonLabel={band.buttonLabel}
                      buttonHref={band.buttonHref}
                    />
                  )}
                </section>
              );
            })}

            {/*
              Lead magnet at the FOOT of the guide, not as a timed pop-up.
              Someone who has read this far has demonstrated intent; an
              interstitial that interrupts them mid-section would undercut the
              exact impression this page exists to create.
            */}
            <section className="mt-16 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:p-8">
              <h2 className="font-serif text-[25px] font-semibold">
                Take the checklist with you
              </h2>
              <p className="mt-3 max-w-[62ch] text-[17px] leading-[1.65] text-[var(--brand-muted)]">
                A one-page PDF of the eight obligations an employer needs to be
                able to evidence — useful for working through with your
                committee.
              </p>
              <div className="mt-6 max-w-md">
                <LeadMagnetForm compact />
              </div>
            </section>
          </div>
        </div>
      </Container>

      <BackToTop />
    </>
  );
}

function HubSection({ section }: { section: PoshSection }) {
  return (
    <article className="mt-10 max-w-[68ch]">
      {/*
        The anchor lives on the heading itself. `scroll-margin-top` is set
        globally in globals.css so a deep link never lands underneath the
        sticky header.
      */}
      <h3
        id={section.anchor}
        className="group font-serif text-[31px] font-semibold leading-tight"
      >
        {section.title}
        <a
          href={`#${section.anchor}`}
          aria-label={`Link to “${section.title}”`}
          className="ml-2 text-[var(--brand-muted)] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        >
          #
        </a>
      </h3>

      {section.summary && (
        <p className="mt-3 text-[18px] leading-[1.6] text-[var(--brand-muted)]">
          {section.summary}
        </p>
      )}

      <ProseBlock value={section.body} className="mt-4" />
    </article>
  );
}
