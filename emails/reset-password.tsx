// DEV B — sent on a forgot-password request. Single-use, 1h token.
import { Button, Link, Text } from '@react-email/components'
import * as React from 'react'

import { EmailLayout, buttonStyle, mutedStyle, textStyle } from './components/email-layout'

export function ResetPassword({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <EmailLayout preview="Reset your JS Workplace Wellness password" heading="Reset your password">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        We received a request to reset the password on your account. Use the button below
        to choose a new one.
      </Text>

      <Text style={{ margin: '0 0 24px' }}>
        <Button href={resetUrl} style={buttonStyle}>
          Choose a new password
        </Button>
      </Text>

      <Text style={mutedStyle}>
        Or paste this link into your browser:
        <br />
        <Link href={resetUrl} style={{ color: '#0F5257', wordBreak: 'break-all' }}>
          {resetUrl}
        </Link>
      </Text>

      <Text style={mutedStyle}>
        This link expires in 1 hour and can only be used once.{' '}
        <strong>If you did not request a password reset, ignore this email</strong> — your
        current password still works and nothing has changed.
      </Text>
    </EmailLayout>
  )
}

export default ResetPassword
