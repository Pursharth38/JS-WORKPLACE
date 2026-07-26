// ─────────────────────────────────────────────────────────────────────────────
// DEV C — P11-06. Public, no auth. Feeds the home page's YouTubeLite strip.
//
// Caching and the stale-on-failure fallback live in lib/youtube.ts, on the
// `fetch` call itself (Next's Data Cache), not here.
// ─────────────────────────────────────────────────────────────────────────────
import { getLatestVideos } from "@/lib/youtube";
import { apiError, apiResponse } from "@/lib/response";

export async function GET() {
  try {
    const videos = await getLatestVideos(3);
    return apiResponse(200, "OK", { videos });
  } catch (err) {
    return apiError("youtube/latest", err);
  }
}
