// DEV B — shared shell for every transactional email.
//
// Email clients strip <style> blocks and do not understand CSS custom
// properties, so brand colour is inlined here as literal hex. These values are
// the CLAUDE.md tokens: Deep Teal #0F5257 · Amber #C77D26 · Sand #FBF9F5.
// If Dev A's tokens change, this file must be updated by hand.
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

export const brand = {
  teal: '#0F5257',
  amber: '#C77D26',
  sand: '#FBF9F5',
  ink: '#1C1A17',
  muted: '#5F5A52',
  line: '#E4DED4',
} as const

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.sand, margin: 0, padding: '32px 0' }}>
        <Container
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${brand.line}`,
            borderRadius: 8,
            margin: '0 auto',
            maxWidth: 560,
            padding: 0,
          }}
        >
          <Section style={{ backgroundColor: brand.teal, padding: '20px 32px' }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}
            >
              JS Workplace Wellness
            </Text>
          </Section>

          <Section style={{ padding: '32px' }}>
            <Text
              style={{
                color: brand.ink,
                fontFamily: 'Georgia, serif',
                fontSize: 22,
                fontWeight: 600,
                lineHeight: 1.3,
                margin: '0 0 16px',
              }}
            >
              {heading}
            </Text>
            {children}
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />

          <Section style={{ padding: '20px 32px' }}>
            <Text style={{ ...textStyle, color: brand.muted, fontSize: 13, margin: 0 }}>
              JS Workplace Wellness — POSH awareness training and workplace compliance
              support by Jyoti Solaria.
            </Text>
            <Text style={{ ...textStyle, color: brand.muted, fontSize: 13, margin: '8px 0 0' }}>
              <Link href={`${siteUrl}/privacy`} style={{ color: brand.muted }}>
                Privacy
              </Link>
              {'  ·  '}
              <Link href={`${siteUrl}/terms`} style={{ color: brand.muted }}>
                Terms
              </Link>
              {'  ·  '}
              <Link href={`${siteUrl}/contact`} style={{ color: brand.muted }}>
                Contact
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const textStyle: React.CSSProperties = {
  color: brand.ink,
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  margin: '0 0 16px',
}

export const mutedStyle: React.CSSProperties = {
  ...textStyle,
  color: brand.muted,
  fontSize: 14,
}

/**
 * Amber on white clears 4.5:1 only at ≥18px, so the button label is pinned at
 * 18px. Do not reuse this style for small text.
 */
export const buttonStyle: React.CSSProperties = {
  backgroundColor: brand.amber,
  borderRadius: 6,
  color: '#FFFFFF',
  display: 'inline-block',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  padding: '12px 28px',
  textDecoration: 'none',
}
