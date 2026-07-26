/**
 * Sanity environment. Kept separate from lib/sanity.ts so the Studio config and
 * the app read exactly the same values.
 *
 * `apiVersion` is pinned to a date rather than "latest" on purpose: GROQ
 * semantics can change, and a silently-shifting API version is a content bug
 * that surfaces in production weeks after the deploy that caused it.
 *
 * ⚠️ These deliberately DO NOT throw when unset. The client's Sanity project
 * does not exist yet, and `next build` must stay green through Phases 1–3 —
 * the marketing shell has to render before there is any content to put in it.
 * `isSanityConfigured` is the single check every caller uses; `sanityFetch()`
 * returns the caller's fallback when it is false, so an unconfigured project
 * degrades to empty content rather than a 500 on every page.
 *
 * `NEXT_PUBLIC_FORCE_DEMO=true` reuses this exact same path to preview the
 * DESIGN against placeholder content on localhost even though a real Sanity
 * project is connected (this repo's `.env` has real, seeded content in it —
 * unsetting `NEXT_PUBLIC_SANITY_PROJECT_ID` to see demo content would also
 * break /studio). It does not touch Studio's own config below, only whether
 * the marketing pages treat Sanity as configured.
 */

const PLACEHOLDER_PROJECT_ID = "missing-project-id";

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-07-01";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/**
 * A syntactically valid placeholder, not an empty string: Sanity's
 * `createClient` and `defineConfig` both reject a malformed projectId at module
 * scope, which would turn a missing env var into a build failure.
 */
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? PLACEHOLDER_PROJECT_ID;

const forceDemo = process.env.NEXT_PUBLIC_FORCE_DEMO === "true";

export const isSanityConfigured =
  !forceDemo && projectId !== PLACEHOLDER_PROJECT_ID;

/** Server-only. Used for draft previews; never exposed to the browser. */
export const readToken = process.env.SANITY_API_READ_TOKEN ?? "";
