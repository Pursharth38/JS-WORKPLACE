import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      title: "One-line summary",
      type: "text",
      rows: 2,
      description: "Shown on the services list and in search results.",
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: "order",
      title: "Position in the list",
      type: "number",
      validation: (r) => r.required().min(1).integer(),
    }),
    defineField({
      name: "icon",
      type: "string",
      description: "Optional short label or emoji shown on the service card.",
    }),
    defineField({
      name: "whoItIsFor",
      title: "Who this is for",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "whatIsCovered",
      title: "What is covered",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "format",
      title: "Format and duration",
      type: "string",
      description: "For example: half-day, on-site or online, up to 30 participants.",
    }),
    defineField({
      name: "body",
      title: "Full description",
      type: "array",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({ type: "calloutBox" }),
        defineArrayMember({ type: "dataTable" }),
      ],
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
    { title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "title", subtitle: "summary" } },
});
