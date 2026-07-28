import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

/**
 * No-flash theme script. Runs `beforeInteractive` — before hydration, before
 * first paint — and sets `data-theme` on <html> synchronously, so a returning
 * dark-mode visitor never sees a flash of the light theme while React boots.
 * Reads localStorage first (an explicit ThemeToggle choice always wins), then
 * falls back to system preference. Deliberately tiny and dependency-free:
 * this is the one place in the app where inline, un-typed JS is the right
 * call, because it must run before any bundle — including React itself.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

/**
 * Intro-curtain suppressor. Same shape and same reason as the theme script: it
 * must run before first paint, because deciding *after* paint would mean the
 * curtain flashes up and is yanked away — worse than either outcome.
 *
 * `sessionStorage`, not `localStorage`: the entry animation should greet a
 * visitor once when they arrive and then stay out of the way for the rest of
 * that visit, but still play for tomorrow's visit. It sets the flag on the very
 * first paint, so a reload two seconds later already skips it.
 *
 * Purely an enhancement — components/marketing/site-intro.tsx explains what the
 * no-JS path looks like (the curtain plays every load, and still lifts).
 */
const INTRO_INIT_SCRIPT = `
(function () {
  try {
    if (sessionStorage.getItem('intro-seen')) {
      document.documentElement.setAttribute('data-intro', 'seen');
    } else {
      sessionStorage.setItem('intro-seen', '1');
    }
  } catch (e) {}
})();
`;

/* Both faces are self-hosted by next/font at build time — no render-blocking
   request to fonts.googleapis.com, and no third-party cookie surface.
   globals.css maps --font-heading / --font-body onto these two variables. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "JS Workplace Wellness",
    template: "%s · JS Workplace Wellness",
  },
  description: "POSH awareness training and workplace compliance support.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      // The THEME_INIT_SCRIPT below sets `data-theme` before hydration, from
      // localStorage/matchMedia — neither exists on the server, so the
      // server-rendered HTML never has this attribute and it will never
      // match. That's expected and correct (the whole point is picking the
      // theme before first paint), not a real markup bug — this is the
      // standard, documented way to suppress it for exactly this one
      // attribute, not a blanket "ignore hydration errors here" escape hatch.
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <Script
          id="intro-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: INTRO_INIT_SCRIPT }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
