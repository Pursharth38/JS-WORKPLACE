import { defineField, defineType } from "sanity";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({
      name: "question",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "answer",
      type: "array",
      of: [{ type: "block" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      initialValue: "General",
      options: {
        list: [
          "General",
          "The POSH Act",
          "Training and sessions",
          "The course and certificate",
          "Payment and refunds",
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      validation: (r) => r.required().min(1).integer(),
    }),
  ],
  orderings: [
    {
      title: "Category, then order",
      name: "categoryOrder",
      by: [
        { field: "category", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: { select: { title: "question", subtitle: "category" } },
});
