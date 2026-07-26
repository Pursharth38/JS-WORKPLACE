// CMS migration M1e — shared chrome for every /admin screen.
//
// requireAdmin() runs HERE for every admin render (database role re-read, not
// the 30-day JWT) — and each mutation re-checks it again in its own Server
// Action, because a layout guard alone protects reads, not writes.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/(learner)/actions";
import { AdminSidebar } from "@/components/admin/sidebar";
import { UserNameCard } from "@/components/admin/user-name-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const user = await db.user.findUnique({
    where: { id: admin.userId },
    select: { name: true },
  });
  const name = user?.name ?? "Admin";

  return (
    <div className="flex min-h-screen bg-[var(--brand-surface)]">
      <AdminSidebar role={admin.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--brand-line)] bg-[var(--brand-elevated)] px-6 py-3.5">
          <p className="text-[15px] text-[var(--brand-muted)]">
            Welcome back,{" "}
            <span className="font-semibold text-[var(--brand-ink)]">
              {name}
            </span>
          </p>

          <div className="flex items-center gap-3.5">
            <ThemeToggle />
            <UserNameCard name={name} />
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-muted)] transition-colors hover:bg-[var(--brand-danger-soft)] hover:text-[var(--brand-danger)]"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
