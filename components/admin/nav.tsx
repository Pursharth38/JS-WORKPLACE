"use client";

// CMS migration M1e — admin nav, now grouped for the sidebar. Client only for
// the active-state check via usePathname().
import {
  Briefcase,
  Camera,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Newspaper,
  Quote,
  Settings,
  ShieldQuestion,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

type Tab = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};
type Group = { label: string; tabs: readonly Tab[] };

export const NAV_GROUPS: readonly Group[] = [
  {
    label: "Overview",
    tabs: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    tabs: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/courses", label: "Courses", icon: GraduationCap },
      { href: "/admin/services", label: "Services", icon: Briefcase },
      { href: "/admin/posh-hub", label: "POSH Hub", icon: ShieldQuestion },
      { href: "/admin/ic-reference", label: "Quick Ref", icon: ListChecks },
      { href: "/admin/faq", label: "FAQ", icon: FileQuestion },
      { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
      { href: "/admin/instagram", label: "Instagram", icon: Camera },
      { href: "/admin/cta-bands", label: "CTA bands", icon: Megaphone },
    ],
  },
  {
    label: "System",
    tabs: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Sidebar nav content — grouped sections with icons. `collapsed` hides the
 * text labels and group headings, leaving just the icon column; `title` on
 * each link keeps the destination discoverable (native tooltip) when
 * collapsed, since there's no visible label to read.
 */
export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-muted)]">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.tabs.map((tab) => {
              const active = isActive(pathname, tab.href);
              const Icon = tab.icon;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    title={collapsed ? tab.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]"
                        : "text-[var(--brand-muted)] hover:bg-[var(--brand-primary-tint)] hover:text-[var(--brand-ink)]"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
                    {!collapsed && (
                      <span className="truncate">{tab.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
