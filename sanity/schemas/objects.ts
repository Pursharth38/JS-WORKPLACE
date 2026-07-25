import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Reusable content blocks that can appear inside Portable Text bodies
 * (Knowledge Hub sections, blog posts, service pages).
 */

export const calloutBox = defineType({
  name: "calloutBox",
  title: "Highlighted box",
  type: "object",
  fields: [
    defineField({
      name: "tone",
      type: "string",
      initialValue: "info",
      options: {
        list: [
          { title: "Information", value: "info" },
          { title: "Important", value: "warning" },
          { title: "Legal note", value: "legal" },
        ],
        layout: "radio",
      },
    }),
    defineField({ name: "title", type: "string" }),
    defineField({
      name: "body",
      type: "array",
      of: [{ type: "block" }],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "title", tone: "tone" },
    prepare: ({ title, tone }) => ({
      title: title || "Highlighted box",
      subtitle: tone,
    }),
  },
});

/**
 * A simple table. Sanity has no native table type, so this is rows of cells.
 * Used heavily by the IC Quick-Reference (timelines, penalties, composition).
 */
export const dataTable = defineType({
  name: "dataTable",
  title: "Table",
  type: "object",
  fields: [
    defineField({
      name: "caption",
      type: "string",
      description: "Describes the table for screen readers and for search engines.",
    }),
    defineField({
      name: "headers",
      title: "Column headings",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "rows",
      type: "array",
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          name: "row",
          fields: [
            defineField({
              name: "cells",
              type: "array",
              of: [{ type: "string" }],
              validation: (r) => r.required().min(1),
            }),
          ],
          preview: {
            select: { cells: "cells" },
            prepare: ({ cells }) => ({
              title: ((cells as string[]) ?? []).join(" · ") || "Empty row",
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { caption: "caption" },
    prepare: ({ caption }) => ({ title: caption || "Table" }),
  },
});

/** A CTA band the client can drop between Knowledge Hub groups. */
export const ctaBand = defineType({
  name: "ctaBand",
  title: "Call-to-action band",
  type: "object",
  fields: [
    defineField({ name: "heading", type: "string", validation: (r) => r.required() }),
    defineField({ name: "body", type: "text", rows: 2 }),
    defineField({
      name: "buttonLabel",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "buttonHref",
      title: "Button link",
      type: "string",
      description: "For example /book-demo or /services",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "afterGroup",
      title: "Show after which group",
      type: "string",
      description:
        "The Knowledge Hub group this band appears beneath. Leave blank to hide it.",
    }),
  ],
  preview: {
    select: { title: "heading", subtitle: "afterGroup" },
  },
});
