// CMS migration M1b — the rich-text write gate and the PT converter.
// If parseRichText lets something through, it goes straight into a Json column
// and out through a React renderer — so the schema IS the security layer.
import { describe, expect, it } from "vitest";

import { portableTextToTiptap } from "@/lib/portable-text-to-tiptap";
import {
  EMPTY_DOC,
  isEmptyDoc,
  isSafeHref,
  parseRichText,
  richTextReadingMinutes,
  richTextToPlainText,
  safeParseRichText,
} from "@/lib/richtext";

const doc = (content: unknown[]) => ({ type: "doc", content });
const para = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

describe("isSafeHref", () => {
  it("allows https, http, mailto, tel, relative and anchors", () => {
    for (const href of [
      "https://example.com",
      "http://example.com/x",
      "mailto:hi@example.com",
      "tel:+919999999999",
      "/posh-act#ic-constitution",
      "#top",
    ]) {
      expect(isSafeHref(href), href).toBe(true);
    }
  });

  it("rejects javascript:, data:, protocol-relative and empty", () => {
    for (const href of [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "data:text/html,<script>1</script>",
      "//evil.example",
      "vbscript:x",
      "",
      "   ",
    ]) {
      expect(isSafeHref(href), href).toBe(false);
    }
  });
});

describe("parseRichText — accepts the real vocabulary", () => {
  it("accepts a representative document using every node type", () => {
    const input = doc([
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "About the Act" }] },
      para("Plain paragraph."),
      {
        type: "paragraph",
        content: [
          { type: "text", text: "bold", marks: [{ type: "bold" }] },
          { type: "text", text: " and " },
          {
            type: "text",
            text: "linked",
            marks: [{ type: "link", attrs: { href: "/posh-act#definitions" } }],
          },
          { type: "hardBreak" },
          { type: "text", text: "after break" },
        ],
      },
      { type: "blockquote", content: [para("Quoted.")] },
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [para("one")] },
          { type: "listItem", content: [para("two")] },
        ],
      },
      {
        type: "orderedList",
        attrs: { start: 3 },
        content: [{ type: "listItem", content: [para("three")] }],
      },
      {
        type: "calloutBox",
        attrs: { tone: "warning", title: "Deadline" },
        content: [para("90 days.")],
      },
      {
        type: "dataTable",
        attrs: {
          caption: "Timelines",
          headers: ["Step", "Days"],
          rows: [
            ["Complaint", "90"],
            ["Inquiry", "90"],
          ],
        },
      },
      { type: "image", attrs: { src: "/api/images/blog/x.jpg", alt: "diagram" } },
    ]);

    expect(() => parseRichText(input)).not.toThrow();
  });

  it("round-trips through plain-text extraction", () => {
    const parsed = parseRichText(
      doc([para("Hello world."), para("Second paragraph here.")]),
    );
    expect(richTextToPlainText(parsed)).toBe("Hello world.\nSecond paragraph here.");
    expect(richTextReadingMinutes(parsed)).toBe(1);
    expect(isEmptyDoc(parsed)).toBe(false);
    expect(isEmptyDoc(EMPTY_DOC)).toBe(true);
  });
});

describe("parseRichText — rejects what must never be stored", () => {
  it("rejects unknown node types (no scriptable content can enter)", () => {
    expect(safeParseRichText(doc([{ type: "html", html: "<script>1</script>" }]))).toBeNull();
    expect(safeParseRichText(doc([{ type: "iframe", attrs: { src: "https://x.y" } }]))).toBeNull();
  });

  it("rejects javascript: links even when everything else is valid", () => {
    expect(
      safeParseRichText(
        doc([
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "click",
                marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
              },
            ],
          },
        ]),
      ),
    ).toBeNull();
  });

  it("rejects data: image sources", () => {
    expect(
      safeParseRichText(
        doc([{ type: "image", attrs: { src: "data:image/png;base64,AAAA", alt: "x" } }]),
      ),
    ).toBeNull();
  });

  it("rejects unknown extra attrs (strict at every level)", () => {
    expect(
      safeParseRichText(doc([{ type: "paragraph", content: [], onClick: "steal()" }])),
    ).toBeNull();
  });

  it("rejects h1 — the page title's level is not authorable", () => {
    expect(
      safeParseRichText(
        doc([{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "x" }] }]),
      ),
    ).toBeNull();
  });

  it("rejects a non-doc root", () => {
    expect(safeParseRichText({ type: "paragraph", content: [] })).toBeNull();
    expect(safeParseRichText("<p>hello</p>")).toBeNull();
    expect(safeParseRichText(null)).toBeNull();
  });
});

