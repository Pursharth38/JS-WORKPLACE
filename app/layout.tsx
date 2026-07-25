// ⚠️ FILE OWNER: DEV A (task P1-01/P1-03 — fonts, Plausible, Toaster).
//    Minimal placeholder created by DEV B so Dev B's routes render offline.
//    On merge: take Dev A's version wholesale.
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'JS Workplace Wellness',
    template: '%s · JS Workplace Wellness',
  },
  description: 'POSH awareness training and workplace compliance support.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
