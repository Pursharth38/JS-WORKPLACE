import { defineField, defineType } from "sanity";

export default defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description:
        "The course URL. Once people have bought or linked to it, changing this breaks those links.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      title: "Short summary",
      type: "text",
      rows: 3,
      description: "One or two sentences. Shown on the course card and in search results.",
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: "description",
      title: "Full description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "coverImage",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          description: "Describe the image for someone who cannot see it.",
          validation: (r) => r.required(),
        }),
      ],
    }),
    defineField({
      name: "learningOutcomes",
      title: "What learners will be able to do",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "durationMinutes",
      title: "Total duration (minutes)",
      type: "number",
      validation: (r) => r.min(0),
    }),
    defineField({
      name: "priceInPaise",
      title: "Price (in paise)",
      type: "number",
      description:
        "₹4,999 is entered as 499900. This is the ONLY place the price is set — the checkout reads it from here, never from the browser.",
      validation: (r) => r.required().min(0).integer(),
    }),
    defineField({
      name: "passThreshold",
      title: "Final test pass mark (%)",
      type: "number",
      initialValue: 85,
      description:
        "Percentage needed to pass the final test and earn the certificate.",
      validation: (r) => r.required().min(1).max(100),
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      initialValue: false,
      description: "Unpublished courses cannot be bought and are hidden from the site.",
    }),
    defineField({
      name: "faqs",
      title: "Course FAQs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "question", type: "string", validation: (r) => r.required() }),
            defineField({ name: "answer", type: "text", rows: 3, validation: (r) => r.required() }),
          ],
          preview: { select: { title: "question" } },
        },
      ],
    }),
    defineField({
      name: "seoTitle",
      title: "SEO title (optional)",
      type: "string",
      description: "Leave blank to use the course title.",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description (optional)",
      type: "text",
      rows: 2,
      validation: (r) => r.max(160),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current", media: "coverImage" },
  },
});
