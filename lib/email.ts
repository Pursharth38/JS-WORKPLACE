// ─────────────────────────────────────────────────────────────────────────────
// DEV B — Resend delivery wrapper.
//
// Every send is FAIL-SOFT: it returns a boolean and never throws. A route must
// not 500 because an email provider is having a bad minute — the account was
// still created, the payment was still captured. Failures are logged loudly and
// the affected flows all offer a resend.
// NODE RUNTIME ONLY.
// ─────────────────────────────────────────────────────────────────────────────
import * as React from 'react'
import { Resend } from 'resend'

import { Receipt } from '@/emails/receipt'
import { ResetPassword } from '@/emails/reset-password'
import { VerifyEmail } from '@/emails/verify-email'
import { Welcome } from '@/emails/welcome'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

const FROM = process.env.EMAIL_FROM ?? 'JS Workplace Wellness <noreply@jsworkplacewellness.com>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

async function send(args: {
  to: string
  subject: string
  react: React.ReactElement
  /** Printed to the server log when RESEND_API_KEY is absent, so local dev works. */
  devHint?: string
}): Promise<boolean> {
  if (!resend) {
    // No key configured (local dev / CI). Do not silently swallow — surface the
    // actionable link on the console so the flow can still be walked end to end.
    console.warn(
      `[email] RESEND_API_KEY not set — email to ${args.to} ("${args.subject}") was NOT sent.` +
        (args.devHint ? `\n[email] dev link: ${args.devHint}` : ''),
    )
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      react: args.react,
    })
    if (error) {
      console.error('[email] resend rejected send', { to: args.to, error })
      return false
    }
    return true
  } catch (err) {
    console.error('[email] send threw', { to: args.to, err })
    return false
  }
}

export async function sendVerificationEmail(args: {
  to: string
  name: string
  token: string
}): Promise<boolean> {
  const verifyUrl = `${SITE}/verify-email?token=${encodeURIComponent(args.token)}`
  return send({
    to: args.to,
    subject: 'Confirm your email address',
    react: React.createElement(VerifyEmail, { name: args.name, verifyUrl }),
    devHint: verifyUrl,
  })
}

export async function sendPasswordResetEmail(args: {
  to: string
  name: string
  token: string
}): Promise<boolean> {
  const resetUrl = `${SITE}/reset-password?token=${encodeURIComponent(args.token)}`
  return send({
    to: args.to,
    subject: 'Reset your password',
    react: React.createElement(ResetPassword, { name: args.name, resetUrl }),
    devHint: resetUrl,
  })
}

export async function sendWelcomeEmail(args: { to: string; name: string }): Promise<boolean> {
  return send({
    to: args.to,
    subject: 'Your account is ready',
    react: React.createElement(Welcome, { name: args.name, dashboardUrl: `${SITE}/dashboard` }),
  })
}

export async function sendReceiptEmail(args: {
  to: string
  name: string
  courseTitle: string
  courseSlug: string
  amountInPaise: number
  razorpayPaymentId: string
  paidAt: Date
  invoiceUrl?: string | null
}): Promise<boolean> {
  return send({
    to: args.to,
    subject: `Payment received — ${args.courseTitle}`,
    react: React.createElement(Receipt, {
      name: args.name,
      courseTitle: args.courseTitle,
      amountInPaise: args.amountInPaise,
      razorpayPaymentId: args.razorpayPaymentId,
      paidAt: args.paidAt,
      courseUrl: `${SITE}/learn/${args.courseSlug}`,
      invoiceUrl: args.invoiceUrl ?? null,
    }),
  })
}
