import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { LeadForm } from "@/components/marketing/lead-form";
import { getSiteSettings } from "@/lib/sanity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch about POSH training, Internal Committee support, policy drafting or a compliance review.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <Container className="py-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h1 className="font-serif text-[39px] font-semibold">Contact</h1>
          <p className="mt-4 max-w-[52ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
            Tell us what you are trying to sort out and we will come back to you.
            If it turns out you do not need us, we will say so.
          </p>

          <dl className="mt-10 space-y-6 text-[17px]">
            {settings.email && (
              <div>
                <dt className="text-[15px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-[var(--brand-primary)] underline underline-offset-2"
                  >
                    {settings.email}
                  </a>
                </dd>
              </div>
            )}

            {settings.phone && (
              <div>
                <dt className="text-[15px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  Phone
                </dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${settings.phone.replace(/\s/g, "")}`}
                    className="text-[var(--brand-primary)] underline underline-offset-2"
                  >
                    {settings.phone}
                  </a>
                </dd>
              </div>
            )}

            {settings.addressLines && settings.addressLines.length > 0 && (
              <div>
                <dt className="text-[15px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  Address
                </dt>
                <dd className="mt-1 not-italic leading-[1.7]">
                  {settings.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:p-8">
          <h2 className="font-serif text-[25px] font-semibold">
            Send us a message
          </h2>
          <div className="mt-6">
            <LeadForm source="contact" />
          </div>
        </div>
      </div>
    </Container>
  );
}
