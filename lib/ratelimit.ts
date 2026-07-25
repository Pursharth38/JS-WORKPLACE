// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  FILE OWNER: DEV A (task P1-06 / rate-limit table in CONTRACTS.md).
//     Transcribed by DEV B with only the limiters Dev B's routes need. On merge,
//     take Dev A's version and add any limiter below that it is missing.
//
//     Limits are the table at the bottom of CONTRACTS.md.
// ─────────────────────────────────────────────────────────────────────────────
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash ? Redis.fromEnv() : null

export type LimitResult = { success: boolean; retryAfterSeconds: number }

const ALLOW: LimitResult = { success: true, retryAfterSeconds: 0 }

type Algorithm = ReturnType<typeof Ratelimit.slidingWindow>

function make(limiter: Algorithm, prefix: string): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({ redis, limiter, prefix, analytics: false })
}

// CONTRACTS.md: /api/auth/* login — 10 / 15min / IP  ·  5 / 15min / email
const loginByIp = make(Ratelimit.slidingWindow(10, '15 m'), 'rl:login:ip')
const loginByEmail = make(Ratelimit.slidingWindow(5, '15 m'), 'rl:login:email')

// Signup and password-reset are cheap to abuse for email bombing.
const signupByIp = make(Ratelimit.slidingWindow(5, '60 m'), 'rl:signup:ip')
const resetByEmail = make(Ratelimit.slidingWindow(3, '60 m'), 'rl:reset:email')

// CONTRACTS.md: /api/checkout/create-order — 10 / hour / user
const checkoutByUser = make(Ratelimit.slidingWindow(10, '60 m'), 'rl:checkout:user')

// Certificate issue is idempotent but still renders a PDF — throttle the render.
const certIssueByUser = make(Ratelimit.slidingWindow(10, '60 m'), 'rl:cert:user')

// Public verification endpoint: block certId enumeration sweeps.
const verifyByIp = make(Ratelimit.slidingWindow(30, '60 m'), 'rl:verify:ip')

async function check(limiter: Ratelimit | null, key: string): Promise<LimitResult> {
  // No Upstash configured (local dev / CI): fail OPEN. Rate limiting is a
  // hardening layer, not an authorization control — every route it fronts also
  // enforces its own auth. Failing closed would make local dev impossible.
  if (!limiter) return ALLOW
  const res = await limiter.limit(key)
  return {
    success: res.success,
    retryAfterSeconds: Math.max(0, Math.ceil((res.reset - Date.now()) / 1000)),
  }
}

export const rateLimit = {
  loginIp: (ip: string) => check(loginByIp, ip),
  loginEmail: (email: string) => check(loginByEmail, email.toLowerCase()),
  signupIp: (ip: string) => check(signupByIp, ip),
  resetEmail: (email: string) => check(resetByEmail, email.toLowerCase()),
  checkoutUser: (userId: string) => check(checkoutByUser, userId),
  certIssueUser: (userId: string) => check(certIssueByUser, userId),
  verifyIp: (ip: string) => check(verifyByIp, ip),
}

/**
 * Best-effort client IP. Vercel populates x-forwarded-for; the leftmost entry is
 * the client. Falls back to a constant so a missing header cannot bypass the
 * limiter by producing a unique key per request.
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip') ?? 'unknown'
}
