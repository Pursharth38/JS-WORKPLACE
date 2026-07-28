// ─────────────────────────────────────────────────────────────────────────────
// Geometric marks for the placeholder logos in the marquee.
//
// These are NOT anybody's real logo — they are abstract shapes drawn so the
// placeholder set occupies the same visual weight a real client logo will,
// which is the only way to judge the row's spacing and rhythm before the real
// marks arrive. See the warning at the top of logo-marquee.tsx.
//
// Every path uses `currentColor` so a mark inherits the muted/hover colour of
// its row item and follows the light/dark theme for free.
// ─────────────────────────────────────────────────────────────────────────────

export type LogoMarkName =
  | "chevron"
  | "orbit"
  | "diamond"
  | "spark"
  | "arch"
  | "grid"
  | "wave"
  | "prism"
  | "hex"
  | "ring"
  | "stack"
  | "blade";

const PATHS: Record<LogoMarkName, React.ReactNode> = {
  chevron: <path d="M3 15l6.5-7 4 4.5L20 5" />,
  orbit: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-28 12 12)" />
    </>
  ),
  diamond: <path d="M12 2.5L21.5 12 12 21.5 2.5 12z" />,
  spark: (
    <path d="M12 2.5c.9 5.6 3 7.7 8.6 8.6-5.6.9-7.7 3-8.6 8.6-.9-5.6-3-7.7-8.6-8.6 5.6-.9 7.7-3 8.6-8.6z" />
  ),
  arch: (
    <>
      <path d="M3.5 18a8.5 8.5 0 0117 0" />
      <path d="M2 21h20" />
    </>
  ),
  grid: (
    <>
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <circle cx="8" cy="16" r="2.6" />
      <circle cx="16" cy="16" r="2.6" />
    </>
  ),
  wave: (
    <>
      <path d="M2.5 14.5c3-5 6-5 9 0s6 5 9 0" />
      <path d="M2.5 9c3-5 6-5 9 0s6 5 9 0" opacity="0.45" />
    </>
  ),
  prism: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 3v16" opacity="0.45" />
    </>
  ),
  hex: <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" />,
  ring: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" opacity="0.45" />
    </>
  ),
  stack: (
    <>
      <path d="M12 3l8.5 4.5L12 12 3.5 7.5z" />
      <path d="M3.5 12.5L12 17l8.5-4.5" opacity="0.45" />
    </>
  ),
  blade: (
    <>
      <path d="M4 20C4 11.2 11.2 4 20 4c0 8.8-7.2 16-16 16z" />
      <path d="M9 15l7-7" opacity="0.45" />
    </>
  ),
};

export function LogoMark({ name }: { name: LogoMarkName }) {
  return (
    <svg
      aria-hidden="true"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {PATHS[name]}
    </svg>
  );
}
