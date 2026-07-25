'use client'

import { useActionState } from 'react'

import {
  forgotPasswordAction,
  resendVerificationAction,
  resetPasswordAction,
  type ActionState,
} from '@/app/(auth)/actions'
import { Field, FormAlert, SubmitButton } from '@/components/auth/form-fields'

const initial: ActionState = { status: 'idle' }

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial)

  return (
    <form action={formAction} noValidate>
      <FormAlert state={state} />
      {state.status !== 'success' && (
        <>
          <Field
            label="Email address"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
          />
          <SubmitButton>Send reset link</SubmitButton>
        </>
      )}
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initial)

  if (state.status === 'success') {
    return (
      <div>
        <FormAlert state={state} />
        <a
          href="/login"
          className="mt-2 block w-full rounded-md bg-[var(--brand-teal)] px-4 py-3 text-center text-[17px] font-semibold text-white hover:bg-[var(--brand-teal-hover)]"
        >
          Sign in
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="token" value={token} />
      <Field
        label="New password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 10 characters."
      />
      <SubmitButton>Update password</SubmitButton>
    </form>
  )
}

export function ResendVerificationForm() {
  const [state, formAction] = useActionState(resendVerificationAction, initial)

  return (
    <form action={formAction} noValidate>
      <FormAlert state={state} />
      {state.status !== 'success' && (
        <>
          <Field
            label="Email address"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
          />
          <SubmitButton>Send a new confirmation link</SubmitButton>
        </>
      )}
    </form>
  )
}
