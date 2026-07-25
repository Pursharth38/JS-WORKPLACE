// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-02. Certificate of Completion PDF.
//
// ★★★ THE WORDING BELOW IS LOCKED BY CLAUDE.md §1. DO NOT IMPROVISE. ★★★
//
// The title is exactly "Certificate of Completion — POSH Awareness Training".
// Jyoti Solaria is NOT empanelled by the Ministry of Women and Child
// Development. None of the forbidden claim strings listed in CLAUDE.md §1
// (certification/government-recognition/empanelment claims) may ever appear on
// this document. CI greps the build for them and fails on a hit. They are not
// quoted here so a source-level grep stays clean too.
//
// P0-01 (written client sign-off on this wording) is still OPEN. This renders
// the wording the spec locks; it must not ship before that sign-off lands.
// ─────────────────────────────────────────────────────────────────────────────
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import * as React from 'react'

const TEAL = '#0F5257'
const AMBER = '#C77D26'
const INK = '#1C1A17'
const MUTED = '#5F5A52'
const SAND = '#FBF9F5'

const s = StyleSheet.create({
  page: { backgroundColor: SAND, padding: 0, color: INK },
  frame: {
    margin: 22,
    padding: 34,
    borderWidth: 2,
    borderColor: TEAL,
    height: '100%',
    position: 'relative',
  },
  accent: { height: 4, width: 84, backgroundColor: AMBER, marginBottom: 20 },
  issuer: { fontSize: 12, letterSpacing: 2, color: TEAL, textTransform: 'uppercase' },
  title: { fontSize: 27, color: TEAL, marginTop: 16, lineHeight: 1.25 },
  lead: { fontSize: 11, color: MUTED, marginTop: 26 },
  name: {
    fontSize: 33,
    marginTop: 8,
    marginBottom: 8,
    color: INK,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D0C4',
    paddingBottom: 10,
  },
  body: { fontSize: 12, color: INK, marginTop: 14, lineHeight: 1.6, maxWidth: '74%' },
  course: { fontSize: 15, marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 34,
    left: 34,
    right: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sigLine: { borderTopWidth: 1, borderTopColor: '#8E8578', width: 190, paddingTop: 5 },
  label: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  meta: { fontSize: 9, color: MUTED, marginTop: 2 },
  qrBlock: { alignItems: 'center' },
  qr: { width: 74, height: 74 },
  disclaimer: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 6,
    maxWidth: 250,
    textAlign: 'right',
    lineHeight: 1.4,
  },
})

export type CertificateData = {
  certId: string
  learnerName: string
  courseTitle: string
  issuedAt: Date
  verifyUrl: string
  /** PNG data URI of the QR code pointing at `verifyUrl`. */
  qrDataUrl: string
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  return (
    <Document
      title={`Certificate of Completion — ${data.certId}`}
      author="JS Workplace Wellness"
      subject="Certificate of Completion — POSH Awareness Training"
    >
      {/* Landscape: this is a document people print and frame. */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.frame}>
          <Text style={s.issuer}>JS Workplace Wellness</Text>
          <View style={s.accent} />

          {/* ★ LOCKED WORDING — CLAUDE.md §1 ★ */}
          <Text style={s.title}>Certificate of Completion — POSH Awareness Training</Text>

          <Text style={s.lead}>This is to certify that</Text>
          <Text style={s.name}>{data.learnerName}</Text>

          <Text style={s.body}>
            has successfully completed the self-paced awareness training programme
          </Text>
          <Text style={s.course}>{data.courseTitle}</Text>

          <View style={s.footer}>
            <View>
              <View style={s.sigLine}>
                <Text style={{ fontSize: 11 }}>Jyoti Solaria</Text>
              </View>
              <Text style={s.meta}>POSH Trainer, JS Workplace Wellness</Text>

              <View style={{ marginTop: 16 }}>
                <Text style={s.label}>Date of issue</Text>
                <Text style={s.meta}>
                  {data.issuedAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={s.qrBlock}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image takes no alt */}
                <Image style={s.qr} src={data.qrDataUrl} />
                <Text style={[s.label, { marginTop: 5 }]}>Verify online</Text>
              </View>

              <Text style={[s.meta, { marginTop: 6, fontSize: 10 }]}>
                Certificate ID: {data.certId}
              </Text>

              {/*
                States plainly what the credential is and is not. This is the
                counterweight to a competitor's government-empanelment claims —
                accuracy, stated up front, rather than an implied equivalence.
              */}
              <Text style={s.disclaimer}>
                Verify this certificate at {data.verifyUrl}. This certificate records
                completion of an awareness training programme delivered by JS Workplace
                Wellness. It is not a statutory or government-issued qualification.
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
