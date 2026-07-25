'use server'

// ─────────────────────────────────────────────────────────────────────────────
// DEV B — Server Actions behind the auth pages.
//
// Node runtime by construction (Prisma + bcrypt). Every action returns a
// discriminated `ActionState` rather than throwing, so the forms can render
// errors without a client-side fetch layer.
//
// ENUMERATION POLICY (applies to signup, forgot-password, and resend):
//   The response is IDENTICAL whether or not the address is registered. An
//   endpoint that says "email already in use" is a free membership oracle — it
//   tells an attacker exactly which addresses to target with credential
//   stuffing. Where the distinction matters to a real user, it is delivered by
//   email, to the address in question, where only its owner can read it.
// ─────────────────────────────────────────────────────────────────────────────

import { AuthError } from 'next-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { signIn } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '@/lib/email'
import { hashPassword } from '@/lib/password'
import { clientIp, rateLimit } from '@/lib/ratelimit'
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from '@/lib/schemas/auth'
import {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  issueEmailVerificationToken,
  issuePasswordResetToken,
} from '@/lib/tokens'

export type ActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const RATE_LIMITED = 'Too many attempts. Please wait a few minutes and try again.'

async function ip(): Promise<string> {
  return clientIp(await headers())
}

// ── SIGN UP ─────────────────────────────────────────────────────────────────

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limit = await rateLimit.signupIp(await ip())
  if (!limit.success) return { status: 'error', message: RATE_LIMITED }

  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone') ?? undefined,
    consentGiven: formData.get('consentGiven') === 'on' || formData.get('consentGiven') === 'true',
    website: formData.get('website') ?? '',
  })

  if (!parsed.success) {
    // Surface the first field message — these are user-facing copy written in
    // the schema, not raw Zod internals, so they do not leak the schema shape.
    const first = parsed.error.issues[0]
    return { status: 'error', message: first?.message ?? 'Please check the form and try again.' }
  }

  const { name, email, password, phone, website } = parsed.data

  // Honeypot: a real user never sees this field. Return the same success shape
  // a human gets so the bot cannot tell it was filtered.
  if (website) {
    return { status: 'success', message: 'Check your inbox to confirm your email address.' }
  }

  const SUCCESS: ActionState = {
    status: 'success',
    message: 'Check your inbox to confirm your email address.',
  }

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true, passwordHash: true },
    })

    if (existing) {
      // Do NOT reveal that the address is taken. Instead, act helpfully over
      // email — only the mailbox owner sees the difference.
      if (!existing.emailVerified) {
        // Unverified: they probably never finished signing up. Resend the link.
        const token = await issueEmailVerificationToken(email)
        await sendVerificationEmail({ to: email, name: existing.name, token })
      } else if (existing.passwordHash) {
        // Verified password account: send a reset rather than a signup link, so
        // a genuine "I forgot I had an account" ends somewhere useful.
        const token = await issuePasswordResetToken(existing.id)
        await sendPasswordResetEmail({ to: email, name: existing.name, token })
      } else {
        // Verified OAuth-only account. Adding a password here would let anyone
        // who knows the address set credentials on someone else's account.
        // Send a reset link — it proves mailbox control before any write.
        const token = await issuePasswordResetToken(existing.id)
        await sendPasswordResetEmail({ to: email, name: existing.name, token })
      }
      return SUCCESS
    }

    const passwordHash = await hashPassword(password)
    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone ?? null,
        role: 'LEARNER',
        nameLocked: false,
        consentGivenAt: new Date(), // DPDP: timestamped record of the unticked-checkbox consent
      },
    })

    const token = await issueEmailVerificationToken(email)
    await sendVerificationEmail({ to: email, name, token })

    return SUCCESS
  } catch (err) {
    console.error('[auth:signup]', err)
    return { status: 'error', message: GENERIC_ERROR }
  }
}

// ── LOG IN ──────────────────────────────────────────────────────────────────

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { status: 'error', message: 'Invalid email or password.' }

  const { email, password } = parsed.data

  // CONTRACTS.md: 10 / 15min per IP · 5 / 15min per email. Both are checked —
  // the per-IP limit stops a broad sweep, the per-email limit stops a
  // distributed attack concentrating on one account.
  const [byIp, byEmail] = await Promise.all([
    rateLimit.loginIp(await ip()),
    rateLimit.loginEmail(email),
  ])
  if (!byIp.success || !byEmail.success) return { status: 'error', message: RATE_LIMITED }

  const redirectTo = sanitizeRedirect(formData.get('redirectTo'))

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === 'CredentialsSignin' && (err as { code?: string }).code === 'email_unverified') {
        return {
          status: 'error',
          message:
            'Your email address is not confirmed yet. Check your inbox for the confirmation link, or request a new one below.',
        }
      }
      return { status: 'error', message: 'Invalid email or password.' }
    }
    throw err
  }

  // `redirect` throws a control-flow signal; it must be outside the try/catch
  // above or the AuthError branch would swallow it.
  //
  // The cast is required by Dev A's `typedRoutes` (next.config.ts): the target is
  // computed at runtime from `formData`, so it cannot be a statically known route
  // literal. Safety here comes from `sanitizeRedirect()` below, which is the trust
  // boundary — it rejects anything that is not a same-origin, path-relative URL.
  // Not `any`, not `@ts-ignore`: this tracks `redirect`'s real signature.
  redirect(redirectTo as Parameters<typeof redirect>[0])
}

