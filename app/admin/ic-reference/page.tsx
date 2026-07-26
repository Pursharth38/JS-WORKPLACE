// CMS migration M4 — /admin/ic-reference list.
import type { Metadata } from "next";
import Link from "next/link";

import { AdminEmpty, AdminPageHeader } from "@/components/admin/crud/list-page";
import { PublishToggle } from "@/components/admin/crud/publish-toggle";
import { ReorderButtons } from "@/components/admin/crud/reorder-buttons";
import { db } from "@/lib/db";
import { moveQuickReference, togglePublish } from "./actions";

export const metadata: Metadata = { title: "IC Quick Reference" };
export const dynamic = "force-dynamic";

export default async function AdminQuickReferencePage() {
  const rows = await db.quickReference.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, anchor: true, isPublished: true },
  });

  return (
    <div>
      <AdminPageHeader
        title="IC Quick Reference"
        description="The Internal Committee reference cards on /ic-quick-reference — timelines, composition rules, registers."
        helpText="These are short, at-a-glance reference cards for Internal Committee members — quick facts like 'how many days does the committee have to act' or 'who must sit on the committee'. Think of it as a cheat-sheet, separate from the longer POSH Hub guide, for someone who already knows the basics and just needs to check a specific rule fast."
        newHref="/admin/ic-reference/new"
        newLabel="New card"
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No cards in the database yet — the site is still serving the Sanity
          content.
        </AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {rows.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <ReorderButtons
                id={c.id}
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                action={moveQuickReference}
              />
              <Link
                href={`/admin/ic-reference/${c.id}`}
                className="min-w-0 flex-1 truncate text-[15px] hover:text-[var(--brand-primary)] hover:underline"
              >
                {c.title}
              </Link>
              <PublishToggle
                id={c.id}
                published={c.isPublished}
                action={togglePublish}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
