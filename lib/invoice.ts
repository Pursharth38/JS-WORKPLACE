// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P7-05. Invoice numbering, rendering, storage.
// NODE RUNTIME ONLY (@react-pdf/renderer cannot run on Edge).
// ─────────────────────────────────────────────────────────────────────────────
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import * as React from 'react'

import { InvoiceDocument, type InvoiceData } from '@/components/pdf/invoice-document'
import { db } from '@/lib/db'
import { isR2Configured, putObject } from '@/lib/r2'

/**
 * Indian financial year: 1 April – 31 March. A payment on 31 March 2027 belongs
 * to FY 2026-27; one on 1 April 2027 starts FY 2027-28. Getting this wrong makes
 * the invoice series restart in the middle of a filing period.
 */
export function financialYearFor(date: Date): string {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 3 ? year : year - 1 // getMonth() 3 === April
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

/**
 * Atomically claims the next number in the financial year's series.
 *
 * The increment happens inside the database, so two concurrent payments cannot
 * read the same value. A `count(*) + 1` would hand both the same number and
 * violate the unique constraint on `Payment.invoiceNumber` — or worse, not, if
 * the constraint were ever dropped.
 *
 * A number can be consumed without an invoice being produced if PDF rendering
 * fails afterwards, leaving a gap in the series. That is the correct trade:
 * gaps are explainable to an auditor, duplicates are not.
 */
export async function claimInvoiceNumber(at: Date = new Date()): Promise<string> {
  const fy = financialYearFor(at)

  const counter = await db.invoiceCounter.upsert({
    where: { financialYear: fy },
    create: { financialYear: fy, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  })

  return `JSWW/${fy}/${String(counter.lastNumber).padStart(4, '0')}`
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  // `renderToBuffer` is typed to accept an element whose props are DocumentProps.
  // InvoiceDocument returns a <Document>, but its own props are {data}, so the
  // wrapper has to be asserted across. This is the documented pattern for
  // composing @react-pdf documents out of components.
  const element = React.createElement(InvoiceDocument, { data }) as React.ReactElement<DocumentProps>
  return renderToBuffer(element)
}

export function invoiceObjectKey(invoiceNumber: string): string {
  // Slashes in the invoice number become path segments, which is fine for R2
  // and keeps the bucket browsable by financial year.
  return `invoices/${invoiceNumber.replace(/\//g, '-')}.pdf`
}

export type InvoiceResult =
  | { ok: true; pdf: Buffer; invoiceNumber: string }
  | { ok: false; reason: 'not_found' | 'not_paid' | 'forbidden' }

/**
 * Returns the invoice PDF for a payment, generating it on first request.
 *
 * Generation is LAZY rather than being done in the webhook. The webhook's job is
 * to record a payment and create an enrolment as fast and as reliably as
 * possible; adding a PDF render and an object-store round-trip to that path adds
 * two more ways for it to time out and be retried.
 *
 * `userId` is required and is checked against the payment's owner. An invoice
 * exposes a name, an email and a payment history.
 */
export async function getInvoicePdf(paymentId: string, userId: string): Promise<InvoiceResult> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      amountInPaise: true,
      invoiceNumber: true,
      invoiceUrl: true,
      createdAt: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      user: { select: { name: true, email: true } },
    },
  })

  if (!payment) return { ok: false, reason: 'not_found' }
  if (payment.userId !== userId) {
    // Same shape as "not found" at the route boundary, so the response cannot
    // be used to probe which payment ids exist.
    return { ok: false, reason: 'forbidden' }
  }
  if (payment.status !== 'PAID' && payment.status !== 'REFUNDED') {
    return { ok: false, reason: 'not_paid' }
  }

  const course = await db.course.findUnique({
    where: { id: payment.courseId },
    select: { title: true },
  })

  // Claim a number only if this payment does not already have one — otherwise a
  // second download would burn a second number.
  const invoiceNumber = payment.invoiceNumber ?? (await claimInvoiceNumber(payment.createdAt))

  const data: InvoiceData = {
    invoiceNumber,
    issuedAt: payment.createdAt,
    buyerName: payment.user.name,
    buyerEmail: payment.user.email,
    courseTitle: course?.title ?? 'POSH Awareness Training',
    amountInPaise: payment.amountInPaise,
    razorpayPaymentId: payment.razorpayPaymentId ?? '—',
    razorpayOrderId: payment.razorpayOrderId,
  }

  const pdf = await renderInvoicePdf(data)

  // Archiving to R2 is best-effort. A storage outage must not stop a learner
  // downloading the invoice they are entitled to — the PDF is deterministic and
  // can always be re-rendered from the same row.
  const key = invoiceObjectKey(invoiceNumber)
  if (isR2Configured() && !payment.invoiceUrl) {
    try {
      await putObject({ key, body: pdf, contentType: 'application/pdf' })
    } catch (err) {
      console.error('[invoice] R2 upload failed; serving generated PDF anyway', err)
    }
  }

  if (!payment.invoiceNumber) {
    await db.payment.update({
      where: { id: payment.id },
      data: { invoiceNumber, invoiceUrl: key },
    })
  }

  return { ok: true, pdf, invoiceNumber }
}
