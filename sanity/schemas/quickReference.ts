import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * IC Member Quick-Reference (E4) — timelines, penalties and committee
 * composition as scannable tables.
 *
 * Its own document type rather than a `poshSection`, because the two are read
 * differently: the Knowledge Hub is read once, top to bottom; this page is
 * something an IC member opens mid-inquiry to check a deadline. Mixing them
 * would force one page's structure onto the other.
 *
 * Content lives in Sanity, not in JSX — the client will want to update a
 * timeline or a penalty figure without waiting for a deploy.
 */
export default defineType({
  name: "quickReference",
  title: "IC quick-reference card",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "For example: Inquiry timelines, or Committee composition.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "anchor",
      title: "Link ID",
      type: "slug",
      options: { source: "title", maxLength: 60 },
      description:
        "⚠️ Becomes a permanent web address people bookmark. Do not change it once the page is live.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      validation: (r) => r.required().min(1).integer(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 2,
      description: "One line of context above the table.",
    }),
    defineField({
      name: "body",
      title: "Tables and notes",
      type: "array",
      validation: (r) => r.required(),
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({ type: "dataTable" }),
        defineArrayMember({ type: "calloutBox" }),
      ],
    }),
  ],
  orderings: [
    { title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "title", subtitle: "intro" } },
});
