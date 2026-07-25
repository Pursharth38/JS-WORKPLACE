// DEV B — sent once, after the email address is confirmed.
//
// ⚠️ Copy in this file is subject to CLAUDE.md §1 (NO FALSE AUTHORITY). Jyoti
//    Solaria is not empanelled by the MWCD. None of §1's forbidden
//    certification/government claim strings may appear — not quoted here so a
//    source grep stays clean. The credential is a Certificate of Completion.
import { Button, Text } from '@react-email/components'
import * as React from 'react'

import { EmailLayout, buttonStyle, mutedStyle, textStyle } from './components/email-layout'

export function Welcome({ name, dashboardUrl }: { name: string; dashboardUrl: string }) {
  return (
    <EmailLayout
      preview="Your account is ready"
      heading="Your account is ready"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Your email is confirmed and your account is active. You can browse the POSH
        awareness course, read the knowledge hub, and track your progress from your
        dashboard.
      </Text>

      <Text style={{ margin: '0 0 24px' }}>
        <Button href={dashboardUrl} style={buttonStyle}>
          Go to your dashboard
        </Button>
      </Text>

      <Text style={mutedStyle}>
        <strong>One thing worth checking now:</strong> we registered your name as{' '}
        <strong>{name}</strong>. This is the name printed on your Certificate of
        Completion, and it is locked once a certificate is issued. If it is not your full
        legal name, update it in your dashboard before you finish the course.
      </Text>
    </EmailLayout>
  )
}

export default Welcome
