import { defineField, defineType } from "sanity";

/**
 * Singleton. The desk structure pins this to one document so the client cannot
 * accidentally create a second copy and wonder why her phone number did not
 * change.
 *
 * ⚠️ EVERY contact detail on the site reads from here. platform-agent.md forbids
 * hardcoding the WhatsApp number, phone or email into JSX — if it is in a
 * component, she cannot change it without a developer.
 */
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "contact", title: "Contact details", default: true },
    { name: "social", title: "Social links" },
    { name: "marketing", title: "Homepage & banners" },
    { name: "legal", title: "Business details" },
  ],
  fields: [
    // ── Contact ────────────────────────────────────────────────────────────
    defineField({
      name: "businessName",
      type: "string",
      group: "contact",
      initialValue: "JS Workplace Wellness",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "email",
      title: "Contact email",
      type: "string",
      group: "contact",
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone number",
      type: "string",
      group: "contact",
      description: "Shown on the contact page. Include the country code.",
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number",
      type: "string",
      group: "contact",
      description:
        "Digits only, including country code, e.g. 919876543210. This powers the floating WhatsApp button.",
      validation: (r) =>
        r.regex(/^[0-9]{10,15}$/, {
          name: "digits only",
          invert: false,
        }),
    }),
    defineField({
      name: "whatsappDefaultMessage",
      title: "WhatsApp pre-filled message",
      type: "string",
      group: "contact",
      initialValue: "Hi, I'd like to know more about your POSH training.",
      description: "What the visitor's message box is pre-filled with.",
    }),
    defineField({
      name: "addressLines",
      title: "Address",
      type: "array",
      of: [{ type: "string" }],
      group: "contact",
    }),

    // ── Social ─────────────────────────────────────────────────────────────
    defineField({ name: "linkedinUrl", title: "LinkedIn", type: "url", group: "social" }),
    defineField({ name: "instagramUrl", title: "Instagram", type: "url", group: "social" }),
    defineField({ name: "youtubeUrl", title: "YouTube", type: "url", group: "social" }),

    // ── Marketing ──────────────────────────────────────────────────────────
    defineField({
      name: "announcement",
      title: "Announcement bar",
      type: "object",
      group: "marketing",
      description: "A thin banner across the top of every page. Leave off when unused.",
      fields: [
        defineField({ name: "enabled", type: "boolean", initialValue: false }),
        defineField({ name: "text", type: "string" }),
        defineField({ name: "href", title: "Link", type: "string" }),
      ],
    }),
    defineField({
      name: "heroHeading",
      type: "string",
      group: "marketing",
      description: "The main headline on the homepage.",
    }),
    defineField({
      name: "heroSubheading",
      type: "text",
      rows: 3,
      group: "marketing",
    }),
    defineField({
      name: "heroPrimaryCtaLabel",
      type: "string",
      group: "marketing",
      initialValue: "Book a consultation",
    }),
    defineField({
      name: "heroPrimaryCtaHref",
      type: "string",
      group: "marketing",
      initialValue: "/book-demo",
    }),

    // ── Legal / business ───────────────────────────────────────────────────
    defineField({
      name: "legalEntityName",
      title: "Registered business name",
      type: "string",
      group: "legal",
      description: "Used on invoices and the legal pages.",
    }),
    defineField({
      name: "gstin",
      title: "GSTIN",
      type: "string",
      group: "legal",
      description: "Leave blank if not GST registered — invoices then omit the tax line.",
    }),
    defineField({
      name: "supportEmail",
      title: "Support email",
      type: "string",
      group: "legal",
      validation: (r) => r.email(),
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
