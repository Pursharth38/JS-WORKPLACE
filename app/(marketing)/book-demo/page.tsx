import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { LeadForm } from "@/components/marketing/lead-form";

export const metadata: Metadata = {
  title: "Book a consultation",
  description:
    "Book a no-obligation consultation about POSH training, Internal Committee setup, policy drafting or a compliance review.",
};

export default function BookDemoPage() {
  return (
    <Container className="py-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h1 className="font-serif text-[39px] font-semibold">
            Book a consultation
          </h1>
          <p className="mt-4 max-w-[52ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
            A short call to work out what your organisation actually needs.
          </p>

          <h2 className="mt-10 font-serif text-[22px] font-semibold">
            What to expect
          </h2>
          <ul className="mt-4 space-y-3 text-[17px] leading-[1.7]">
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[var(--brand-primary)]">
                —
              </span>
              <span>
                A few questions about your organisation: size, structure, and
                what is already in place.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[var(--brand-primary)]">
                —
              </span>
              <span>
                An honest read on where the gaps are, and which ones actually
                matter for you.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[var(--brand-primary)]">
                —
              </span>
              <span>
                A recommendation. If that recommendation is &ldquo;you are fine,
                do nothing&rdquo;, that is what you will hear.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:p-8">
          <LeadForm source="demo" submitLabel="Request a consultation" />
        </div>
      </div>
    </Container>
  );
}
