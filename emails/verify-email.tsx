// DEV B — sent on signup. The link carries a single-use, 24h token.
import { Button, Link, Text } from '@react-email/components'
import * as React from 'react'

import { EmailLayout, buttonStyle, mutedStyle, textStyle } from './components/email-layout'

export function VerifyEmail({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return (
    <EmailLayout
      preview="Confirm your email to start your POSH awareness training"
      heading="Confirm your email address"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Thanks for creating an account. Please confirm your email address so we can
        activate your access.
      </Text>

      <Text style={{ margin: '0 0 24px' }}>
        <Button href={verifyUrl} style={buttonStyle}>
          Confirm email address
        </Button>
      </Text>

      <Text style={mutedStyle}>
        Or paste this link into your browser:
        <br />
        <Link href={verifyUrl} style={{ color: '#0F5257', wordBreak: 'break-all' }}>
          {verifyUrl}
        </Link>
      </Text>

      <Text style={mutedStyle}>
        This link expires in 24 hours and can only be used once. If you did not create
        this account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  )
}

export default VerifyEmail
