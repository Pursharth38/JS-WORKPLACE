import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ForgotPasswordForm } from '@/components/auth/password-forms'

export const metadata: Metadata = { title: 'Reset your password' }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter the email address on your account and we will send you a link to choose a new password."
    >
      <ForgotPasswordForm />

      <p className="mt-6 text-center text-[15px] text-[var(--brand-muted)]">
        <Link href="/login" className="font-medium text-[var(--brand-primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
