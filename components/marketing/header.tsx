"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { Container } from "./container";
import { PRIMARY_NAV } from "./nav-links";

/**
 * Sticky site header.
 *
 * Client component only because of the mobile drawer and active-route
 * highlighting. It takes the announcement bar as props rather than fetching, so
 * the server layout stays the only thing touching Sanity — no client-side fetch
 * on first paint (platform-agent.md SEO rules).
 */
export function Header({
  announcement,
}: {
  announcement?: { enabled?: boolean; text?: string; href?: string } | undefined;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation — otherwise it stays open over the new page.
  //
  // Adjusted during render rather than in an effect. React's documented pattern
  // for "reset state when a value changes" is exactly this; doing it in an
  // effect fires a second render pass and trips react-hooks/set-state-in-effect
  // under React 19.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Lock scroll behind the open drawer.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {announcement?.enabled && announcement.text && (
        <div className="bg-[var(--brand-primary)] px-4 py-2 text-center text-[14px] text-white">
          {announcement.href ? (
            <Link href={announcement.href} className="underline underline-offset-2">
              {announcement.text}
            </Link>
          ) : (
            announcement.text
          )}
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[var(--brand-line)] bg-[var(--brand-surface)]/95 backdrop-blur">
        <Container className="flex h-[72px] items-center justify-between gap-6">
          <Link
            href="/"
            className="font-serif text-[20px] font-semibold tracking-tight text-[var(--brand-primary)]"
          >
            JS Workplace Wellness
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "rounded-[var(--radius-sm)] px-3 py-2 text-[15px] font-medium transition-colors",
                      isActive(item.href)
                        ? "text-[var(--brand-primary)]"
                        : "text-[var(--brand-muted)] hover:text-[var(--brand-ink)]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/book-demo"
              className="hidden rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] sm:inline-flex"
            >
              Book a consultation
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="rounded-[var(--radius-sm)] p-2 text-[var(--brand-ink)] lg:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {open ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 bottom-0 top-[72px] z-20 overflow-y-auto border-t border-[var(--brand-line)] bg-[var(--brand-surface)] lg:hidden"
        >
          <nav aria-label="Main" className="px-4 py-5">
            <ul className="space-y-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-[var(--radius-md)] px-3 py-3",
                      isActive(item.href)
                        ? "bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]"
                        : "text-[var(--brand-ink)]",
                    )}
                  >
                    <span className="block text-[17px] font-semibold">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 block text-[14px] text-[var(--brand-muted)]">
                        {item.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/book-demo"
              className="mt-5 flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[16px] font-semibold text-white"
            >
              Book a consultation
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
