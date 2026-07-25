// DEV A — result of the "Is your organisation POSH compliant?" self-check (E3).
//
// ⚠️ This is an awareness tool, not a legal audit, and the copy says so. Telling
//    an employer they are "compliant" on the strength of eight questions would
//    be both wrong and a liability for the client. The wording is deliberately
//    "here is what to look at next", never "you are compliant".
import { Button, Text } from "@react-email/components";
import * as React from "react";

import {
  EmailLayout,
  buttonStyle,
  mutedStyle,
  textStyle,
} from "./components/email-layout";

export function ComplianceReport({
  name,
  scorePercent,
  bandLabel,
  gaps,
  demoUrl,
}: {
  name: string;
  scorePercent: number;
  bandLabel: string;
  gaps: string[];
  demoUrl: string;
}) {
  return (
    <EmailLayout
      preview={`Your POSH self-check result: ${bandLabel}`}
      heading="Your POSH self-check result"
    >
      <Text style={textStyle}>Hi {name},</Text>

      <Text
        style={{
          ...textStyle,
          fontSize: "20px",
          fontWeight: 600,
          color: "#0F5257",
        }}
      >
        {bandLabel} — {scorePercent}%
      </Text>

      {gaps.length > 0 ? (
        <>
          <Text style={textStyle}>
            Based on your answers, these are the areas worth looking at first:
          </Text>
          <ul style={{ margin: "0 0 24px", paddingLeft: "20px" }}>
            {gaps.map((gap) => (
              <li
                key={gap}
                style={{
                  fontSize: "16px",
                  lineHeight: 1.65,
                  color: "#101828",
                  marginBottom: "8px",
                }}
              >
                {gap}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Text style={textStyle}>
          Your answers did not flag any of the common gaps this check looks for.
          That is a good sign, though it is worth confirming with a proper review.
        </Text>
      )}

      <Text style={{ margin: "0 0 24px" }}>
        <Button href={demoUrl} style={buttonStyle}>
          Talk through your results
        </Button>
      </Text>

      <Text style={mutedStyle}>
        This self-check is an awareness tool based on eight questions. It is not
        a legal audit and it is not advice on your specific situation — a real
        review looks at your policy, your Internal Committee, your records and
        your training history.
      </Text>
    </EmailLayout>
  );
}

export default ComplianceReport;
