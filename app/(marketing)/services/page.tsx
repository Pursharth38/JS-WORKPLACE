import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { ServiceCard } from "@/components/marketing/service-card";
import { getServices } from "@/lib/sanity";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Services",
  description:
    "POSH awareness sessions, Internal Committee training, policy drafting, compliance audits and workplace wellness programmes.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <Container className="py-14">
        <h1 className="font-serif text-[39px] font-semibold">Services</h1>
        <p className="mt-4 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
          Training and compliance support for organisations covered by the POSH
          Act — from a single awareness session to standing as an external
          Internal Committee member.
        </p>

        {services.length > 0 ? (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s._id}>
                <ServiceCard service={s} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-12 text-[17px] text-[var(--brand-muted)]">
            Services are being added. In the meantime, please{" "}
            <Link
              href="/contact"
              className="text-[var(--brand-primary)] underline underline-offset-2"
            >
              get in touch
            </Link>{" "}
            and we will talk through what you need.
          </p>
        )}

        <CtaBand
          heading="Not sure which of these you need?"
          body="Tell us about your organisation and we'll point you at the right starting place — even if that turns out to be nothing at all."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </Container>
    </>
  );
}
