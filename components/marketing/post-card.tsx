import Link from "next/link";

import { Card } from "@/components/ui/card";
import { BorderBeam } from "@/components/motion/border-beam";
import { type PostSummary, urlForImage } from "@/lib/content";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <BorderBeam className="h-full">
      <Card className="group relative h-full overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]">
        {post.coverImage?.asset && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlForImage(post.coverImage).width(640).height(360).url()}
            alt={post.coverImage.alt ?? ""}
            width={640}
            height={360}
            className="h-44 w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="p-5">
          {post.category && (
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              {post.category.title}
            </p>
          )}

          <h3 className="mt-2 font-serif text-[20px] font-semibold leading-snug">
            <Link
              href={`/blog/${post.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {post.title}
            </Link>
          </h3>

          <p className="mt-2 line-clamp-3 text-[16px] leading-[1.6] text-[var(--brand-muted)]">
            {post.excerpt}
          </p>

          <time
            dateTime={post.publishedAt}
            className="mt-3 block text-[14px] text-[var(--brand-muted)]"
          >
            {formatDate(post.publishedAt)}
          </time>
        </div>
      </Card>
    </BorderBeam>
  );
}
