"use client";

// CMS migration M3 — inline category manager on the blog list page.
import { useActionState } from "react";

import { deleteCategory, saveCategory } from "@/app/admin/blog/actions";
import { CrudAlert } from "@/components/admin/crud/save-bar";
import { CRUD_IDLE } from "@/components/admin/crud/types";

export function CategoryManager({
  categories,
}: {
  categories: { id: string; title: string; postCount: number }[];
}) {
  const [state, formAction] = useActionState(saveCategory, CRUD_IDLE);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-5">
      <h2 className="mb-3 text-[17px] font-semibold">Categories</h2>

      {categories.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-[14px]">
              <span className="min-w-0 flex-1 truncate">
                {c.title}
                <span className="ml-1.5 text-[var(--brand-muted)]">
                  ({c.postCount})
                </span>
              </span>
              {c.postCount === 0 && (
                <button
                  type="button"
                  onClick={() => deleteCategory(c.id)}
                  className="text-[13px] text-[var(--brand-danger)] hover:underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={formAction}>
        <CrudAlert state={state} />
        <div className="flex gap-2">
          <input
            name="title"
            required
            placeholder="New category name"
            aria-label="New category name"
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-3 py-2 text-[14px] outline-none focus:border-[var(--brand-primary)]"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] border border-[var(--brand-line)] px-3 py-2 text-[14px] font-medium hover:bg-[var(--brand-line)]"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
