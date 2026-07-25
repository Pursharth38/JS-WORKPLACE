'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { confirmEmailAction, type ActionState } from '@/app/(auth)/actions'
import { FormAlert, SubmitButton } from '@/components/auth/form-fields'

const initial: ActionState = { status: 'idle' }

export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(confirmEmailAction, initial)

  if (state.status === 'success') {
    return (
      <div>
        <FormAlert state={state} />
        <Link
          href="/login"
          className="block w-full rounded-md bg-[var(--brand-teal)] px-4 py-3 text-center text-[17px] font-semibold text-white hover:bg-[var(--brand-teal-hover)]"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton>Confirm my email address</SubmitButton>

      {state.status === 'error' && (
        <p className="mt-5 text-center text-[15px] text-[var(--brand-muted)]">
          <Link href="/verify-email" className="text-[var(--brand-teal)] hover:underline">
            Request a new confirmation link
          </Link>
        </p>
      )}
    </form>
  )
}
