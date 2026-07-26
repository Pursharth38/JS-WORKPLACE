import { ExternalLink } from "lucide-react";

import { type InstagramPost, urlForImage } from "@/lib/content";

/**
 * P11-07 — Sanity-managed grid of Instagram post URLs. Static images linking
 * out to the real post; no live API, no auto-refresh. See
 * sanity/schemas/instagramPost.ts for why (Basic Display API tokens expire
 * every 60 days and fail silently).
 *
 * Renders nothing when there are no posts — same pattern as StatBand for
 * uninvented statistics and TestimonialSection for testimonials: an empty
 * section is honest, a placeholder grid of fake posts is not.
 */
export function InstaGrid({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {posts.map((post) => (
        <li key={post._id}>
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--brand-line)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlForImage(post.image).width(320).height(320).url()}
              alt={post.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100"
            >
              <ExternalLink size={20} strokeWidth={1.75} />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
