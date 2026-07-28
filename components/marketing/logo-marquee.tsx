// ─────────────────────────────────────────────────────────────────────────────
// LOGO MARQUEE — two rows of organisation logos scrolling in opposite
// directions, from the reference recording the client sent.
//
// ⚠️ WHAT GOES IN `rows` IS A PUBLIC CLAIM.
//
// The reference is eLearnPOSH's "Trusted by Leading Organizations" wall, and
// the marks on it are THEIR clients — TCS, TATA, Lenovo, GE Appliances,
// The Economist. Reusing those here would assert that a competitor's customers
// are ours, which CLAUDE.md forbids twice over ("never invent client logos",
// "never lift from elearnposh.com") and which is a trademark problem
// independent of any house rule.
//
// So this component takes logos as DATA and renders nothing when the list is
// empty — the same discipline as StatBand. The placeholder set in
// lib/demo-content.ts exists so the layout and motion can be reviewed at real
// proportions; every one of those names is invented. Before launch, either
// replace them with logos the client has written permission to display, or
// delete the section from the page. Do not ship the placeholders live.
//
// Motion, spacing and the seamless-loop trick live in app/globals.css under
// "LOGO MARQUEE". This file is a server component and ships no JavaScript.
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from "@/lib/cn";
import { Container } from "./container";
import { LogoMark, type LogoMarkName } from "./logo-mark";

export type MarqueeLogo = {
  /** Wordmark text. Rendered as real text, so it stays crisp and themeable. */
  name: string;
  mark: LogoMarkName;
};

export function LogoMarquee({
  heading,
  subheading,
  rows,
  /** Seconds for one full cycle. Lower is faster. */
  durationSeconds = 34,
}: {
  heading?: string;
  subheading?: string;
  /** One array per row. Row 1 travels left, row 2 right, alternating. */
  rows: readonly (readonly MarqueeLogo[])[];
  durationSeconds?: number;
}) {
  const populated = rows.filter((row) => row.length > 0);
  if (populated.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      {(heading || subheading) && (
        <Container>
          <div className="mx-auto max-w-[60ch] text-center">
            {heading && (
              <h2 className="font-serif text-[27px] font-semibold md:text-[31px]">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="mt-3 text-[16px] leading-[1.6] text-[var(--brand-muted)]">
                {subheading}
              </p>
            )}
          </div>
        </Container>
      )}

      <div
        className={cn("space-y-8", (heading || subheading) && "mt-12")}
        // Full-bleed on purpose: the rows should run off both edges of the
        // page, not stop at the Container gutter, or the loop reads as a
        // carousel with a start and an end.
      >
        {populated.map((row, i) => (
          <MarqueeRow
            key={i}
            logos={row}
            reverse={i % 2 === 1}
            durationSeconds={durationSeconds}
          />
        ))}
      </div>
    </section>
  );
}

function MarqueeRow({
  logos,
  reverse,
  durationSeconds,
}: {
  logos: readonly MarqueeLogo[];
  reverse: boolean;
  durationSeconds: number;
}) {
  return (
    <div
      className={cn("logo-marquee", reverse && "logo-marquee--reverse")}
      style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
    >
      <div className="logo-marquee__track">
        <LogoGroup logos={logos} />
        {/* Three clones, not one: the keyframe travels -25% of the track, so
            four copies keep the row covered on displays up to three times the
            width of a single group. The CSS comment on `logo-marquee-scroll`
            has the arithmetic. Clones are identical content, so they are
            hidden from assistive tech — a screen reader should hear each
            organisation once, not four times. */}
        <LogoGroup logos={logos} clone />
        <LogoGroup logos={logos} clone />
        <LogoGroup logos={logos} clone />
      </div>
    </div>
  );
}

function LogoGroup({
  logos,
  clone = false,
}: {
  logos: readonly MarqueeLogo[];
  clone?: boolean;
}) {
  return (
    <ul
      className={cn("logo-marquee__group", clone && "logo-marquee__group--clone")}
      aria-hidden={clone || undefined}
    >
      {logos.map((logo) => (
        <li
          key={logo.name}
          className="flex shrink-0 items-center gap-2.5 text-[var(--brand-muted)] opacity-70 grayscale transition-[opacity,color] duration-300 hover:text-[var(--brand-ink)] hover:opacity-100"
        >
          <LogoMark name={logo.mark} />
          <span className="whitespace-nowrap font-serif text-[19px] font-semibold tracking-[-0.01em]">
            {logo.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
