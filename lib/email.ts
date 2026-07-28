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

import { ComplianceReport } from '@/emails/compliance-report'
import { LeadMagnet } from '@/emails/lead-magnet'
import { LeadNotification } from '@/emails/lead-notification'
import { Receipt } from '@/emails/receipt'
import { ResetPassword } from '@/emails/reset-password'
import { VerifyEmail } from '@/emails/verify-email'
import { Welcome } from '@/emails/welcome'
import { getSiteSettings } from '@/lib/content'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

const FROM = process.env.EMAIL_FROM ?? 'JS Workplace Wellness <noreply@jsworkplacewellness.com>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Reply-To for every outgoing email.
 *
 * FROM is a `noreply@` address with no mailbox behind it — DKIM signing is what
 * authorises the send, not an inbox. Without an explicit Reply-To, anyone who
 * hits reply on a report, receipt or verification mail writes into a void and
 * hears nothing back. That is the single most likely way to lose a warm lead.
 *
 * Resolved from site settings so the client can change the destination without
 * a deploy (`getSiteSettings` is `unstable_cache`-wrapped, so this costs no
 * real query per send). `EMAIL_REPLY_TO` overrides it for environments with no
 * database — CI, preview builds.
 *
 * Never throws: this module's contract (see file header) is that delivery is
 * fail-soft, so a settings lookup failing must degrade to "no Reply-To" rather
 * than swallow the email.
 */
async function defaultReplyTo(): Promise<string | undefined> {
  if (process.env.EMAIL_REPLY_TO) return process.env.EMAIL_REPLY_TO

  try {
    const settings = await getSiteSettings()
    return settings.email || undefined
  } catch (err) {
    console.warn('[email] could not resolve Reply-To from site settings', err)
    return undefined
  }
}

async function send(args: {
  to: string
  subject: string
  react: React.ReactElement
  /**
   * Overrides the site-settings Reply-To. Pass the visitor's own address on
   * notifications sent TO the client, so replying reaches the person who
   * enquired rather than her own inbox.
   */
  replyTo?: string
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
    const replyTo = args.replyTo ?? (await defaultReplyTo())

    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      react: args.react,
      // Omitted entirely when unresolved — Resend rejects an empty string.
      ...(replyTo ? { replyTo } : {}),
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

// ── DEV A — marketing & lead emails ─────────────────────────────────────────

/**
 * Internal notification to the client when a lead arrives.
 *
 * Fire-and-forget from the route: CONTRACTS.md is explicit that the response
 * must never block on email. A visitor who filled in a form correctly should
 * see success even if Resend is down — the Lead row is already committed.
 */
export async function sendLeadNotification(args: {
  to: string
  name: string
  email: string
  phone?: string | undefined
  organization?: string | undefined
  employeeCount?: string | undefined
  serviceInterest?: string | undefined
  message?: string | undefined
  source: string
}): Promise<boolean> {
  return send({
    to: args.to,
    subject: `New enquiry — ${args.name}${args.organization ? ` (${args.organization})` : ''}`,
    // This one goes TO the client, so Reply-To is the enquirer — hitting reply
    // answers the lead directly instead of looping back to her own inbox.
    replyTo: args.email,
    react: React.createElement(LeadNotification, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      organization: args.organization,
      employeeCount: args.employeeCount,
      serviceInterest: args.serviceInterest,
      message: args.message,
      source: args.source,
    }),
  })
}

/** Delivers the gated compliance checklist (E2). */
export async function sendLeadMagnetEmail(args: {
  to: string
  name: string
  downloadPath: string
}): Promise<boolean> {
  return send({
    to: args.to,
    subject: 'Your POSH compliance checklist',
    devHint: `${SITE}${args.downloadPath}`,
    react: React.createElement(LeadMagnet, {
      name: args.name,
      downloadUrl: `${SITE}${args.downloadPath}`,
    }),
  })
}

/**
 * Emails the result of the 8-question self-check (E3).
 *
 * `checklistUrl` carries the same signed download link the gated lead magnet
 * uses, so someone who completes the self-check gets the checklist PDF without
 * having to fill a second form for it. Optional: if the token could not be
 * minted, the result still goes out without it.
 */
export async function sendComplianceReportEmail(args: {
  to: string
  name: string
  scorePercent: number
  bandLabel: string
  gaps: string[]
  checklistUrl?: string | undefined
}): Promise<boolean> {
  return send({
    to: args.to,
    subject: `Your POSH self-check result — ${args.bandLabel}`,
    react: React.createElement(ComplianceReport, {
      name: args.name,
      scorePercent: args.scorePercent,
      bandLabel: args.bandLabel,
      gaps: args.gaps,
      demoUrl: `${SITE}/book-demo`,
      checklistUrl: args.checklistUrl,
    }),
  })
}
