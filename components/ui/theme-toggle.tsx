"use client";

import { Moon, Sun } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/**
 * Module-level store, not per-instance useState: the header renders a
 * <ThemeToggle> in both the desktop nav and the mobile drawer, and both must
 * flip together when either is clicked. `useSyncExternalStore` is also the
 * React-recommended way to read a value the server can't know (the DOM
 * attribute the no-flash script in app/layout.tsx set before hydration) —
 * doing that via `useEffect` + `setState` trips `react-hooks/set-state-in-
 * effect` for exactly the reason the rule exists (see header.tsx's own note
 * on the same rule): it's an extra, avoidable render pass.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

// SSR has no DOM and no localStorage; the no-flash script guarantees the
// client value is correct by the time hydration reads it, so this only needs
// to be *a* valid theme, not the right one — it's never rendered as final.
function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme-transitioning", "");
  root.setAttribute("data-theme", next);
  window.localStorage.setItem("theme", next);
  window.setTimeout(() => root.removeAttribute("data-theme-transitioning"), 300);
  listeners.forEach((l) => l());
}

/**
 * Expanding-circle reveal centred on wherever the toggle was clicked, via the
 * View Transitions API — the new theme grows outward from that point over the
 * old one. Falls back to the plain crossfade `setTheme` already drives through
 * `data-theme-transitioning` when the API is unsupported (Firefox at time of
 * writing) or the visitor asked for reduced motion; that check happens here,
 * not in CSS, because the browser's default crossfade would otherwise still
 * run underneath an animation we meant to skip.
 */
function setThemeAtOrigin(next: Theme, origin: { x: number; y: number } | null) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || typeof document.startViewTransition !== "function" || !origin) {
    setTheme(next);
    return;
  }

  const maxRadius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );

  const transition = document.startViewTransition(() => setTheme(next));

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${maxRadius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: 550,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleClick() {
    const rect = buttonRef.current?.getBoundingClientRect();
    const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    setThemeAtOrigin(theme === "dark" ? "light" : "dark", origin);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-muted)] transition-colors hover:bg-[var(--brand-primary-tint)] hover:text-[var(--brand-primary)] ${className ?? ""}`}
    >
      {theme === "dark" ? (
        <Sun size={18} strokeWidth={1.75} />
      ) : (
        <Moon size={18} strokeWidth={1.75} />
      )}
    </button>
  );
}
