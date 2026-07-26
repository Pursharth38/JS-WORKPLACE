"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { AdminNav } from "@/components/admin/nav";

// Same module-level-store + useSyncExternalStore pattern as ThemeToggle
// (components/ui/theme-toggle.tsx) — reads a value the server can't know
// (localStorage) without tripping react-hooks/set-state-in-effect, which a
// useEffect + setState version of this hits immediately.
const STORAGE_KEY = "admin-sidebar-collapsed";
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

// SSR has no localStorage — expanded is the safe default, and it's never
// rendered as final since the client snapshot resolves before interaction.
function getServerSnapshot(): boolean {
  return false;
}

function setCollapsed(next: boolean) {
  window.localStorage.setItem(STORAGE_KEY, String(next));
  listeners.forEach((l) => l());
}

export function AdminSidebar({ role }: { role: string }) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--brand-line)] bg-[var(--brand-elevated)] transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-[248px]"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-[var(--brand-line)] px-4 py-4">
        <Link
          href="/admin"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] font-serif text-[15px] font-semibold text-white"
          aria-label="Admin home"
        >
          J
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-serif text-[15px] font-semibold leading-tight">
              JS Workplace Wellness
            </p>
            <span className="mt-0.5 inline-block rounded-full bg-[var(--brand-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-accent-on)]">
              {role}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <AdminNav collapsed={collapsed} />
      </div>

      <div className="border-t border-[var(--brand-line)] p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-[14px] font-medium text-[var(--brand-muted)] transition-colors hover:bg-[var(--brand-primary-tint)] hover:text-[var(--brand-ink)]"
        >
          {collapsed ? (
            <ChevronsRight size={17} strokeWidth={2} />
          ) : (
            <ChevronsLeft size={17} strokeWidth={2} />
          )}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
