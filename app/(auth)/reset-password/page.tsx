import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard } from '@/components/auth/auth-card'
import { ResetPasswordForm } from '@/components/auth/password-forms'

export const metadata: Metadata = { title: 'Choose a new password' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  // The token is NOT validated here. Doing so would turn this page into an
  // oracle an attacker could use to test candidate tokens without submitting a
  // password. It is validated once, atomically, when the form is submitted.
  if (!token) {
    return (
      <AuthCard title="This link is incomplete">
        <p className="mb-5 text-[15px] leading-relaxed text-[var(--brand-muted)]">
          The reset link appears to be missing part of its address. Email clients
          occasionally break long links across lines — try copying the whole link, or
          request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full rounded-md bg-[var(--brand-teal)] px-4 py-3 text-center text-[17px] font-semibold text-white hover:bg-[var(--brand-teal-hover)]"
        >
          Request a new link
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Pick something you have not used before.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  )
}
