// ─────────────────────────────────────────────────────────────────────────────
// SITE INTRO — the entry animation, adapted from the Vite prototype's Loader.
//
// The prototype's version was a client component holding the whole router
// hostage: `{loaderDone && <Routes/>}` meant nothing rendered — not the H1, not
// the copy, nothing a crawler could read — until a 3.2s JS timer fired, and a
// failed bundle left a blank page forever.
//
// This is a SERVER component and renders no state at all. The curtain is markup
// on top of a fully server-rendered page, and app/globals.css lifts it with an
// `animation-fill-mode: forwards` keyframe. Nothing here needs JavaScript, so
// nothing here can fail to un-render. `aria-hidden` keeps it out of the
// accessibility tree entirely — the page underneath is the real content, and
// this is decoration over it.
//
// The one enhancement that IS scripted lives in app/layout.tsx: a five-line
// inline script that stamps `data-intro="seen"` on <html> after the first paint
// of a session, which the stylesheet reads to skip the curtain on every
// subsequent page load. Without that script the curtain simply plays again —
// the degraded path is "slightly repetitive", not "broken".
// ─────────────────────────────────────────────────────────────────────────────

/** Default tagline. Deliberately our own voice, and claim-free — see below. */
const DEFAULT_TAGLINE = "Workplace training that stands up to scrutiny";

export function SiteIntro({
  wordmark,
  tagline = DEFAULT_TAGLINE,
}: {
  /** Usually settings.businessName, so the curtain follows the CMS. */
  wordmark: string;
  tagline?: string;
}) {
  return (
    <div className="site-intro" aria-hidden="true">
      <div className="site-intro__mesh" />

      <p className="site-intro__wordmark">{wordmark}</p>

      <p className="site-intro__tagline">
        <span className="site-intro__type">
          {/* Reserves the final width — see the CSS comment on __type-ghost. */}
          <span className="site-intro__type-ghost">{tagline}</span>
          <span
            className="site-intro__type-ink"
            // One step per character, so the reveal lands on letter boundaries
            // instead of sliding continuously. A proportional face makes the
            // steps slightly uneven; that reads as typing rhythm, not as a bug.
            // If the custom property is ever dropped the keyframe falls back to
            // a smooth wipe rather than breaking.
            style={
              { "--intro-steps": tagline.length } as React.CSSProperties
            }
          >
            {tagline}
          </span>
        </span>
      </p>
    </div>
  );
}
