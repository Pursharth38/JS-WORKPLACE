'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signupAction, type ActionState } from '@/app/(auth)/actions'
import {
  ConsentCheckbox,
  Field,
  FormAlert,
  Honeypot,
  SubmitButton,
} from '@/components/auth/form-fields'

const initial: ActionState = { status: 'idle' }

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initial)

  // On success the form is replaced by the confirmation message. Leaving the
  // fields on screen invites a second submit, which would burn the rate limit
  // and supersede the token in the email they were just told to go and click.
  if (state.status === 'success') {
    return (
      <div>
        <FormAlert state={state} />
        <p className="text-[15px] leading-relaxed text-[var(--brand-muted)]">
          The link is valid for 24 hours. If it does not arrive within a few minutes, check
          your spam folder, or{' '}
          <Link href="/verify-email" className="text-[var(--brand-teal)] hover:underline">
            request a new one
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} noValidate>
      <FormAlert state={state} />
      <Honeypot />

      <Field
        label="Full legal name"
        name="name"
        required
        autoComplete="name"
        hint="This is printed on your Certificate of Completion and is locked once the certificate is issued. Enter it exactly as it should appear."
      />
      <Field
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
      />
      <Field label="Phone number" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 10 characters."
      />

      {/* DPDP Act: renders unticked, and the schema requires it to arrive true. */}
      <ConsentCheckbox name="consentGiven">
        I agree to the{' '}
        <Link href="/terms" className="text-[var(--brand-teal)] underline">
          Terms of Service
        </Link>{' '}
        and consent to my personal data being processed as described in the{' '}
        <Link href="/privacy" className="text-[var(--brand-teal)] underline">
          Privacy Policy
        </Link>
        .
      </ConsentCheckbox>

      <SubmitButton>Create account</SubmitButton>
    </form>
  )
}
