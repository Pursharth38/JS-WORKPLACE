// DEV A — delivers the gated POSH compliance checklist (E2).
//
// ⚠️ CLAUDE.md §1 (NO FALSE AUTHORITY) applies to every word here. This is a
//    practical checklist written by a trainer, not a government-approved or
//    empanelled document, and it must never be described as one.
import { Button, Text } from "@react-email/components";
import * as React from "react";

import {
  EmailLayout,
  buttonStyle,
  mutedStyle,
  textStyle,
} from "./components/email-layout";

export function LeadMagnet({
  name,
  downloadUrl,
}: {
  name: string;
  downloadUrl: string;
}) {
  return (
    <EmailLayout
      preview="Your POSH compliance checklist"
      heading="Your POSH compliance checklist"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Here is the checklist you asked for. It walks through what the POSH Act
        requires of an employer — the policy, the Internal Committee, the annual
        report, and the training obligation — so you can see where your
        organisation currently stands.
      </Text>

      <Text style={{ margin: "0 0 24px" }}>
        <Button href={downloadUrl} style={buttonStyle}>
          Download the checklist
        </Button>
      </Text>

      <Text style={textStyle}>
        If working through it raises questions about your own setup, reply to
        this email — you will reach a real person.
      </Text>

      <Text style={mutedStyle}>
        You are receiving this because you requested the checklist on our
        website. We will not add you to any other list without asking.
      </Text>
    </EmailLayout>
  );
}

export default LeadMagnet;
