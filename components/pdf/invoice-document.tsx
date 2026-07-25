// ─────────────────────────────────────────────────────────────────────────────
// DEV B — invoice PDF. @react-pdf/renderer, Node runtime only.
//
// GSTIN is printed only when SELLER_GSTIN is set. P0-05 (confirm GST
// registration) is still open — until it is answered, the document renders as a
// plain payment invoice with no tax breakdown. Printing a fabricated GSTIN or a
// tax split the client is not registered to collect would be worse than
// omitting it.
// ─────────────────────────────────────────────────────────────────────────────
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import * as React from 'react'

const TEAL = '#0F5257'
const INK = '#1C1A17'
const MUTED = '#5F5A52'
const LINE = '#E4DED4'

const s = StyleSheet.create({
  page: { padding: 44, fontSize: 10, color: INK, lineHeight: 1.5 },
  headerBar: { backgroundColor: TEAL, padding: 16, marginBottom: 24 },
  brand: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  brandSub: { color: '#CFE0E0', fontSize: 9, marginTop: 2 },
  title: { fontSize: 20, marginBottom: 4, color: TEAL },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flexDirection: 'column', width: '48%' },
  label: { color: MUTED, fontSize: 8, textTransform: 'uppercase', marginBottom: 3 },
  block: { marginBottom: 18 },
  table: { borderTopWidth: 1, borderTopColor: LINE, marginTop: 8 },
  th: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 7,
    backgroundColor: '#FBF9F5',
  },
  td: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 9,
  },
  cellDesc: { width: '64%', paddingHorizontal: 8 },
  cellAmt: { width: '36%', paddingHorizontal: 8, textAlign: 'right' },
  totalRow: { flexDirection: 'row', paddingVertical: 10 },
  totalLabel: { width: '64%', paddingHorizontal: 8, textAlign: 'right', fontWeight: 'bold' },
  totalAmt: { width: '36%', paddingHorizontal: 8, textAlign: 'right', fontWeight: 'bold', fontSize: 12 },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
    fontSize: 8,
    color: MUTED,
  },
})

export type InvoiceData = {
  invoiceNumber: string
  issuedAt: Date
  buyerName: string
  buyerEmail: string
  courseTitle: string
  amountInPaise: number
  razorpayPaymentId: string
  razorpayOrderId: string
}

function inr(paise: number): string {
  // Intl with the INR symbol renders inconsistently across the embedded PDF
  // fonts, so the amount is composed by hand with a plain "Rs." prefix.
  const rupees = (paise / 100).toFixed(2)
  const [whole = '0', fraction = '00'] = rupees.split('.')
  // Indian grouping: last three digits, then pairs.
  const lastThree = whole.slice(-3)
  const rest = whole.slice(0, -3)
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}` : lastThree
  return `Rs. ${grouped}.${fraction}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const gstin = process.env.SELLER_GSTIN
  const sellerAddress = process.env.SELLER_ADDRESS ?? 'India'
  const sellerEmail = process.env.SELLER_EMAIL ?? 'hello@jsworkplacewellness.com'

  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author="JS Workplace Wellness"
      subject={`Invoice for ${data.courseTitle}`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.headerBar}>
          <Text style={s.brand}>JS Workplace Wellness</Text>
          <Text style={s.brandSub}>POSH awareness training and workplace compliance support</Text>
        </View>

        <View style={s.block}>
          <Text style={s.title}>Invoice</Text>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Invoice number</Text>
              <Text>{data.invoiceNumber}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Invoice date</Text>
              <Text>{formatDate(data.issuedAt)}</Text>
            </View>
          </View>
        </View>

        <View style={[s.row, s.block]}>
          <View style={s.col}>
            <Text style={s.label}>From</Text>
            <Text>Jyoti Solaria</Text>
            <Text>JS Workplace Wellness</Text>
            <Text style={{ color: MUTED }}>{sellerAddress}</Text>
            <Text style={{ color: MUTED }}>{sellerEmail}</Text>
            {gstin ? <Text style={{ marginTop: 3 }}>GSTIN: {gstin}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.label}>Billed to</Text>
            <Text>{data.buyerName}</Text>
            <Text style={{ color: MUTED }}>{data.buyerEmail}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.th}>
            <Text style={[s.cellDesc, s.label]}>Description</Text>
            <Text style={[s.cellAmt, s.label]}>Amount</Text>
          </View>
          <View style={s.td}>
            <View style={s.cellDesc}>
              <Text>{data.courseTitle}</Text>
              <Text style={{ color: MUTED, fontSize: 9, marginTop: 2 }}>
                Self-paced online course — single learner licence
              </Text>
            </View>
            <Text style={s.cellAmt}>{inr(data.amountInPaise)}</Text>
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total paid</Text>
            <Text style={s.totalAmt}>{inr(data.amountInPaise)}</Text>
          </View>
        </View>

        {gstin ? (
          <Text style={{ color: MUTED, fontSize: 9, marginTop: 4 }}>
            Amount shown is inclusive of applicable GST.
          </Text>
        ) : null}

        <View style={s.block} />

        <View>
          <Text style={s.label}>Payment reference</Text>
          <Text style={{ color: MUTED }}>Payment ID: {data.razorpayPaymentId}</Text>
          <Text style={{ color: MUTED }}>Order ID: {data.razorpayOrderId}</Text>
          <Text style={{ color: MUTED }}>Paid via Razorpay</Text>
        </View>

        <View style={s.footer} fixed>
          <Text>
            This is a computer-generated invoice and does not require a signature. Refunds
            are governed by the refund policy published at jsworkplacewellness.com.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
