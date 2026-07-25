import { getPosts, getSiteSettings } from "@/lib/sanity";

export const revalidate = 3600;

/**
 * RSS 2.0 feed at /feed.xml.
 *
 * Hand-rolled rather than pulling a feed library: the output is ~20 lines of
 * XML and a dependency here would be more surface than the feature.
 *
 * Everything interpolated is escaped — a post title containing an ampersand or
 * an angle bracket would otherwise produce invalid XML that every reader
 * silently rejects, which is the kind of bug nobody notices for months.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [posts, settings] = await Promise.all([
    getPosts(50),
    getSiteSettings(),
  ]);

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${site}/blog/${escapeXml(post.slug)}</link>
      <guid isPermaLink="true">${site}/blog/${escapeXml(post.slug)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>${
        post.category
          ? `\n      <category>${escapeXml(post.category.title)}</category>`
          : ""
      }
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.businessName)} — Blog</title>
    <link>${site}/blog</link>
    <description>Practical guidance on the POSH Act for Indian employers.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
