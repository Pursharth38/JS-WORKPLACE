'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { loginAction, type ActionState } from '@/app/(auth)/actions'
import { Field, FormAlert, SubmitButton } from '@/components/auth/form-fields'

const initial: ActionState = { status: 'idle' }

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(loginAction, initial)

  return (
    <form action={formAction} noValidate>
      <FormAlert state={state} />

      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <Field
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />

      <div className="mb-5 text-right">
        <Link
          href="/forgot-password"
          className="text-[14px] text-[var(--brand-teal)] hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <SubmitButton>Sign in</SubmitButton>
    </form>
  )
}
