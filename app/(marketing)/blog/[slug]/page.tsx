import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { PostCard, formatDate } from "@/components/marketing/post-card";
import { ProseBlock } from "@/components/marketing/prose-block";
import { ReadingProgress } from "@/components/marketing/reading-progress";
import { readingTimeMinutes } from "@/lib/reading-time";
import { getPostBySlug, getPosts, getRelatedPosts } from "@/lib/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category?.slug, post._id);
  const minutes = readingTimeMinutes(post.body);

  return (
    <>
      <ReadingProgress />

      <Container className="py-12" measure>
        <article>
          <header>
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="text-[14px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]"
              >
                {post.category.title}
              </Link>
            )}

            <h1 className="mt-3 font-serif text-[39px] font-semibold leading-[1.15]">
              {post.title}
            </h1>

            <p className="mt-4 text-[19px] leading-[1.6] text-[var(--brand-muted)]">
              {post.excerpt}
            </p>

            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-[var(--brand-muted)]">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              <span aria-hidden="true">·</span>
              <span>{minutes} min read</span>
            </p>
          </header>

          {post.coverImageWideUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.coverImageWideUrl}
              alt={post.coverImageAlt ?? ""}
              width={1360}
              height={720}
              className="mt-8 w-full rounded-[var(--radius-lg)]"
            />
          )}

          <div className="mt-8">
            <ProseBlock value={post.body} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-[var(--brand-primary-tint)] px-3 py-1 text-[14px] text-[var(--brand-primary)]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {/*
            Cluster → pillar linking. Blog posts are the clusters; the Knowledge
            Hub is the pillar. These links are the whole point of the content
            strategy, so they are a first-class field in Sanity, not an
            afterthought the author has to remember to add inline.
          */}
          {post.relatedHubAnchors && post.relatedHubAnchors.length > 0 && (
            <aside className="mt-12 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6">
              <h2 className="font-serif text-[20px] font-semibold">
                More detail in the POSH Act guide
              </h2>
              <ul className="mt-3 space-y-2">
                {post.relatedHubAnchors.map((s) => (
                  <li key={s.anchor}>
                    <Link
                      href={`/posh-act#${s.anchor}`}
                      className="text-[17px] text-[var(--brand-primary)] underline underline-offset-2"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </article>
      </Container>

      <Container>
        <CtaBand
          heading="Need this applied to your organisation?"
          body="A short conversation is usually enough to work out what you actually need."
          buttonLabel="Book a consultation"
          buttonHref="/book-demo"
        />
      </Container>

      {related.length > 0 && (
        <Container className="pb-16">
          <h2 className="font-serif text-[25px] font-semibold">
            Related reading
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p._id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </>
  );
}
