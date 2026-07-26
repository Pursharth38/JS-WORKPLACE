"use client";

// CMS migration M3 — blog post create/edit form.
import { useActionState, useRef } from "react";

import { deletePost, savePost } from "@/app/admin/blog/actions";
import {
  CheckboxField,
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
      />
      <TextAreaField
        label="Excerpt"
        name="excerpt"
        defaultValue={post?.excerpt}
        required
        rows={2}
        hint="Shown on the blog list and in search results."
      />

      <p className="mb-1.5 text-[14px] font-medium">Body</p>
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
      />

      <StringListField
        label="Tags"
        name="tags"
        defaultValue={post?.tags}
        rows={2}
      />
      <StringListField
        label="Related POSH Hub anchors"
        name="relatedHubAnchors"
        defaultValue={post?.relatedHubAnchors}
        rows={2}
        hint="Anchor ids from /posh-act (e.g. ic-constitution) — rendered as related-reading links."
      />

      <TextField
        label="SEO title"
        name="seoTitle"
        defaultValue={post?.seoTitle}
        hint="≤70 characters."
      />
      <TextAreaField
        label="SEO description"
        name="seoDescription"
        defaultValue={post?.seoDescription}
        rows={2}
        hint="≤160 characters."
      />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={post?.isPublished ?? false}
        hint="First publish stamps the post's date; unpublishing hides it without losing that date."
      />

      <SaveBar
        state={state}
        saveLabel={post ? "Save changes" : "Create post"}
        onDelete={post ? deletePost.bind(null, post.id) : undefined}
      />
    </form>
  );
}
