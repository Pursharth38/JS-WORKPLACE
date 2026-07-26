"use client";

// CMS migration M3 — blog post create/edit form.
import { useActionState, useRef } from "react";

import { deletePost, savePost } from "@/app/admin/blog/actions";
import {
  CheckboxField,
  HelpIcon,
  SelectField,
  SlugField,
  StringListField,
  TextAreaField,
  TextField,
} from "@/components/admin/crud/fields";
import { AiImageField } from "@/components/admin/crud/ai-image-field";
import { SaveBar } from "@/components/admin/crud/save-bar";
import { CRUD_IDLE } from "@/components/admin/crud/types";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uploadContentImage } from "@/components/admin/upload-image";

export function BlogForm({
  post,
  categories,
}: {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body: unknown;
    coverImageKey: string | null;
    coverImageAlt: string | null;
    categoryId: string | null;
    tags: string[];
    relatedHubAnchors: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    isPublished: boolean;
  } | null;
  categories: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState(savePost, CRUD_IDLE);
  const titleRef = useRef<HTMLDivElement>(null);

  return (
    <form action={formAction}>
      {post && <input type="hidden" name="id" value={post.id} />}

      <div ref={titleRef}>
        <TextField
          label="Title"
          name="title"
          defaultValue={post?.title}
          required
          help="The headline of your post — shown at the top of the article, in the blog list, and often as the clickable link in Google search results."
        />
      </div>
      <SlugField
        name="slug"
        defaultValue={post?.slug}
        sourceValue={() =>
          titleRef.current?.querySelector("input")?.value ?? ""
        }
        locked={!!post?.isPublished}
        lockWarning="This post is published — changing its slug breaks every shared link and its search ranking. Unlock only if you must."
        hint="Forms the URL: /blog/<slug>"
        help="The last part of the web address — e.g. /blog/your-slug-here. Keep it short and readable; it's part of what people see in a search result or a shared link, and changing it later breaks anyone who already bookmarked it."
      />
      <TextAreaField
        label="Excerpt"
        name="excerpt"
        defaultValue={post?.excerpt}
        required
        rows={2}
        hint="Shown on the blog list and in search results."
        help="A one- or two-sentence teaser summing up what the post covers. Shown under the title on the blog list, and often used by Google as the description under your search result."
      />

      <div className="mb-1.5 flex items-center gap-1.5">
        <p className="text-[14px] font-medium">Body</p>
        <HelpIcon text="The full article. Use the toolbar to add headings, bold text, links, images, callout boxes and tables — it will look on the live site exactly the way it looks here." />
      </div>
      <RichTextEditor
        name="body"
        initialValue={post?.body}
        onUploadImage={uploadContentImage}
        minHeight={360}
      />
      <div className="mb-4" />

      <AiImageField
        label="Cover image"
        name="coverImageKey"
        defaultKey={post?.coverImageKey}
        hint="Landscape, at least 1360px wide."
        contentType="blog post"
        sourceFields={[
          { name: "title", label: "Title" },
          { name: "excerpt", label: "Excerpt" },
        ]}
      />
      <TextField
        label="Cover image description"
        name="coverImageAlt"
        defaultValue={post?.coverImageAlt}
        hint="Alt text for screen readers."
        help="A short description of what's in the image, read aloud by screen readers and used by search engines. It's not shown visually on the page — e.g. 'A committee of five people in a meeting room.'"
      />

      <SelectField
        label="Category"
        name="categoryId"
        defaultValue={post?.categoryId ?? ""}
        options={[
          { value: "", label: "— No category —" },
          ...categories.map((c) => ({ value: c.id, label: c.title })),
        ]}
        hint="Manage categories from the blog list page."
        help="Groups this post with similar ones, e.g. under /blog/category/compliance. Purely for organising the blog — add or rename categories from the main blog list page."
      />

      <StringListField
        label="Tags"
        name="tags"
        defaultValue={post?.tags}
        rows={2}
        help="Extra keywords for this post, one per line. These help you find and group related posts later — they aren't shown to visitors on the current site design."
      />
      <StringListField
        label="Related POSH Hub anchors"
        name="relatedHubAnchors"
        defaultValue={post?.relatedHubAnchors}
        rows={2}
        hint="Anchor ids from /posh-act (e.g. ic-constitution) — rendered as related-reading links."
        help="Links this post to specific sections of the /posh-act guide, shown as 'related reading' at the end of the article. Use the anchor id from the POSH Hub — the part after the # in that section's web address."
      />

      <TextField
        label="SEO title"
        name="seoTitle"
        defaultValue={post?.seoTitle}
        hint="≤70 characters."
        help="What shows as the blue clickable headline in Google search results, if you want it different from the Title above. Leave blank to just reuse the Title."
      />
      <TextAreaField
        label="SEO description"
        name="seoDescription"
        defaultValue={post?.seoDescription}
        rows={2}
        hint="≤160 characters."
        help="The short grey summary shown under the title in Google search results. Leave blank and Google will pick a snippet from the post itself, which isn't always the most compelling."
      />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={post?.isPublished ?? false}
        hint="First publish stamps the post's date; unpublishing hides it without losing that date."
        help="When off, this post is a draft — saved here, but invisible to anyone visiting the public site. Switch it on to make it live on /blog. You can also flip this from the blog list without opening the post."
      />

      <SaveBar
        state={state}
        saveLabel={post ? "Save changes" : "Create post"}
        onDelete={post ? deletePost.bind(null, post.id) : undefined}
      />
    </form>
  );
}
