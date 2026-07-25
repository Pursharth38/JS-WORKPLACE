import type { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { sendLeadNotification } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { apiError, apiResponse } from "@/lib/response";
import { getSiteSettings } from "@/lib/sanity";
import { leadSchema } from "@/lib/schemas/leads";
import { verifyTurnstile } from "@/lib/turnstile";

// Prisma + Resend. Not Edge.
export const runtime = "nodejs";

/**
 * Lead capture — the endpoint the whole marketing site funnels into.
 *
 * Guard order matters and is deliberate:
 *   1. rate limit   — cheapest check, sheds load before any parsing
 *   2. schema parse — reject malformed input before touching the network
 *   3. honeypot     — silent 200, so a bot learns nothing
 *   4. consent      — DPDP; the row must not exist without it
 *   5. Turnstile    — a network call, so it goes last among the guards
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);

    const limit = await rateLimit.leadsIp(ip);
    if (!limit.success) {
      return apiResponse(429, "Too many requests. Please try again later.");
    }

    const parsed = leadSchema.safeParse(await req.json());
    if (!parsed.success) return apiResponse(400, "Invalid input");

    const data = parsed.data;

    // Honeypot: a human never sees this field. Return success and drop it —
    // an error response just teaches the bot to omit the field next time.
    if (data.website && data.website.length > 0) {
      return apiResponse(200, "Received");
    }

    if (!data.consentGiven) {
      return apiResponse(400, "Please tick the consent box so we can reply.");
    }

    const human = await verifyTurnstile(data.turnstileToken, ip);
    if (!human) {
      return apiResponse(400, "Could not verify that you are human. Please try again.");
    }

    const lead = await db.lead.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        organization: data.organization || null,
        employeeCount: data.employeeCount || null,
        serviceInterest: data.serviceInterest || null,
        message: data.message || null,
        source: data.source,
        consentGiven: true,
      },
      select: { id: true },
    });

    // Fire-and-forget. CONTRACTS.md: never block the response on email. The row
    // is already committed, so a Resend outage loses a notification, not a lead.
    void (async () => {
      const settings = await getSiteSettings();
      const to = settings.email;
      if (!to) {
        console.error("[api/leads] siteSettings.email is unset — notification not sent");
        return;
      }
      await sendLeadNotification({
        to,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        organization: data.organization || undefined,
        employeeCount: data.employeeCount || undefined,
        serviceInterest: data.serviceInterest || undefined,
        message: data.message || undefined,
        source: data.source,
      });
    })().catch((err) => console.error("[api/leads] notification failed", err));

    return apiResponse(200, "Thanks — we'll be in touch shortly.", {
      id: lead.id,
    });
  } catch (err) {
    return apiError("leads", err);
  }
}
