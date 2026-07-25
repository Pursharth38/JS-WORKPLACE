import type { ReactNode } from "react";

import { DemoBanner } from "@/components/marketing/demo-banner";
import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";
import { WhatsAppFAB } from "@/components/marketing/whatsapp-fab";
import { getSiteSettings, usingDemoContent } from "@/lib/sanity";
import { getSession } from "@/lib/session";

/**
 * Shell for every public page.
 *
 * Settings and session are resolved HERE, on the server, once per render — not
 * inside Header/Footer/FAB. Those take props. That keeps Sanity and Auth.js out
 * of the client bundle and satisfies the "no client-side fetching on first
 * paint" rule in platform-agent.md.
 */
export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, session] = await Promise.all([
    getSiteSettings(),
    getSession(),
  ]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {usingDemoContent && <DemoBanner />}

      <Header
        announcement={settings.announcement}
        isSignedIn={Boolean(session)}
      />

      <main id="main">{children}</main>

      <Footer settings={settings} />

      <WhatsAppFAB
        number={settings.whatsappNumber}
        message={settings.whatsappDefaultMessage}
      />
    </>
  );
}