/**
 * Only same-origin, path-relative destinations are honoured. Echoing an
 * arbitrary `redirectTo` back into `redirect()` turns the login page into an
 * open redirect — a phishing primitive that borrows the site's credibility.
 * `//evil.com` and `/\evil.com` are both browser-protocol-relative, hence the
 * second character check.
 */
function sanitizeRedirect(value: FormDataEntryValue | null): string {
  const fallback = '/dashboard'
  if (typeof value !== 'string' || value.length === 0) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

/**
 * Kicks off the Google OAuth redirect. `signIn` throws a redirect signal, so
 * this action never returns normally.
 */
export async function googleSignInAction(formData: FormData): Promise<void> {
  const redirectTo = sanitizeRedirect(formData.get('redirectTo'))
  await signIn('google', { redirectTo })
}

// ── EMAIL VERIFICATION ──────────────────────────────────────────────────────

/**
 * Confirms an email address. Bound to a form, i.e. a POST — deliberately NOT run
 * during the GET render of /verify-email.
 *
 * Corporate mail security (Outlook Safe Links, Proofpoint, Mimecast) fetches
 * every URL in an inbound email to scan it. If the token were consumed on GET,
 * the scanner would burn it before the learner ever clicked, and they would land
 * on "this link has expired" every single time. Requiring an explicit POST costs
 * one button press and makes the flow work inside the corporate mail estate this
 * course is actually sold into.
 */
export async function confirmEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = formData.get('token')
  if (typeof token !== 'string') {
    return { status: 'error', message: 'This confirmation link is invalid or has expired.' }
  }
  return verifyEmailAction(token)
}

export async function verifyEmailAction(token: string): Promise<ActionState> {
  const parsed = verifyEmailSchema.safeParse({ token })
  if (!parsed.success) {
    return { status: 'error', message: 'This confirmation link is invalid or has expired.' }
  }

  try {
    const email = await consumeEmailVerificationToken(parsed.data.token)
    if (!email) {
      return { status: 'error', message: 'This confirmation link is invalid or has expired.' }
    }

    const user = await db.user.findUnique({ where: { email }, select: { name: true } })
    if (user) await sendWelcomeEmail({ to: email, name: user.name })

    return { status: 'success', message: 'Your email is confirmed. You can sign in now.' }
  } catch (err) {
    console.error('[auth:verify-email]', err)
    return { status: 'error', message: GENERIC_ERROR }
  }
}

export async function resendVerificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })

  // Same response regardless of outcome — see ENUMERATION POLICY above.
  const SUCCESS: ActionState = {
    status: 'success',
    message: 'If that address needs confirming, a new link is on its way.',
  }
  if (!parsed.success) return SUCCESS

  const { email } = parsed.data
  const limit = await rateLimit.resetEmail(email)
  if (!limit.success) return { status: 'error', message: RATE_LIMITED }

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    })
    if (user && !user.emailVerified) {
      const token = await issueEmailVerificationToken(email)
      await sendVerificationEmail({ to: email, name: user.name, token })
    }
  } catch (err) {
    console.error('[auth:resend-verification]', err)
  }

  return SUCCESS
}

// ── PASSWORD RESET ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })

  const SUCCESS: ActionState = {
    status: 'success',
    message: 'If an account exists for that address, a reset link is on its way.',
  }
  if (!parsed.success) return SUCCESS

  const { email } = parsed.data
  const limit = await rateLimit.resetEmail(email)
  if (!limit.success) return { status: 'error', message: RATE_LIMITED }

  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true } })
    if (user) {
      const token = await issuePasswordResetToken(user.id)
      await sendPasswordResetEmail({ to: email, name: user.name, token })
    }
  } catch (err) {
    console.error('[auth:forgot-password]', err)
  }

  return SUCCESS
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      status: 'error',
      message: first?.message ?? 'This reset link is invalid or has expired.',
    }
  }

  try {
    const userId = await consumePasswordResetToken(parsed.data.token)
    if (!userId) {
      return { status: 'error', message: 'This reset link is invalid or has expired.' }
    }

    const passwordHash = await hashPassword(parsed.data.password)
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        // Completing a reset proves mailbox control, which is exactly what
        // email verification proves. An unverified account that resets its
        // password should not stay locked out.
        emailVerified: new Date(),
      },
    })

    return {
      status: 'success',
      message: 'Your password has been updated. You can sign in now.',
    }
  } catch (err) {
    console.error('[auth:reset-password]', err)
    return { status: 'error', message: GENERIC_ERROR }
  }
}
