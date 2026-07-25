import Link from "next/link";

import type { SiteSettings } from "@/lib/sanity";
import { Container } from "./container";
import { LEGAL_NAV, PRIMARY_NAV, RESOURCE_NAV } from "./nav-links";

/**
 * Every contact detail here comes from Sanity `siteSettings`. Nothing is
 * hardcoded — see platform-agent.md HARD RULES.
 *
 * ⚠️ NO CLAIMS OF EMPANELMENT OR GOVERNMENT RECOGNITION. CLAUDE.md §1 lists the
 * exact strings CI greps for; the client is not MWCD empanelled and saying
 * otherwise is a legal exposure, not a marketing flourish.
 */
export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[var(--brand-line)] bg-[var(--brand-elevated)]">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-[19px] font-semibold text-[var(--brand-primary)]">
              {settings.businessName}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--brand-muted)]">
              POSH awareness training, Internal Committee support and workplace
              compliance for Indian organisations.
            </p>

            {(settings.linkedinUrl ||
              settings.instagramUrl ||
              settings.youtubeUrl) && (
              <ul className="mt-4 flex gap-4 text-[15px]">
                {settings.linkedinUrl && (
                  <li>
                    <a
                      href={settings.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                    >
                      LinkedIn
                    </a>
                  </li>
                )}
                {settings.instagramUrl && (
                  <li>
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {settings.youtubeUrl && (
                  <li>
                    <a
                      href={settings.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                    >
                      YouTube
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          <FooterColumn title="Explore" links={PRIMARY_NAV} />
          <FooterColumn title="Resources" links={RESOURCE_NAV} />

          <div>
            <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">
              Get in touch
            </h2>
            <ul className="mt-3 space-y-2 text-[15px] text-[var(--brand-muted)]">
              {settings.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="hover:text-[var(--brand-primary)]"
                  >
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone.replace(/\s/g, "")}`}
                    className="hover:text-[var(--brand-primary)]"
                  >
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.addressLines?.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--brand-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-[var(--brand-muted)]">
            © {year} {settings.legalEntityName || settings.businessName}. All
            rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-[15px]">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
