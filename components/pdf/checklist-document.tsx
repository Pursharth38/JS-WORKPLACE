import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import * as React from "react";

import { QUESTIONS } from "@/lib/compliance-check";

/**
 * The gated POSH compliance checklist (E2).
 *
 * ⚠️ CLAUDE.md §1 applies. This is a practical checklist written by a trainer.
 * It is NOT a government-approved or empanelled document and must never be
 * described as one, here or in the email that delivers it.
 *
 * Built from the same `QUESTIONS` list as the on-site self-check, so the PDF
 * and the web tool can never drift apart. If a question changes, both change.
 *
 * PDF colours are literal hex: @react-pdf/renderer does not resolve CSS custom
 * properties. These are the CLAUDE.md tokens.
 */
const brand = {
  teal: "#0F5257",
  amber: "#C77D26",
  ink: "#101828",
  muted: "#475467",
  line: "#E4E7EC",
  sand: "#FBF9F5",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    color: brand.ink,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: brand.teal,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: brand.ink,
    marginBottom: 10,
  },
  intro: { fontSize: 11, lineHeight: 1.6, color: brand.muted, marginBottom: 22 },
  rule: { height: 2, backgroundColor: brand.teal, width: 56, marginBottom: 22 },

  item: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.line,
    paddingBottom: 14,
  },
  box: {
    width: 14,
    height: 14,
    borderWidth: 1.2,
    borderColor: brand.teal,
    marginRight: 12,
    marginTop: 2,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  itemHelp: { fontSize: 10, color: brand.muted, lineHeight: 1.5 },
  itemAction: {
    fontSize: 10,
    color: brand.teal,
    lineHeight: 1.5,
    marginTop: 4,
  },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8.5,
    color: brand.muted,
    lineHeight: 1.5,
    borderTopWidth: 1,
    borderTopColor: brand.line,
    paddingTop: 10,
  },
});

export function ChecklistDocument({
  businessName,
  siteUrl,
}: {
  businessName: string;
  siteUrl: string;
}) {
  return (
    <Document
      title="POSH compliance checklist"
      author={businessName}
      subject="A practical checklist of POSH Act obligations for employers"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>POSH ACT, 2013</Text>
        <Text style={styles.title}>Compliance checklist</Text>
        <View style={styles.rule} />

        <Text style={styles.intro}>
          Work through these eight points to see where your organisation
          currently stands. Each one reflects an obligation the Act places on an
          employer. If you cannot evidence an item, treat it as outstanding —
          in practice, an arrangement you cannot demonstrate is one you do not
          have.
        </Text>

        {QUESTIONS.map((q, i) => (
          <View key={q.id} style={styles.item} wrap={false}>
            <View style={styles.box} />
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>
                {i + 1}. {q.text}
              </Text>
              {q.help ? <Text style={styles.itemHelp}>{q.help}</Text> : null}
              <Text style={styles.itemAction}>If not: {q.gap}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          This checklist is a practical awareness tool prepared by{" "}
          {businessName}. It is general information about the Prevention of
          Sexual Harassment Act, 2013 — it is not legal advice and does not
          address your specific circumstances. {siteUrl}
        </Text>
      </Page>
    </Document>
  );
}
