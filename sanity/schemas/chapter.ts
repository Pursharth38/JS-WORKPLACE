import { defineField, defineType } from "sanity";

export default defineType({
  name: "chapter",
  title: "Chapter",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "course",
      type: "reference",
      to: [{ type: "course" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Position in the course",
      type: "number",
      description:
        "1 is the first chapter. Learners must finish chapter 1 before chapter 2 unlocks, so this order controls the whole course path.",
      validation: (r) => r.required().min(1).integer(),
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "passThreshold",
      title: "Chapter assessment pass mark (%)",
      type: "number",
      initialValue: 80,
      description:
        "Percentage needed to pass this chapter's assessment and unlock the next chapter.",
      validation: (r) => r.required().min(1).max(100),
    }),
  ],
  orderings: [
    {
      title: "Course, then order",
      name: "courseOrder",
      by: [
        { field: "course.title", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { title: "title", order: "order", course: "course.title" },
    prepare: ({ title, order, course }) => ({
      title: `${order}. ${title}`,
      subtitle: course,
    }),
  },
});
