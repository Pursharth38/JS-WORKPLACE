import { defineCliConfig } from "sanity/cli";

/**
 * Sanity CLI config — separate from `sanity.config.ts`, which configures the
 * Studio itself.
 *
 * This file exists purely so project-scoped CLI commands know which project they
 * are acting on. Without it every one of them fails with:
 *
 *     NotFoundError: No CLI config found at …
 *
 * Commands that need it: `sanity cors add`, `sanity dataset …`,
 * `sanity documents …`, `sanity deploy`.
 *
 * The projectId is NOT a secret — it is already exposed as
 * NEXT_PUBLIC_SANITY_PROJECT_ID and ships in the browser bundle. The literal is
 * a fallback so the CLI works even though it does not load our `.env`.
 *
 * ⚠️ This does not make the Studio standalone. The Studio stays embedded at
 * `app/studio/[[...tool]]/page.tsx` and is deployed with the Next app. Do NOT
 * run `sanity init` or `sanity deploy` expecting a separate studio — `init` in
 * particular will try to scaffold over `sanity.config.ts` and the `sanity/`
 * schema folder.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "7h7vbi97",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
});
