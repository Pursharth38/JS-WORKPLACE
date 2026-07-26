import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/marketing/container";
import { PostCard } from "@/components/marketing/post-card";
import { getCategories, getPostsByCategory } from "@/lib/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ cat: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cat: string }>;
}): Promise<Metadata> {
  const { cat } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === cat);
  if (!category) return { title: "Category not found" };

  return {
    title: category.title,
    description:
      category.description ?? `Posts about ${category.title.toLowerCase()}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ cat: string }>;
}) {
  const { cat } = await params;
  const [categories, posts] = await Promise.all([
    getCategories(),
    getPostsByCategory(cat),
  ]);

  const category = categories.find((c) => c.slug === cat);
  if (!category) notFound();

  return (
    <Container className="py-14">
      <nav aria-label="Breadcrumb" className="text-[15px]">
        <Link
          href="/blog"
          className="text-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
        >
          Blog
        </Link>
        <span aria-hidden="true" className="px-2 text-[var(--brand-muted)]">
          /
        </span>
        <span className="text-[var(--brand-ink)]">{category.title}</span>
      </nav>

      <h1 className="mt-4 font-serif text-[39px] font-semibold">
        {category.title}
      </h1>
      {category.description && (
        <p className="mt-4 max-w-[62ch] text-[19px] leading-[1.6] text-[var(--brand-muted)]">
          {category.description}
        </p>
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
          Nothing here yet.{" "}
          <Link
            href="/blog"
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            Back to all posts
          </Link>
          .
        </p>
      )}
    </Container>
  );
}
