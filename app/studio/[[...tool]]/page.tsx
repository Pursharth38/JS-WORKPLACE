/**
 * Sanity Studio, embedded at /studio.
 *
 * `force-static` + `dynamic = "force-static"` is what next-sanity recommends:
 * the Studio is a single-page app that boots client-side, so there is nothing
 * for the server to render per request.
 *
 * ⚠️ /studio is excluded from the auth middleware matcher. Sanity authenticates
 * its own users — wrapping it in our session check would lock the client out.
 */
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
