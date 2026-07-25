import type { ReactNode } from "react";

import { Container } from "@/components/marketing/container";

/**
 * Shared shell for /privacy, /terms and /refund-policy.
 *
 * ⚠️ Razorpay will not activate a live account without Terms and a Refund
 * Policy reachable at public URLs. These three pages are a Phase 3 deliverable
 * precisely because Dev B's entire commerce lane sits behind them (P7-06).
 *
 * ⚠️ These are DRAFTS prepared to unblock activation. They must be reviewed by
 * the client and, where she wants the protection, by a lawyer before launch.
 * The review note renders on the page rather than hiding in a comment, so it
 * cannot be forgotten.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-14" measure>
      <div className="[&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-[25px] [&_h2]:font-semibold [&_h3]:mt-7 [&_h3]:font-serif [&_h3]:text-[20px] [&_h3]:font-semibold [&_li]:mt-2 [&_p]:mt-4 [&_p]:text-[17px] [&_p]:leading-[1.7] [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[17px] [&_ul]:leading-[1.7]">
        {children}
      </div>
    </Container>
  );
}
