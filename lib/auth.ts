// ─────────────────────────────────────────────────────────────────────────────
// DEV B — NODE-ONLY half of the Auth.js v5 configuration.
//
// Imports Prisma and bcryptjs, so this file MUST NOT be imported by
// `middleware.ts`. Middleware imports `lib/auth.config.ts` instead.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import { authConfig } from '@/lib/auth.config'
import { db } from '@/lib/db'
import { verifyPasswordConstantTime } from '@/lib/password'
import { loginSchema } from '@/lib/schemas/auth'

/**
 * Surfaced as `?code=email_unverified` on the login page.
 *
 * This is only ever thrown AFTER the supplied password has been verified as
 * correct. Ordering it that way means it discloses nothing to an attacker who
 * does not already hold valid credentials, while still giving a real learner a
 * route out of the "my password works but I can't get in" dead end.
 */
export class EmailUnverifiedError extends CredentialsSignin {
  code = 'email_unverified'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw)
        // Malformed input is indistinguishable from bad credentials by design.
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db.user.findUnique({
          where: { email },
          // passwordHash is selected here and ONLY here. It is compared and
          // discarded — it never reaches the returned object, the JWT, or a
          // response body.
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            nameLocked: true,
            emailVerified: true,
            passwordHash: true,
          },
        })

        // `verifyPasswordConstantTime` burns an equivalent bcrypt round against
        // a dummy hash when the user is absent or is OAuth-only, so login
        // response time does not reveal whether an email is registered.
        const ok = await verifyPasswordConstantTime(password, user?.passwordHash ?? null)
        if (!user || !ok) return null

        if (!user.emailVerified) throw new EmailUnverifiedError()

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          nameLocked: user.nameLocked,
        }
      },
    }),
  ],

  events: {
    /**
     * Google has already verified the address it hands us, so an account
     * created through OAuth should not be stuck behind our own verification
     * gate. The adapter does not set this for us because our custom `profile()`
     * mapping does not return `emailVerified`.
     */
    async linkAccount({ user }) {
      if (!user.id) return
      await db.user.updateMany({
        where: { id: user.id, emailVerified: null },
        data: { emailVerified: new Date() },
      })
    },
  },
})
