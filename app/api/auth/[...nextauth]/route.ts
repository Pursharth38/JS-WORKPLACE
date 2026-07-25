// DEV B — Auth.js v5 handler. Node runtime: this path reaches Prisma and bcrypt.
import { handlers } from '@/lib/auth'

export const runtime = 'nodejs'

export const { GET, POST } = handlers
