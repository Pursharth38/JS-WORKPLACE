import { defineField, defineType } from "sanity";

/**
 * P11-07 — Sanity-managed Instagram grid, NOT the Basic Display API.
 *
 * DETAILED-PLAN.md §F7 / ARCHITECTURE.md §7 present this tradeoff explicitly:
 * the Basic Display API's token expires every 60 days and fails silently on a
 * weekend with nobody watching. This is less "live" — she pastes a post URL
 * and an image after posting, rather than it appearing automatically — but it
 * never breaks unattended. Recommended over the live API for that reason.
 */
export default defineType({
  name: "instagramPost",
  title: "Instagram post",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "permalink",
      title: "Link to the post",
      type: "url",
      description: "The actual instagram.com/p/... URL — opens in a new tab.",
      validation: (r) =>
        r.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "caption",
      title: "Alt text / caption",
      type: "string",
      description: "Shown to screen readers and as the image's alt text.",
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: "order",
      title: "Position in the grid",
      type: "number",
      validation: (r) => r.required().min(1).integer(),
    }),
  ],
  orderings: [
    { title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "caption", media: "image" },
  },
});
