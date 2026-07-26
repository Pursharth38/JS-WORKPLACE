import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import * as React from "react";

import { ChecklistDocument } from "@/components/pdf/checklist-document";
import { apiError, apiResponse } from "@/lib/response";
import { getSiteSettings } from "@/lib/content";
import { verifySignedToken } from "@/lib/signed-link";

// @react-pdf/renderer cannot run on Edge. next.config.ts also keeps it out of
// the server bundle via serverExternalPackages.
export const runtime = "nodejs";

/**
 * Serves the checklist PDF against a signed, expiring token.
 *
 * Rendered on demand rather than stored: the document is generated from
 * `QUESTIONS`, so a change to the checklist takes effect immediately and there
 * is no stale file in object storage to forget about.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const verified = verifySignedToken(token);

    if (!verified) {
      return apiResponse(
        403,
        "This download link is invalid or has expired. Please request the checklist again.",
      );
    }

    const settings = await getSiteSettings();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

    // `renderToBuffer` is typed to take an element whose props are DocumentProps.
    // Same cast Dev B uses in lib/certificate.ts and lib/invoice.ts — kept
    // identical so all three PDF paths look the same to the next reader.
    const element = React.createElement(ChecklistDocument, {
      businessName: settings.businessName,
      siteUrl,
    }) as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="posh-compliance-checklist.pdf"',
        // Personal, tokenised URL — must never be cached by a shared proxy.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return apiError("lead-magnet/download", err);
  }
}
