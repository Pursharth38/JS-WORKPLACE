// Regression guard for the 2026-07-26 honeypot fix.
//
// The honeypot field was named `website`. Password managers treat that as a
// first-class vault field and Chrome autofills it, so the hidden input got
// filled for ordinary humans:
//   - lead/lead-magnet/compliance forms returned a green "Received" and threw
//     the enquiry away (no row written, no email sent, no log line);
//   - signup was worse — `signupSchema` used `.max(0)`, so a filled field
//     failed validation outright and the account could not be created.
//
// These tests fail if either mistake comes back.
import { describe, expect, it } from "vitest";

import { signupSchema } from "@/lib/schemas/auth";
import { complianceCheckSchema } from "@/lib/schemas/compliance-check";
import { leadSchema } from "@/lib/schemas/leads";

/**
 * Names a browser or password manager will autofill. A honeypot may never use
 * one: the field is invisible, so a human cannot see it filled or clear it.
 */
const AUTOFILLED_NAMES = [
  "website",
  "url",
  "company",
  "organization",
  "organisation",
  "address",
  "phone",
  "tel",
  "name",
  "email",
  "username",
  "password",
];

const HONEYPOT = "refCode";

const validLead = {
  name: "Asha Verma",
  email: "asha@example.com",
  source: "demo",
  consentGiven: true,
} as const;

const validSignup = {
  name: "Asha Verma",
  email: "asha@example.com",
  password: "correct horse battery staple",
  consentGiven: true,
} as const;

describe("honeypot field naming", () => {
  it("is not a name any password manager or browser autofills", () => {
    expect(AUTOFILLED_NAMES).not.toContain(HONEYPOT);
  });

  // Two interlocking locks: this one fails if the schema field is renamed away
  // from `refCode` (e.g. back to `website`), and the test above fails if someone
  // "fixes" that by pointing HONEYPOT at an autofilled name instead.
  it.each([
    ["leadSchema", leadSchema],
    ["complianceCheckSchema", complianceCheckSchema],
    ["signupSchema", signupSchema],
  ])("%s still declares the honeypot under the agreed name", (_label, schema) => {
    expect(Object.keys(schema.shape)).toContain(HONEYPOT);
  });
});

describe("honeypot validation is permissive, so the route decides", () => {
  // A schema that REJECTS a filled honeypot leaks the trap to the bot (it
  // learns which field to drop) and blocks any human whose password manager
  // filled it. Accept the value; let the route/action silently discard.
  it("leadSchema accepts a filled honeypot", () => {
    const r = leadSchema.safeParse({ ...validLead, [HONEYPOT]: "spam-bot-value" });
    expect(r.success).toBe(true);
  });

  it("signupSchema accepts a filled honeypot instead of failing validation", () => {
    const r = signupSchema.safeParse({ ...validSignup, [HONEYPOT]: "spam-bot-value" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data[HONEYPOT]).toBe("spam-bot-value");
  });

  it("signupSchema still accepts an empty honeypot (the human path)", () => {
    const r = signupSchema.safeParse({ ...validSignup, [HONEYPOT]: "" });
    expect(r.success).toBe(true);
  });

  it("signupSchema accepts an absent honeypot", () => {
    const r = signupSchema.safeParse(validSignup);
    expect(r.success).toBe(true);
  });
});
