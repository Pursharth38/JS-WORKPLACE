import { defineField, defineType } from "sanity";

/**
 * H2 CONTRACT — Dev C builds the assessment engine against this shape.
 *
 * `options[].isCorrect` NEVER reaches the browser. `/api/assessment/start`
 * strips it before serialising, and grading happens only on the server in
 * `/api/assessment/submit`. Do not add a GROQ projection anywhere that selects
 * it for a client component.
 */
export default defineType({
  name: "question",
  title: "Assessment question",
  type: "document",
  fields: [
    defineField({
      name: "text",
      title: "Question",
      type: "text",
      rows: 2,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "chapter",
      type: "reference",
      to: [{ type: "chapter" }],
      description:
        "Which chapter's assessment this belongs to. Leave blank for a final-test question.",
    }),
    defineField({
      name: "course",
      type: "reference",
      to: [{ type: "course" }],
      description: "Required for final-test questions.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "isFinalTest",
      title: "Final test question",
      type: "boolean",
      initialValue: false,
      description:
        "Tick for the end-of-course test. Leave unticked for a chapter assessment.",
    }),
    defineField({
      name: "topic",
      type: "string",
      description:
        "A short label like 'IC constitution'. Learners who fail are told which topics to revisit, so keep these consistent.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "options",
      title: "Answer options",
      type: "array",
      validation: (r) =>
        r
          .required()
          .min(2)
          .max(6)
          .custom((options) => {
            const list = (options ?? []) as Array<{ isCorrect?: boolean }>;
            const correct = list.filter((o) => o?.isCorrect === true).length;
            if (correct === 0) return "Mark exactly one option as correct.";
            if (correct > 1) return "Only one option may be marked correct.";
            return true;
          }),
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "text",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "isCorrect",
              title: "This is the correct answer",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: "text", correct: "isCorrect" },
            prepare: ({ title, correct }) => ({
              title: `${correct ? "✓ " : ""}${title}`,
            }),
          },
        },
      ],
    }),
    defineField({
      name: "explanation",
      title: "Why this is the answer",
      type: "text",
      rows: 3,
      description:
        "Shown after the assessment is submitted. Optional, but it turns a wrong answer into a teaching moment.",
    }),
  ],
  preview: {
    select: { title: "text", topic: "topic", final: "isFinalTest" },
    prepare: ({ title, topic, final }) => ({
      title,
      subtitle: `${topic ?? "no topic"}${final ? "  ·  final test" : ""}`,
    }),
  },
});
