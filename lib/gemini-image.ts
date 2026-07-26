// ─────────────────────────────────────────────────────────────────────────────
// Gemini image generation — admin-only, used by /api/admin/generate-image when
// an editor generates a cover/grid image instead of uploading one.
//
// Follows the same shape as lib/r2.ts: a lazy config check (isGeminiConfigured)
// so callers can fail with a clear message instead of a thrown exception deep
// in a request, and the API key never leaves this file.
//
// ⚠️ MODEL NAME: GEMINI_IMAGE_MODEL below is a single, isolated constant on
// purpose. Gemini's image-capable model lineup moves fast — verified live
// against this project's own API key on 2026-07-26 (ListModels + a real
// generateContent call, which authenticated and was accepted — it 429'd on
// quota, not on request shape or model name). If it starts 404ing again,
// query https://generativelanguage.googleapis.com/v1beta/models?key=... for
// the current list rather than guessing; this is the only line to change.
// NODE RUNTIME ONLY (fetch + Buffer; no reason this can't run on Edge, but it
// always runs alongside the R2 upload, which is Node-only).
// ─────────────────────────────────────────────────────────────────────────────

export const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export type GeneratedImage = {
  bytes: Buffer;
  mimeType: string;
};

/**
 * Generates one image from a text prompt. Returns null (never throws for an
 * API-level failure) so the route handler can turn that into a clean 502
 * rather than a stack trace — the caller still sees exceptions for genuine
 * bugs (missing key handled separately, network errors propagate).
 */
export async function generateImage(
  prompt: string,
): Promise<GeneratedImage | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini is not configured: GEMINI_API_KEY missing");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) {
    console.error(
      "[gemini-image] generateContent failed",
      res.status,
      await res.text(),
    );
    return null;
  }

  const payload = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { mimeType?: string; data?: string } }[];
      };
    }[];
  };

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    console.error(
      "[gemini-image] response had no inline image data",
      JSON.stringify(payload).slice(0, 500),
    );
    return null;
  }

  return {
    bytes: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
  };
}
