"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/**
 * P11-06 — click-to-load YouTube façade. The standard `<iframe
 * src="youtube.com/embed">` on page load ships roughly 1.5 MB of the embed
 * player's own JS before a visitor has expressed any intent to watch, which
 * is exactly the Lighthouse budget Dev A is accountable for. This renders a
 * static poster image until clicked; only then does a real iframe appear —
 * and it points at youtube-nocookie.com, which does not set tracking cookies
 * until playback actually starts.
 */
export function YouTubeLite({
  videoId,
  title,
  thumbnailUrl,
}: {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Play video: ${title}`}
      className="group relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-75"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[var(--brand-primary)] shadow-[var(--shadow-lg)] transition-transform duration-200 group-hover:scale-110">
          <Play size={22} strokeWidth={2} fill="currentColor" className="ml-1" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-left text-[14px] font-medium leading-snug text-white">
        {title}
      </span>
    </button>
  );
}
