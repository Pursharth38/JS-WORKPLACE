function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * The admin top-navbar identity card: initials avatar + the signed-in name,
 * rendered with a continuously shifting brand-colour gradient (`.gradient-text`
 * in globals.css). "3D" here means layered shadows (--shadow-sm + --shadow-lg
 * stacked, the same tokens every other card on the site already uses, just
 * combined) plus a hover lift — a raised, tactile card rather than a flat
 * label, without inventing a new shadow palette.
 */
export function UserNameCard({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[var(--brand-line)] bg-[var(--brand-elevated)] py-1.5 pl-1.5 pr-4 shadow-[var(--shadow-sm),var(--shadow-lg)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md),var(--shadow-lg)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-[13px] font-semibold text-white">
        {initials(name)}
      </span>
      <span className="gradient-text max-w-[160px] truncate text-[15px] font-semibold">
        {name}
      </span>
    </div>
  );
}
