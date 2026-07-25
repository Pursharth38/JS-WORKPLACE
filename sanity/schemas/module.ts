import { defineField, defineType } from "sanity";

export default defineType({
  name: "module",
  title: "Module (lesson)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "chapter",
      type: "reference",
      to: [{ type: "chapter" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Position in the chapter",
      type: "number",
      description:
        "1 is the first lesson in this chapter. Learners unlock these in order.",
      validation: (r) => r.required().min(1).integer(),
    }),
    defineField({
      name: "videoUid",
      title: "Cloudflare Stream video ID",
      type: "string",
      description:
        "Paste the video ID from Cloudflare Stream. Without it the lesson has no video.",
    }),
    defineField({
      name: "durationSeconds",
      title: "Video length (seconds)",
      type: "number",
      description:
        "Must match the real video length. A lesson counts as complete at 90% watched, so a wrong number here makes the lesson impossible or too easy to complete.",
      validation: (r) => r.required().min(1).integer(),
    }),
    defineField({
      name: "isFreePreview",
      title: "Free preview",
      type: "boolean",
      initialValue: false,
      description:
        "Anyone can watch this lesson without buying the course. Use it for one lesson per course, as a sample.",
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "resources",
      title: "Downloadable resources",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", type: "string", validation: (r) => r.required() }),
            defineField({ name: "file", type: "file" }),
          ],
          preview: { select: { title: "label" } },
        },
      ],
    }),
  ],
  orderings: [
    {
      title: "Chapter, then order",
      name: "chapterOrder",
      by: [
        { field: "chapter.order", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      order: "order",
      chapter: "chapter.title",
      free: "isFreePreview",
    },
    prepare: ({ title, order, chapter, free }) => ({
      title: `${order}. ${title}${free ? "  ·  free preview" : ""}`,
      subtitle: chapter,
    }),
  },
});
