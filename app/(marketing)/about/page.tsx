import type { Metadata } from "next";

import { AboutIntro } from "@/components/marketing/about-intro";
import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { ABOUT_HEADING, ABOUT_PHOTO, aboutParagraphs } from "@/lib/about";
import { getSiteSettings, usingDemoContent } from "@/lib/content";
import { DEMO_ABOUT_PILLS } from "@/lib/demo-content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "About JS Workplace Wellness — POSH training, Internal Committee support and workplace compliance for Indian organisations.",
};

/**
 * ⚠️ CREDENTIALS ON THIS PAGE MUST BE REAL AND CLIENT-SUPPLIED.
 *
 * CLAUDE.md §1: Jyoti Solaria is NOT empanelled by the Ministry of Women and
 * Child Development, and none of the forbidden claim strings may appear here.
 * The reference competitor is empanelled; we are not, and borrowing their
 * framing is exactly the exposure this rule exists to prevent.
 *
 * The biography below is intentionally a STRUCTURE with no invented facts —
 * no years of experience, no client counts, no certifications. Those come from
 * the client (P0-04) and are dropped in verbatim. Do not fill these in from
 * imagination to make the page look finished.
 */
export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      {/* The biography, the portrait and the chips all live in this section
          now — it carries the page's <h1>, so the prose below picks up at
          "Credentials" rather than repeating what it already said. */}
      <AboutIntro
        as="h1"
        heading={ABOUT_HEADING}
        paragraphs={aboutParagraphs(settings.businessName)}
        photo={ABOUT_PHOTO}
        pills={usingDemoContent ? DEMO_ABOUT_PILLS : []}
      />

      <Container className="py-14" measure>
        <h2 className="font-serif text-[31px] font-semibold">Credentials</h2>
        <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--brand-line)] bg-[var(--brand-elevated)] p-5 text-[16px] leading-[1.7] text-[var(--brand-muted)]">
          {/* Placeholder — replaced with the client's real, verifiable
              credentials during content load (P13-01). Deliberately visible
              rather than invented. */}
          Qualifications and professional background to be added.
        </p>

        <h2 className="mt-12 font-serif text-[31px] font-semibold">
          Get in touch
        </h2>
        <p className="mt-4 text-[17px] leading-[1.7]">
          If you are working out what your organisation needs — or whether it
          needs anything at all — a short conversation is usually the fastest
          way to find out.
        </p>
        {settings.email && (
          <p className="mt-4 text-[17px]">
            <a
              href={`mailto:${settings.email}`}
              className="text-[var(--brand-primary)] underline underline-offset-2"
            >
              {settings.email}
            </a>
          </p>
        )}
      </Container>

      <Container>
        <CtaBand
          heading="Talk to us about your organisation"
          body="No obligation, and no sales script."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </Container>
    </>
  );
}
