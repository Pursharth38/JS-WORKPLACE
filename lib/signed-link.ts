import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived signed download links for the gated lead magnet.
 *
 * The threat model here is mild — the checklist is a marketing asset we WANT
 * spread around, and the point of gating it is list-building, not secrecy. What
 * this actually buys us is that the link in someone's inbox cannot be edited
 * into a different one, and it expires, so a link pasted into a public forum
 * stops working rather than becoming a permanent bypass of the form.
 *
 * Falls back to NEXTAUTH_SECRET so this works without another env var; both are
 * server-only and neither is ever shipped to the browser.
 */
function secret(): string {
  const value =
    process.env.LEAD_MAGNET_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (!value) {
    throw new Error(
      "No signing secret available (set NEXTAUTH_SECRET or LEAD_MAGNET_SECRET)",
    );
  }
  return value;
}

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSignedToken(
  subject: string,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const expires = Date.now() + ttlMs;
  const payload = `${subject}.${expires}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifySignedToken(
  token: string | null,
): { subject: string } | null {
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const encodedPayload = token.slice(0, lastDot);
  const providedSig = token.slice(lastDot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expectedSig = sign(payload);

  // Constant-time compare. Length differs → not equal, and timingSafeEqual
  // throws on mismatched lengths, so guard first.
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const separator = payload.lastIndexOf(".");
  if (separator <= 0) return null;

  const subject = payload.slice(0, separator);
  const expires = Number(payload.slice(separator + 1));
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return { subject };
}
