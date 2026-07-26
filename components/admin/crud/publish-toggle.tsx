"use client";

// Flips Published/Draft directly from a list screen. Same shape as
// ReorderButtons: a bound server action that does the write + cache bust,
// this component just calls it and refreshes the list.
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishToggle({
  id,
  published,
  action,
}: {
  id: string;
  published: boolean;
  /** Server action: flip this row's isPublished. */
  action: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      await action(id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={published}
      aria-label={
        published
          ? "Published — click to unpublish"
          : "Draft — click to publish"
      }
      title={
        published
          ? "Published — click to unpublish"
          : "Draft — click to publish"
      }
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-medium transition-opacity disabled:opacity-50"
      style={
        published
          ? {
              color: "var(--brand-success)",
              background: "var(--brand-success-soft)",
            }
          : { color: "var(--brand-muted)", background: "var(--brand-line)" }
      }
    >
      <span
        aria-hidden="true"
        className="relative h-3.5 w-6 shrink-0 rounded-full transition-colors"
        style={{
          background: published ? "var(--brand-success)" : "var(--brand-muted)",
        }}
      >
        <span
          className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-[left]"
          style={{ left: published ? "11px" : "2px" }}
        />
      </span>
      {published ? "Published" : "Draft"}
    </button>
  );
}
