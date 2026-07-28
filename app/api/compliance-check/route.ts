import type { NextRequest } from "next/server";

import { scoreAnswers } from "@/lib/compliance-check";
import { db } from "@/lib/db";
import { sendComplianceReportEmail, sendLeadNotification } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { apiError, apiResponse } from "@/lib/response";
import { getSiteSettings } from "@/lib/content";
import { complianceCheckSchema } from "@/lib/schemas/compliance-check";
import { createSignedToken } from "@/lib/signed-link";
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

    // Honeypot. Logged, not silent: this branch returns a success-shaped 200 to
    // a human as readily as to a bot, and until 2026-07-26 the field was named
    // `website` — which password managers autofill — so real self-checks were
    // discarded behind a green "Received" with no trace anywhere. If this line
    // starts appearing for genuine visitors, the honeypot is misfiring again.
    if (data.refCode && data.refCode.length > 0) {
      console.warn("[api/compliance-check] honeypot filled — discarding as bot");
      return apiResponse(200, "Received");
    }

    if (!data.consentGiven) {
      return apiResponse(
        400,
        "Please tick the consent box so we can email you.",
      );
    }

    const human = await verifyTurnstile(data.turnstileToken, ip);
    if (!human) {
      return apiResponse(
        400,
        "Could not verify that you are human. Please try again.",
      );
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

    // The visitor's own email IS the response — awaited and checked, so the
    // message we return reflects what actually happened rather than what we
    // hoped would happen. (Previously this was fire-and-forget: the route
    // replied "Sent" unconditionally, even when Resend rejected the send —
    // which it always does outside the account owner's own inbox until a
    // domain is verified. That looked like a working feature and wasn't one.)
    // Someone who has just answered eight questions has earned the checklist —
    // making them fill the lead-magnet form again for a PDF they already
    // qualified for is friction with no upside. Same signed token, same
    // `/api/lead-magnet/download` route, so there is one gating mechanism and
    // one PDF, rendered on demand from `QUESTIONS` (never a stale stored file).
    //
    // Wrapped: `createSignedToken` throws when no signing secret is configured,
    // and a missing checklist link must not cost the visitor their result.
    let checklistUrl: string | undefined;
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const token = createSignedToken(data.email.toLowerCase());
      checklistUrl = `${siteUrl}/api/lead-magnet/download?token=${encodeURIComponent(token)}`;
    } catch (err) {
      console.warn(
        "[api/compliance-check] could not mint checklist link — sending result without it",
        err,
      );
    }

    const emailSent = await sendComplianceReportEmail({
      to: data.email,
      name: data.name,
      scorePercent: result.scorePercent,
      bandLabel: result.bandLabel,
      gaps: result.gaps,
      checklistUrl,
    });

    // The internal notification to the client stays fire-and-forget — it's
    // not part of the promise made to the visitor, and the Lead row (which is
    // what actually matters for follow-up) is already committed either way.
    void (async () => {
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
      console.error("[api/compliance-check] lead notification failed", err),
    );

    if (!emailSent) {
      // Not a failure the visitor needs to retry over — their result is still
      // on screen above this form, so nothing they came for is lost.
      return apiResponse(
        502,
        "We saved your result, but the email couldn't be sent just now. Your score above is unaffected — please try again in a moment.",
      );
    }

    return apiResponse(200, "Sent — check your inbox for the written report.");
  } catch (err) {
    return apiError("compliance-check", err);
  }
}
