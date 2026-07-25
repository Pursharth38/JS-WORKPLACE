import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";
import { WhatsAppFAB } from "@/components/marketing/whatsapp-fab";
import { getSiteSettings } from "@/lib/sanity";

/**
 * Shell for every public page.
 *
 * Settings are fetched HERE, on the server, once per render — not in the
 * Header/Footer/FAB components. Those take props. That keeps the client bundle
 * free of Sanity and satisfies the "no client-side fetching on first paint"
 * rule in platform-agent.md.
 */
export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Header announcement={settings.announcement} />

      <main id="main">{children}</main>

      <Footer settings={settings} />

      <WhatsAppFAB
        number={settings.whatsappNumber}
        message={settings.whatsappDefaultMessage}
      />
    </>
  );
}
