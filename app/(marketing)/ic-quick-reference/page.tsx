import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { LeadMagnetForm } from "@/components/marketing/lead-magnet-form";
import { ProseBlock } from "@/components/marketing/prose-block";
import { getQuickReferences } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "IC quick reference",
  description:
    "Internal Committee quick reference — inquiry timelines, committee composition, penalties and the annual report, as scannable tables.",
};

/**
 * E4. Built for someone mid-inquiry who needs to check a deadline, not for
 * someone reading start to finish — hence the tables and the anchor links.
 *
 * All content is Sanity-managed (`quickReference` documents). No timelines or
 * penalty figures are hardcoded here: they are the client's to state and to
 * keep current, and a number baked into JSX is a number that goes stale.
 */
export default async function IcQuickReferencePage() {
  const cards = await getQuickReferences();

  return (
    <>
      <Container className="py-14">
        <div className="max-w-[68ch]">
          <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
            For Internal Committee members
          </p>
          <h1 className="mt-3 font-serif text-[39px] font-semibold leading-[1.15]">
            Quick reference
          </h1>
          <p className="mt-4 text-[19px] leading-[1.6] text-[var(--brand-muted)]">
            The timelines, composition rules and obligations an Internal
            Committee needs to hand — in tables, so you can find the one you
            need without reading the whole guide.
          </p>
        </div>

        {cards.length > 0 ? (
          <>
            <nav aria-label="On this page" className="mt-10">
              <ul className="flex flex-wrap gap-2">
                {cards.map((c) => (
                  <li key={c._id}>
                    <a
                      href={`#${c.anchor}`}
                      className="inline-flex rounded-full border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-4 py-1.5 text-[15px] font-medium text-[var(--brand-muted)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                    >
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-12 space-y-14">
              {cards.map((card) => (
                <section key={card._id}>
                  <h2
                    id={card.anchor}
                    className="font-serif text-[31px] font-semibold"
                  >
                    {card.title}
                  </h2>
                  {card.intro && (
                    <p className="mt-3 max-w-[68ch] text-[18px] leading-[1.6] text-[var(--brand-muted)]">
                      {card.intro}
                    </p>
                  )}
                  <ProseBlock value={card.body} className="mt-4" />
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-10 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
            These reference tables are being prepared. In the meantime, the{" "}
            <Link
              href="/posh-act"
              className="text-[var(--brand-primary)] underline underline-offset-2"
            >
              POSH Act guide
            </Link>{" "}
            covers the same ground in longer form.
          </p>
        )}

        <section className="mt-16 grid gap-8 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:grid-cols-2 md:p-8">
          <div>
            <h2 className="font-serif text-[25px] font-semibold">
              Take the checklist with you
            </h2>
            <p className="mt-3 text-[17px] leading-[1.65] text-[var(--brand-muted)]">
              A one-page PDF of the eight obligations an employer has to be able
              to evidence. Useful to work through with your committee, or to
              send to whoever owns compliance.
            </p>
          </div>
          <LeadMagnetForm compact />
        </section>

        <CtaBand
          heading="Need your committee trained properly?"
          body="Knowing the law is not the same as knowing how to run an inquiry that holds up on appeal."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </Container>
    </>
  );
}