describe("portableTextToTiptap", () => {
  const span = (text: string, marks: string[] = []) => ({ _type: "span", text, marks });

  it("converts styles, marks and links", () => {
    const { doc: converted, warnings } = portableTextToTiptap([
      { _type: "block", style: "h2", children: [span("Heading")], markDefs: [] },
      {
        _type: "block",
        style: "normal",
        children: [span("bold", ["strong"]), span(" plain"), span("link", ["a1"])],
        markDefs: [{ _key: "a1", _type: "link", href: "https://example.com" }],
      },
    ]);

    expect(warnings).toEqual([]);
    expect(converted.content[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    const p = converted.content[1] as { content: { marks?: unknown[] }[] };
    expect(p.content[0]?.marks).toEqual([{ type: "bold" }]);
    expect(p.content[2]?.marks).toEqual([
      { type: "link", attrs: { href: "https://example.com" } },
    ]);
    // The converter's output must clear the same write gate as the editor.
    expect(() => parseRichText(converted)).not.toThrow();
  });

  it("groups consecutive list blocks into one list and switches kinds", () => {
    const li = (text: string, listItem: "bullet" | "number") => ({
      _type: "block",
      style: "normal",
      listItem,
      level: 1,
      children: [span(text)],
      markDefs: [],
    });

    const { doc: converted } = portableTextToTiptap([
      li("a", "bullet"),
      li("b", "bullet"),
      li("1", "number"),
      { _type: "block", style: "normal", children: [span("after")], markDefs: [] },
    ]);

    expect(converted.content.map((n) => n.type)).toEqual([
      "bulletList",
      "orderedList",
      "paragraph",
    ]);
    expect((converted.content[0] as { content: unknown[] }).content).toHaveLength(2);
    expect(() => parseRichText(converted)).not.toThrow();
  });

  it("converts calloutBox and dataTable objects", () => {
    const { doc: converted, warnings } = portableTextToTiptap([
      {
        _type: "calloutBox",
        tone: "legal",
        title: "Note",
        body: [{ _type: "block", style: "normal", children: [span("inner")], markDefs: [] }],
      },
      {
        _type: "dataTable",
        caption: "T",
        headers: ["A", "B"],
        rows: [{ cells: ["1", "2"] }],
      },
    ]);

    expect(warnings).toEqual([]);
    expect(converted.content[0]).toMatchObject({
      type: "calloutBox",
      attrs: { tone: "legal", title: "Note" },
    });
    expect(converted.content[1]).toMatchObject({
      type: "dataTable",
      attrs: { headers: ["A", "B"], rows: [["1", "2"]] },
    });
    expect(() => parseRichText(converted)).not.toThrow();
  });

  it("resolves images through the resolver and warns when it cannot", () => {
    const resolved = portableTextToTiptap(
      [{ _type: "image", asset: { _ref: "image-abc" }, alt: "diagram" }],
      (ref) => (ref === "image-abc" ? "/api/images/migrated/abc.jpg" : null),
    );
    expect(resolved.warnings).toEqual([]);
    expect(resolved.doc.content[0]).toMatchObject({
      type: "image",
      attrs: { src: "/api/images/migrated/abc.jpg" },
    });

    const unresolved = portableTextToTiptap([{ _type: "image", asset: { _ref: "image-zz" } }]);
    expect(unresolved.doc.content).toHaveLength(0);
    expect(unresolved.warnings[0]).toContain("image-zz");
  });

  it("never silently drops: unknown types and unsafe links produce warnings", () => {
    const { doc: converted, warnings } = portableTextToTiptap([
      { _type: "youtubeEmbed", url: "https://youtu.be/x" },
      {
        _type: "block",
        style: "normal",
        children: [span("bad link", ["l1"])],
        markDefs: [{ _key: "l1", _type: "link", href: "javascript:alert(1)" }],
      },
    ]);

    expect(warnings.some((w) => w.includes("youtubeEmbed"))).toBe(true);
    expect(warnings.some((w) => w.includes("unsafe href"))).toBe(true);
    // The text survives even though the link mark was stripped.
    expect(richTextToPlainText(parseRichText(converted))).toContain("bad link");
  });
});
