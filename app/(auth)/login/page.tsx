import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthCard, OrDivider } from '@/components/auth/auth-card'
import { GoogleButton } from '@/components/auth/google-button'
import { LoginForm } from '@/components/auth/login-form'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}) {
  const { redirectTo } = await searchParams

  // Already signed in — send them where they were going rather than showing a
  // login form they cannot meaningfully use.
  if (await getSession()) redirect(safeRedirect(redirectTo))

  return (
    <AuthCard title="Sign in" subtitle="Continue your POSH awareness training.">
      <GoogleButton redirectTo={redirectTo} label="Sign in with Google" />
      <OrDivider />
      <LoginForm redirectTo={redirectTo} />

      <p className="mt-6 text-center text-[15px] text-[var(--brand-muted)]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-[var(--brand-primary)] hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  )
}

/** Mirrors `sanitizeRedirect` in actions.ts — never redirect off-origin. */
function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith('/')) return '/dashboard'
  if (value.startsWith('//') || value.startsWith('/\\')) return '/dashboard'
  return value
}
