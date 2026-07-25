// DEV A — internal notification, sent to the client when a lead comes in.
//
// This is the email that makes the site earn its keep. It is written to be
// actionable on a phone: who, what they want, and a mailto that is ready to
// send, without opening a dashboard.
import { Text } from "@react-email/components";
import * as React from "react";

import {
  EmailLayout,
  mutedStyle,
  textStyle,
} from "./components/email-layout";

export function LeadNotification({
  name,
  email,
  phone,
  organization,
  employeeCount,
  serviceInterest,
  message,
  source,
}: {
  name: string;
  email: string;
  phone?: string | undefined;
  organization?: string | undefined;
  employeeCount?: string | undefined;
  serviceInterest?: string | undefined;
  message?: string | undefined;
  source: string;
}) {
  const rows: Array<[string, string | undefined]> = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Organisation", organization],
    ["Employee count", employeeCount],
    ["Interested in", serviceInterest],
    ["Came from", source],
  ];

  return (
    <EmailLayout
      preview={`New enquiry from ${name}${organization ? ` at ${organization}` : ""}`}
      heading="New enquiry"
    >
      <Text style={textStyle}>
        <strong>{name}</strong>
        {organization ? ` from ${organization}` : ""} has just submitted the{" "}
        {source} form.
      </Text>

      <table
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%", margin: "0 0 24px" }}
      >
        <tbody>
          {rows
            .filter((r): r is [string, string] => Boolean(r[1]))
            .map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    padding: "6px 12px 6px 0",
                    fontSize: "14px",
                    color: "#475467",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: "6px 0",
                    fontSize: "15px",
                    color: "#101828",
                    fontWeight: 600,
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {message && (
        <>
          <Text style={{ ...textStyle, marginBottom: "4px", fontWeight: 600 }}>
            Their message
          </Text>
          <Text
            style={{
              ...textStyle,
              padding: "12px 16px",
              background: "#FBF9F5",
              borderLeft: "3px solid #0F5257",
            }}
          >
            {message}
          </Text>
        </>
      )}

      <Text style={mutedStyle}>
        Reply straight to <strong>{email}</strong>. They gave explicit consent to
        be contacted about this enquiry.
      </Text>
    </EmailLayout>
  );
}

export default LeadNotification;
