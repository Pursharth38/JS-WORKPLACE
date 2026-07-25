// ─────────────────────────────────────────────────────────────────────────────
// DEV B — EDGE-SAFE half of the Auth.js v5 configuration.
//
// ★ NOTHING IN THIS FILE MAY IMPORT PRISMA, bcryptjs, OR ANY NODE BUILT-IN. ★
//
// `middleware.ts` builds its Auth.js instance from this file alone, and
// middleware runs on the Edge runtime. The Prisma adapter and the Credentials
// provider's `authorize()` (which hits the database and bcrypt) live in
// `lib/auth.ts`, which is Node-only and is never imported by middleware.
//
// This is the documented Auth.js v5 "split config" pattern and it is the
// mechanism that satisfies CLAUDE.md's "Never call Prisma from edge middleware".
// ─────────────────────────────────────────────────────────────────────────────
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export const authConfig = {
  // Credentials sign-in is incompatible with database sessions, and JWTs keep
  // the gating chain from hitting Postgres on every navigation.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // `User.name` is NOT NULL in our schema (it is the certificate's legal
      // name). Google can return a profile without `name`, which would make the
      // adapter's createUser throw. Fall back to the email local-part; the
      // learner is prompted to correct it before their first certificate, and
      // `nameLocked` is still false at that point.
      profile(profile) {
        const fallback =
          typeof profile.email === 'string' ? profile.email.split('@')[0] : 'Learner'
        return {
          id: profile.sub,
          name: profile.name?.trim() || fallback,
          email: profile.email,
          image: profile.picture,
        }
      },
      // Deliberately NOT setting allowDangerousEmailAccountLinking. If an email
      // already has a password account, Google sign-in must fail rather than
      // silently take over the account — an attacker who can create a Google
      // account at a victim's address would otherwise inherit their enrolments.
    }),
  ],

  callbacks: {
    /**
     * Runs on every request in middleware. Session-shape only — no I/O.
     */
    authorized({ auth }) {
      return !!auth?.user
    },

    /**
     * `user` is only present on initial sign-in. On later requests the token is
     * already populated, so this is a no-op — which is exactly why it is safe
     * to run on the Edge.
     */
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id
        token.role = user.role ?? 'LEARNER'
        token.nameLocked = user.nameLocked ?? false
      }
      // Lets a Server Action push a fresh name / lock state into the token
      // without forcing the learner to sign out and back in.
      if (trigger === 'update' && session) {
        const patch = session as { name?: string; nameLocked?: boolean }
        if (typeof patch.name === 'string') token.name = patch.name
        if (typeof patch.nameLocked === 'boolean') token.nameLocked = patch.nameLocked
      }
      return token
    },

    session({ session, token }) {
      if (token.uid) session.user.id = token.uid
      session.user.role = token.role ?? 'LEARNER'
      session.user.nameLocked = token.nameLocked ?? false
      return session
    },
  },

  // Never leak which provider or which account failed into a redirect URL.
  trustHost: true,
} satisfies NextAuthConfig
