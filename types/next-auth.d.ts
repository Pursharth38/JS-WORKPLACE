// DEV B — module augmentation so `session.user.id` and `session.user.role` are
// typed everywhere. Without this, every call site needs a cast, and casts are
// how a role check silently becomes `undefined === 'ADMIN'`.
import type { Role } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      nameLocked: boolean
    } & DefaultSession['user']
  }

  interface User {
    role?: Role
    nameLocked?: boolean
  }
}

// NOTE: augment '@auth/core/jwt', NOT 'next-auth/jwt'. The latter is only
// `export * from "@auth/core/jwt"`, so declaring against it creates a second,
// unrelated module and the JWT fields silently stay `unknown` — which then
// narrows to `{}` at the first truthiness check and fails to compile.
declare module '@auth/core/jwt' {
  interface JWT {
    uid?: string
    role?: Role
    nameLocked?: boolean
  }
}

export {}
