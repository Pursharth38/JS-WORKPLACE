import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthCard, OrDivider } from '@/components/auth/auth-card'
import { GoogleButton } from '@/components/auth/google-button'
import { SignupForm } from '@/components/auth/signup-form'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Create an account' }

export default async function SignupPage() {
  if (await getSession()) redirect('/dashboard')

  return (
    <AuthCard
      title="Create your account"
      subtitle="You will need an account to enrol, track your progress, and receive your certificate."
    >
      <GoogleButton label="Sign up with Google" />
      <OrDivider />
      <SignupForm />

      <p className="mt-6 text-center text-[15px] text-[var(--brand-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--brand-primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
