"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          action?: string;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile. Renders a hidden `cf-turnstile-response` input that the
 * server re-verifies against the siteverify endpoint — the widget alone proves
 * nothing, the server check is what counts.
 *
 * Chosen over reCAPTCHA because Turnstile is cookieless, which keeps us out of
 * the DPDP consent-banner conversation that GA4 and reCAPTCHA would drag us into.
 *
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (local dev, or before the client's
 * Cloudflare account exists) this renders nothing and the form still works. The
 * server treats a missing token as "unverified" only when its own secret is set,
 * so dev is not blocked on a Cloudflare account.
 */
export function Turnstile({ action }: { action?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey as string,
        theme: "light",
        ...(action ? { action } : {}),
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (existing) {
        existing.addEventListener("load", renderWidget);
      } else {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener("load", renderWidget);
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id !== null && window.turnstile) {
        window.turnstile.remove(id);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="min-h-[65px]" />;
}
