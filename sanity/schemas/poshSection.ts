import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * One H2 section of the Knowledge Hub (`/posh-act`) — the SEO centerpiece.
 * Each section is its own document so the client can add, edit and reorder
 * without a deploy.
 *
 * Groups are fixed and ordered; the list mirrors
 * .claude/documentation/feature-inventory/knowledge-hub.md.
 */
export const POSH_GROUPS = [
  "Compliance",
  "Policy",
  "Internal Committee",
  "Local Committee",
  "Definitions",
  "Complaints",
  "Redressal",
  "False Complaints",
  "Confidentiality",
  "Appeal",
  "Background",
] as const;

export default defineType({
  name: "poshSection",
  title: "POSH Knowledge Hub section",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Section heading",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "anchor",
      title: "Link ID",
      type: "slug",
      options: { source: "title", maxLength: 60 },
      description:
        "⚠️ This becomes a permanent web address, like /posh-act#ic-constitution. People bookmark and share these links. Once this page is live, NEVER change it — the old link will stop working.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "group",
      type: "string",
      options: { list: [...POSH_GROUPS] },
      description: "Which part of the guide this section belongs under.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Position within the group",
      type: "number",
      description: "1 appears first within its group.",
      validation: (r) => r.required().min(1).integer(),
    }),
    defineField({
      name: "summary",
      title: "One-line summary",
      type: "text",
      rows: 2,
      description:
        "Optional. Shown under the heading and used as the search-result description.",
      validation: (r) => r.max(300),
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
            { title: "Sub-heading", value: "h3" },
            { title: "Small heading", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bulleted", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
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
        defineArrayMember({ type: "calloutBox" }),
        defineArrayMember({ type: "dataTable" }),
      ],
    }),
    defineField({
      name: "isFaq",
      title: "Show this as a question in search results",
      type: "boolean",
      initialValue: false,
      description:
        "Tick if the heading is phrased as a question. Helps it appear as an expandable answer on Google.",
    }),
  ],
  orderings: [
    {
      title: "Group, then order",
      name: "groupOrder",
      by: [
        { field: "group", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: { title: "title", group: "group", order: "order" },
    prepare: ({ title, group, order }) => ({
      title,
      subtitle: `${group} · ${order}`,
    }),
  },
});
