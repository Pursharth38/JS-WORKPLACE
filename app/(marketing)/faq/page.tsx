import type { Metadata } from "next";

import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { ProseBlock } from "@/components/marketing/prose-block";
import { getFaqs } from "@/lib/sanity";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers to common questions about the POSH Act, our training, the online course and certificates.",
};

/**
 * P5-02. The `FAQPage` JSON-LD that would make these eligible for Google's
 * expandable rich result is DEFERRED with the rest of the SEO work (P4-05 /
 * P12-01..04) at the user's direction. The content and markup are structured so
 * that adding it later is a pure addition — no restructuring needed.
 */
export default async function FaqPage() {
  const faqs = await getFaqs();

  // Preserve the schema's category ordering rather than sorting alphabetically:
  // the client controls the order and it is meaningful.
  const categories: string[] = [];
  for (const f of faqs) {
    if (!categories.includes(f.category)) categories.push(f.category);
  }

  return (
    <>
      <Container className="py-14">
        <h1 className="font-serif text-[39px] font-semibold">
          Frequently asked questions
        </h1>
        <p className="mt-4 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
          If your question is not here,{" "}
          <Link
            href="/contact"
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            ask us directly
          </Link>
          .
        </p>

        {faqs.length === 0 ? (
          <p className="mt-10 text-[17px] text-[var(--brand-muted)]">
            Questions are being added.
          </p>
        ) : (
          <div className="mt-10 max-w-[76ch] space-y-10">
            {categories.map((category) => {
              const items: AccordionItem[] = faqs
                .filter((f) => f.category === category)
                .sort((a, b) => a.order - b.order)
                .map((f) => ({
                  id: `faq-${f._id}`,
                  question: f.question,
                  answer: <ProseBlock value={f.answer} />,
                }));

              return (
                <section key={category}>
                  <h2 className="font-serif text-[25px] font-semibold">
                    {category}
                  </h2>
                  <Accordion items={items} className="mt-4" />
                </section>
              );
            })}
          </div>
        )}

        <CtaBand
          heading="Still not sure what applies to you?"
          body="Tell us about your organisation and we'll give you a straight answer."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </Container>
    </>
  );
}
