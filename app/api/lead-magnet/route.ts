import type { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { sendLeadMagnetEmail, sendLeadNotification } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { apiError, apiResponse } from "@/lib/response";
import { getSiteSettings } from "@/lib/content";
import { leadSchema } from "@/lib/schemas/leads";
import { createSignedToken } from "@/lib/signed-link";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

/**
 * Gated lead magnet (E2): captures the lead, then emails a signed download link.
 *
 * The link goes by EMAIL rather than being returned in the response. That is the
 * whole mechanism — an address that does not receive the mail never gets the
 * file, which is what makes the captured list worth anything.
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

    if (data.website && data.website.length > 0) {
      return apiResponse(200, "Received");
    }

    if (!data.consentGiven) {
      return apiResponse(400, "Please tick the consent box so we can email it to you.");
    }

    const human = await verifyTurnstile(data.turnstileToken, ip);
    if (!human) {
      return apiResponse(400, "Could not verify that you are human. Please try again.");
    }

    const email = data.email.toLowerCase();

    await db.lead.create({
      data: {
        name: data.name,
        email,
        organization: data.organization || null,
        source: "checklist",
        consentGiven: true,
      },
      select: { id: true },
    });

    const token = createSignedToken(email);
    const downloadPath = `/api/lead-magnet/download?token=${encodeURIComponent(token)}`;

    void (async () => {
      await sendLeadMagnetEmail({
        to: email,
        name: data.name,
        downloadPath,
      });

      const settings = await getSiteSettings();
      if (settings.email) {
        await sendLeadNotification({
          to: settings.email,
          name: data.name,
          email,
          organization: data.organization || undefined,
          source: "checklist download",
        });
      }
    })().catch((err) => console.error("[api/lead-magnet] email failed", err));

    return apiResponse(200, "Check your inbox — the checklist is on its way.");
  } catch (err) {
    return apiError("lead-magnet", err);
  }
}
