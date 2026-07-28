// The checklist PDF's only gate. Added 2026-07-26 when the self-check report
// email started carrying the same signed link as the gated lead magnet, giving
// this helper a second caller and making a silent regression here cost two
// features instead of one.
//
// Threat model is mild by design (see lib/signed-link.ts): the checklist is a
// marketing asset we want spread. What must hold is that a link cannot be EDITED
// into a different one, and that it expires.
import { beforeAll, describe, expect, it, vi } from "vitest";

let createSignedToken: typeof import("@/lib/signed-link").createSignedToken;
let verifySignedToken: typeof import("@/lib/signed-link").verifySignedToken;

beforeAll(async () => {
  // Set before import: the module reads the secret lazily, but be explicit so
  // this test never depends on a developer's local .env.
  vi.stubEnv("LEAD_MAGNET_SECRET", "test-secret-not-a-real-key");
  const mod = await import("@/lib/signed-link");
  createSignedToken = mod.createSignedToken;
  verifySignedToken = mod.verifySignedToken;
});

const EMAIL = "asha@example.com";

describe("signed checklist links", () => {
  it("round-trips the subject it was minted for", () => {
    const token = createSignedToken(EMAIL);
    expect(verifySignedToken(token)).toEqual({ subject: EMAIL });
  });

  it("rejects a token whose subject was tampered with", () => {
    const token = createSignedToken(EMAIL);
    const [payload, sig] = [token.slice(0, token.lastIndexOf(".")), token.slice(token.lastIndexOf(".") + 1)];
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const forged = decoded.replace(EMAIL, "attacker@example.com");
    const forgedToken = `${Buffer.from(forged).toString("base64url")}.${sig}`;
    expect(verifySignedToken(forgedToken)).toBeNull();
  });

  it("rejects a token whose expiry was pushed out", () => {
    const token = createSignedToken(EMAIL, 1000);
    const payload = token.slice(0, token.lastIndexOf("."));
    const sig = token.slice(token.lastIndexOf(".") + 1);
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const extended = decoded.replace(/\.\d+$/, `.${Date.now() + 10 ** 9}`);
    const forgedToken = `${Buffer.from(extended).toString("base64url")}.${sig}`;
    expect(verifySignedToken(forgedToken)).toBeNull();
  });

  it("rejects an expired token", () => {
    // Negative TTL — already expired at mint, signature still genuine.
    const token = createSignedToken(EMAIL, -1000);
    expect(verifySignedToken(token)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSignedToken(EMAIL);
    vi.stubEnv("LEAD_MAGNET_SECRET", "a-completely-different-secret");
    expect(verifySignedToken(token)).toBeNull();
    vi.stubEnv("LEAD_MAGNET_SECRET", "test-secret-not-a-real-key");
  });

  it("rejects null, empty and malformed tokens", () => {
    expect(verifySignedToken(null)).toBeNull();
    expect(verifySignedToken("")).toBeNull();
    expect(verifySignedToken("not-a-token")).toBeNull();
    expect(verifySignedToken(".")).toBeNull();
    expect(verifySignedToken("....")).toBeNull();
  });
});
