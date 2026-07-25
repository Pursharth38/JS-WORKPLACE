import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { getSiteSettings } from "@/lib/sanity";

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
      <Container className="py-14" measure>
        <h1 className="font-serif text-[39px] font-semibold">About</h1>

        <p className="mt-5 text-[19px] leading-[1.6] text-[var(--brand-muted)]">
          {settings.businessName} works with Indian organisations on the
          Prevention of Sexual Harassment Act — awareness training that people
          actually absorb, Internal Committees that can run a proper inquiry,
          and policies that hold up when they are tested.
        </p>

        <h2 className="mt-12 font-serif text-[31px] font-semibold">
          How we work
        </h2>
        <p className="mt-4 text-[17px] leading-[1.7]">
          Compliance training has a reputation for being a box-ticking exercise
          that everyone sits through and nobody remembers. That is a real
          problem, because the Act only works if the people covered by it
          understand what it protects them from and what the process actually
          involves.
        </p>
        <p className="mt-4 text-[17px] leading-[1.7]">
          Sessions are built around situations people recognise from their own
          workplaces, with time for the questions that only come up once the
          formal part is over. Internal Committee training goes further into
          procedure — how to receive a complaint, how to run an inquiry within
          the statutory timelines, and how to write a report that survives an
          appeal.
        </p>

        <h2 className="mt-12 font-serif text-[31px] font-semibold">
          Credentials
        </h2>
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
