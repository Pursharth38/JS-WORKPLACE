// ─────────────────────────────────────────────────────────────────────────────
// DEV B — edge proxy (renamed from `middleware.ts` 2026-07-26: Next 16
// deprecates the `middleware` file convention in favour of `proxy` — same
// root-level location, same default + `config` export shape, filename only).
//
// ★ SESSION CHECK AND REDIRECT ONLY. ★
//
// This file imports `lib/auth.config.ts` (edge-safe) and NEVER `lib/auth.ts`
// (which pulls in the Prisma adapter and bcryptjs). Prisma cannot run on the
// Edge runtime, and CLAUDE.md forbids calling it from here.
//
// Nothing decided in this file is an authorization decision. It exists to send
// a signed-out visitor to the login page instead of showing them an empty
// dashboard. REAL authorization happens in the route handler / page, via
// requireSession(), requireAdmin(), isEnrolled(), and computeUnlockState().
// A forged or stale JWT that slipped past here still cannot read data, because
// every gated read re-checks server-side.
// ─────────────────────────────────────────────────────────────────────────────
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isSignedIn = !!req.auth?.user

  if (!isSignedIn) {
    const login = new URL('/login', nextUrl.origin)
    // Preserve the destination so the learner lands where they were headed.
    // Path + query only — never the full URL, which would let an attacker craft
    // /dashboard?…  → /login?redirectTo=https://evil.example and turn the login
    // page into an open redirect. `sanitizeRedirect` in actions.ts is the second
    // line of defence on the same value.
    login.searchParams.set('redirectTo', `${nextUrl.pathname}${nextUrl.search}`)
    return NextResponse.redirect(login)
  }

  // Fast path for the admin area: bounce a learner before rendering. This is a
  // convenience, NOT the access control — the JWT role claim is up to 30 days
  // stale, so every admin route independently calls requireAdmin(), which
  // re-reads the role from the database.
  if (nextUrl.pathname.startsWith('/admin') && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/learn/:path*',
    '/admin/:path*',
  ],
  // NOTE: /studio is deliberately absent — Sanity Studio handles its own auth,
  // and routing it through Auth.js would lock the client out of her own CMS.
  // Also absent by design: /verify/:certId (public certificate verification —
  // an employer checking a candidate has no account here), the marketing pages,
  // and /api/webhooks/* (Razorpay and Sanity authenticate by HMAC, not session).
}
