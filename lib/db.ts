// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  FILE OWNER: DEV A (task P1-06). Transcribed by DEV B to unblock offline
//     work. Standard Prisma singleton — on merge, take Dev A's version.
//
//     NEVER import this file from middleware.ts. Middleware runs on Edge and
//     Prisma cannot run there.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
