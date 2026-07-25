import { defineField, defineType } from "sanity";

/**
 * ⚠️ REAL TESTIMONIALS ONLY.
 *
 * CLAUDE.md is explicit: never invent testimonials, client logos or
 * trained-employee counts. Every entry here must be something a real person
 * actually said, with their permission to publish it.
 */
export default defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      type: "text",
      rows: 4,
      description: "In their words, not ours.",
      validation: (r) => r.required().max(600),
    }),
    defineField({
      name: "authorName",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "authorRole",
      title: "Role",
      type: "string",
      description: "For example: HR Head. Optional.",
    }),
    defineField({
      name: "organization",
      type: "string",
      description:
        "Only fill this in if they have agreed to be named. Leave blank otherwise.",
    }),
    defineField({
      name: "consentOnFile",
      title: "Written permission to publish is on file",
      type: "boolean",
      initialValue: false,
      description:
        "Tick only when you have their written permission. Testimonials without this are not shown on the site.",
      validation: (r) =>
        r.custom((v) =>
          v === true
            ? true
            : "A testimonial cannot be published without written permission on file.",
        ),
    }),
    defineField({
      name: "order",
      type: "number",
      validation: (r) => r.required().min(1).integer(),
    }),
  ],
  orderings: [
    { title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "authorName", subtitle: "quote" } },
});
