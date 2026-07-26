// CMS migration M1d — magic-byte sniffing and the public-prefix boundary.
import { describe, expect, it } from "vitest";

import { imageSrc, keyFromImageSrc, sniffImage } from "@/lib/images";

const bytes = (...hex: number[]) => new Uint8Array([...hex, ...new Array(20).fill(0)]);

describe("sniffImage", () => {
  it("identifies jpeg, png, gif, webp by magic bytes", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47))?.ext).toBe("png");
    expect(sniffImage(bytes(0x47, 0x49, 0x46, 0x38))?.ext).toBe("gif");
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0]);
    expect(sniffImage(webp)?.ext).toBe("webp");
  });

  it("rejects SVG (scriptable markup) regardless of claimed type", () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>');
    expect(sniffImage(svg)).toBeNull();
  });

  it("rejects HTML, empty and truncated inputs", () => {
    expect(sniffImage(new TextEncoder().encode("<!doctype html><script>x</script>"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
    expect(sniffImage(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("image src ↔ key mapping", () => {
  it("round-trips a content key", () => {
    const src = imageSrc("content/2026-07/abcd1234.jpg");
    expect(src).toBe("/api/images/content/2026-07/abcd1234.jpg");
    expect(keyFromImageSrc(src)).toBe("content/2026-07/abcd1234.jpg");
  });

  it("★ refuses to map keys outside content/ — certificates stay unreachable", () => {
    expect(keyFromImageSrc("/api/images/certificates/JSWW-2026-A7K2P9.pdf")).toBeNull();
    expect(keyFromImageSrc("/api/images/invoices/JSWW-2026-27-0001.pdf")).toBeNull();
    expect(keyFromImageSrc("https://evil.example/x.jpg")).toBeNull();
  });
});
