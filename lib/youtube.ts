import "server-only";

/**
 * Dev C, Phase 11 (P11-06). YouTube Data API v3 — latest uploads for the lite
 * façade component. Consumed by app/api/youtube/latest/route.ts only; never
 * imported into a client component (would ship the API key's request path,
 * and there is no reason a browser needs to call Google directly).
 *
 * CACHING: `fetch` here uses Next's Data Cache with a 6h `revalidate`, not a
 * hand-rolled in-memory cache — the API route runs on serverless functions
 * with no shared memory between invocations, so an in-process cache would
 * miss almost every time anyway. Next's Data Cache persists across
 * invocations on Vercel and gives us the "serve the last cached payload on
 * failure" behaviour from ARCHITECTURE.md for free: when a background
 * revalidation fetch fails after the window expires, Next keeps serving the
 * previous cached response rather than surfacing the error. The try/catch
 * below is the second line of defence, for a cold cache with no prior
 * success to fall back to.
 */

const API_URL = "https://www.googleapis.com/youtube/v3/search";
const REVALIDATE_SECONDS = 6 * 60 * 60; // 6h, per ARCHITECTURE.md

export type YoutubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
};

export const isYoutubeConfigured =
  !!process.env.YOUTUBE_API_KEY && !!process.env.YOUTUBE_CHANNEL_ID;

type SearchResponse = {
  items?: {
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
  }[];
};

/**
 * Degrades to an empty list — never throws — so the home page's YouTube strip
 * simply doesn't render when the channel isn't configured or the API call
 * fails with nothing cached yet. Same pattern as `sanityFetch`'s fallback.
 */
export async function getLatestVideos(limit = 3): Promise<YoutubeVideo[]> {
  if (!isYoutubeConfigured) return [];

  const url = new URL(API_URL);
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  url.searchParams.set("channelId", process.env.YOUTUBE_CHANNEL_ID!);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("order", "date");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(limit));

  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["youtube-latest"] },
    });

    if (!res.ok) {
      console.error("[youtube:latest]", res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as SearchResponse;

    return (data.items ?? [])
      .filter((item): item is Required<SearchResponse>["items"][number] =>
        Boolean(item.id?.videoId && item.snippet?.title),
      )
      .map((item) => ({
        id: item.id!.videoId!,
        title: item.snippet!.title!,
        publishedAt: item.snippet!.publishedAt ?? "",
        thumbnailUrl:
          item.snippet!.thumbnails?.high?.url ??
          item.snippet!.thumbnails?.medium?.url ??
          `https://i.ytimg.com/vi/${item.id!.videoId!}/hqdefault.jpg`,
      }));
  } catch (err) {
    console.error("[youtube:latest]", err);
    return [];
  }
}
