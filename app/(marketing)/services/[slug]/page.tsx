import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { ProseBlock } from "@/components/marketing/prose-block";
import { getServiceBySlug, getServices } from "@/lib/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };

  return {
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.summary,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <Container className="py-14">
      <article>
        <h1 className="font-serif text-[39px] font-semibold">
          {service.title}
        </h1>
        <p className="mt-4 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
          {service.summary}
        </p>

        {service.format && (
          <p className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--brand-primary-tint)] px-4 py-2 text-[15px] font-semibold text-[var(--brand-primary)]">
            {service.format}
          </p>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="max-w-[68ch]">
            <ProseBlock value={service.body} />
          </div>

          <aside className="space-y-6 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6">
            {service.whoItIsFor && service.whoItIsFor.length > 0 && (
              <div>
                <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  Who this is for
                </h2>
                <ul className="mt-3 space-y-2 text-[16px] leading-[1.6]">
                  {service.whoItIsFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {service.whatIsCovered && service.whatIsCovered.length > 0 && (
              <div>
                <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  What is covered
                </h2>
                <ul className="mt-3 space-y-2 text-[16px] leading-[1.6]">
                  {service.whatIsCovered.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <CtaBand
          heading={`Interested in ${service.title.toLowerCase()}?`}
          body="Tell us a little about your organisation and we'll come back with what this would look like for you."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </article>
    </Container>
  );
}
