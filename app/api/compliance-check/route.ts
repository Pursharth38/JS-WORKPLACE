import type { NextRequest } from "next/server";

import { scoreAnswers } from "@/lib/compliance-check";
import { db } from "@/lib/db";
import { sendComplianceReportEmail, sendLeadNotification } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { apiError, apiResponse } from "@/lib/response";
import { getSiteSettings } from "@/lib/content";
import { complianceCheckSchema } from "@/lib/schemas/compliance-check";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

/**
 * Emails the self-check report and records the lead (E3).
 *
 * The score is RECOMPUTED here from the submitted answers using the same
 * `scoreAnswers()` the browser used. The client sends answers, never a score —
 * not for security (it is the visitor's own result) but because a score
 * computed in two places eventually disagrees, and an email that contradicts
 * the page the person just read destroys trust in the tool.
 *
 * Shares the `/api/leads` rate limiter: both write a Lead and send mail, so
 * they should share a budget rather than giving an abuser two.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);

    const limit = await rateLimit.leadsIp(ip);
    if (!limit.success) {
      return apiResponse(429, "Too many requests. Please try again later.");
    }

    const parsed = complianceCheckSchema.safeParse(await req.json());
    if (!parsed.success) return apiResponse(400, "Invalid input");

    const data = parsed.data;

    if (data.website && data.website.length > 0) {
      return apiResponse(200, "Received");
    }

    if (!data.consentGiven) {
      return apiResponse(400, "Please tick the consent box so we can email you.");
    }

    const human = await verifyTurnstile(data.turnstileToken, ip);
    if (!human) {
      return apiResponse(400, "Could not verify that you are human. Please try again.");
    }

    const result = scoreAnswers(data.answers);

    await db.lead.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        organization: data.organization || null,
        // The score belongs in the lead record: it is the single most useful
        // thing to know before the client picks up the phone to this person.
        message: `POSH self-check: ${result.scorePercent}% — ${result.bandLabel}. Gaps: ${
          result.gaps.length > 0 ? result.gaps.join(" | ") : "none flagged"
        }`,
        source: "assessment",
        consentGiven: true,
      },
      select: { id: true },
    });

    // Report to the visitor, notification to the client. Neither blocks the
    // response — the Lead row is already committed.
    void (async () => {
      await sendComplianceReportEmail({
        to: data.email,
        name: data.name,
        scorePercent: result.scorePercent,
        bandLabel: result.bandLabel,
        gaps: result.gaps,
      });

      const settings = await getSiteSettings();
      if (settings.email) {
        await sendLeadNotification({
          to: settings.email,
          name: data.name,
          email: data.email,
          organization: data.organization || undefined,
          message: `Self-check score ${result.scorePercent}% (${result.bandLabel})`,
          source: "compliance self-check",
        });
      }
    })().catch((err) =>
      console.error("[api/compliance-check] email failed", err),
    );

    return apiResponse(200, "Sent — check your inbox for the written report.");
  } catch (err) {
    return apiError("compliance-check", err);
  }
}
