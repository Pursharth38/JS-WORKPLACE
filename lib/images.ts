// CMS migration M1d — content-image conventions.
//
// Content images live in R2 under the `content/` prefix and are served through
// /api/images/<key>. The R2 bucket itself stays PRIVATE — it also holds
// certificates and invoices, and the serving route enforces the prefix so
// those can never be reached through the public image path.

export const CONTENT_IMAGE_PREFIX = "content/";

/** App-relative URL for a stored content-image key. */
export function imageSrc(key: string): string {
  return `/api/images/${key}`;
}

/** Extracts the R2 key back out of an /api/images/ src (or returns null). */
export function keyFromImageSrc(src: string): string | null {
  if (!src.startsWith("/api/images/")) return null;
  const key = src.slice("/api/images/".length);
  return key.startsWith(CONTENT_IMAGE_PREFIX) ? key : null;
}

export type SniffedImage = { ext: "jpg" | "png" | "webp" | "gif"; contentType: string };

/**
 * Identifies an image by its magic bytes. The uploaded file's own claimed
 * content type is never trusted — a .jpg that is actually an SVG (scriptable)
 * or an HTML file must be rejected no matter what its name says.
 */
export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { ext: "png", contentType: "image/png" };
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { ext: "gif", contentType: "image/gif" };
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

export const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
