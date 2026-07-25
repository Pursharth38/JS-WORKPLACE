// DEV B — sent by the Razorpay webhook after payment.captured, once enrolment
// has actually been written. Never sent from the client success handler.
import { Button, Hr, Text } from '@react-email/components'
import * as React from 'react'

import { EmailLayout, brand, buttonStyle, mutedStyle, textStyle } from './components/email-layout'

/** Paise → "₹4,999.00". Money is integer paise everywhere; never a float. */
export function formatInr(amountInPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amountInPaise / 100)
}

export function Receipt({
  name,
  courseTitle,
  amountInPaise,
  razorpayPaymentId,
  paidAt,
  courseUrl,
  invoiceUrl,
}: {
  name: string
  courseTitle: string
  amountInPaise: number
  razorpayPaymentId: string
  paidAt: Date
  courseUrl: string
  invoiceUrl?: string | null
}) {
  const row: React.CSSProperties = { ...textStyle, margin: '0 0 6px' }

  return (
    <EmailLayout
      preview={`Payment received for ${courseTitle}`}
      heading="Payment received — you are enrolled"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        We have received your payment and your enrolment is active. You can start the
        course whenever you are ready.
      </Text>

      <Hr style={{ borderColor: brand.line, margin: '0 0 16px' }} />

      <Text style={row}>
        <strong>Course:</strong> {courseTitle}
      </Text>
      <Text style={row}>
        <strong>Amount paid:</strong> {formatInr(amountInPaise)}
      </Text>
      <Text style={row}>
        <strong>Payment reference:</strong> {razorpayPaymentId}
      </Text>
      <Text style={{ ...row, margin: '0 0 20px' }}>
        <strong>Date:</strong>{' '}
        {paidAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>

      <Hr style={{ borderColor: brand.line, margin: '0 0 20px' }} />

      <Text style={{ margin: '0 0 24px' }}>
        <Button href={courseUrl} style={buttonStyle}>
          Start the course
        </Button>
      </Text>

      {invoiceUrl ? (
        <Text style={mutedStyle}>
          Your tax invoice is available in your dashboard under Invoices, or{' '}
          <a href={invoiceUrl} style={{ color: brand.teal }}>
            download it here
          </a>
          .
        </Text>
      ) : (
        <Text style={mutedStyle}>
          Your tax invoice will appear in your dashboard under Invoices shortly.
        </Text>
      )}

      <Text style={mutedStyle}>
        Refunds are governed by our refund policy. Keep the payment reference above if you
        need to contact us about this transaction.
      </Text>
    </EmailLayout>
  )
}

export default Receipt
