import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ConfirmEmailForm } from '@/components/auth/confirm-email-form'
import { ResendVerificationForm } from '@/components/auth/password-forms'

export const metadata: Metadata = { title: 'Confirm your email' }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (token) {
    return (
      <AuthCard
        title="Confirm your email address"
        subtitle="One last step before you can sign in."
      >
        <ConfirmEmailForm token={token} />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Resend confirmation link"
      subtitle="Enter your email address and we will send a fresh confirmation link."
    >
      <ResendVerificationForm />

      <p className="mt-6 text-center text-[15px] text-[var(--brand-muted)]">
        <Link href="/login" className="font-medium text-[var(--brand-teal)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
