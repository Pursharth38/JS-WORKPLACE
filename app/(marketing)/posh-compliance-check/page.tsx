import type { Metadata } from "next";

import { ComplianceCheck } from "@/components/marketing/compliance-check";
import { Container } from "@/components/marketing/container";

export const metadata: Metadata = {
  title: "Is your organisation POSH compliant?",
  description:
    "Eight questions on your POSH Act obligations — policy, Internal Committee, training, display requirements and the annual report. Get an instant read on where the gaps are.",
};

export default function ComplianceCheckPage() {
  return (
    <Container className="py-14" measure>
      <h1 className="font-serif text-[39px] font-semibold leading-[1.15]">
        Is your organisation POSH compliant?
      </h1>
      <p className="mt-4 text-[19px] leading-[1.6] text-[var(--brand-muted)]">
        Eight questions, about two minutes. You will see your result straight
        away — no email required to find out where you stand.
      </p>

      <ComplianceCheck />
    </Container>
  );
}
