import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { PostCard } from "@/components/marketing/post-card";
import { getCategories, getPosts } from "@/lib/sanity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guidance on the POSH Act — Internal Committee procedure, employer duties, timelines and compliance.",
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getPosts(),
    getCategories(),
  ]);

  return (
    <Container className="py-14">
      <h1 className="font-serif text-[39px] font-semibold">Blog</h1>
      <p className="mt-4 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
        Notes on the POSH Act and what it means in practice — written for the
        people who have to apply it.
      </p>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/blog/category/${c.slug}`}
                  className="inline-flex rounded-full border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-4 py-1.5 text-[15px] font-medium text-[var(--brand-muted)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {posts.length > 0 ? (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p._id}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-[17px] text-[var(--brand-muted)]">
          The first posts are on their way.
        </p>
      )}

      <section className="mt-16 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:p-8">
        <h2 className="font-serif text-[25px] font-semibold">
          Get the monthly POSH update
        </h2>
        <p className="mt-2 max-w-[52ch] text-[17px] leading-[1.6] text-[var(--brand-muted)]">
          One email a month: what changed, what it means for employers, and
          anything worth acting on. No sales pitch.
        </p>
        <div className="mt-6 max-w-md">
          <NewsletterForm />
        </div>
      </section>
    </Container>
  );
}
