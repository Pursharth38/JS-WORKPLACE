import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description:
        "The post's web address. Avoid changing it after publishing — old links will break.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
      description: "Shown on the blog list and in search results.",
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "coverImage",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "Describe the image for someone who cannot see it.",
          validation: (r) => r.required(),
        }),
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Published on",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Content",
      type: "array",
      validation: (r) => r.required(),
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Sub-heading", value: "h2" },
            { title: "Small heading", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  defineField({
                    name: "href",
                    type: "url",
                    validation: (r) =>
                      r.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "alt", type: "string", title: "Alt text" })],
        }),
        defineArrayMember({ type: "calloutBox" }),
        defineArrayMember({ type: "dataTable" }),
      ],
    }),
    defineField({
      name: "relatedHubAnchors",
      title: "Related Knowledge Hub sections",
      type: "array",
      of: [{ type: "reference", to: [{ type: "poshSection" }] }],
      description:
        "Linking a post back to the main guide helps both pages rank. Pick the sections this post relates to.",
    }),
    defineField({ name: "seoTitle", type: "string" }),
    defineField({
      name: "seoDescription",
      type: "text",
      rows: 2,
      validation: (r) => r.max(160),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "category.title", media: "coverImage" },
  },
});

export const category = defineType({
  name: "category",
  title: "Blog category",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 60 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", type: "text", rows: 2 }),
  ],
});
