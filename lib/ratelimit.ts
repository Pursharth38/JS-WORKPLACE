// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  FILE OWNER: DEV A (task P1-06 / rate-limit table in CONTRACTS.md).
//     Written by DEV B with only the limiters Dev B's routes need. On merge,
//     take whichever version has both feature sets; the exported API is
//     `rateLimit.*` + `clientIp` and every Dev B route depends on it.
//
//     Limits are the table at the bottom of CONTRACTS.md.
//
// ── STORAGE DECISION (2026-07-25, Dev B) ─────────────────────────────────────
// Default backend is a ZERO-DEPENDENCY IN-MEMORY sliding window, not Upstash.
// Upstash's free tier (10k commands/day) burns fast — every login attempt costs
// commands — and this project's rate limiting is a HARDENING layer, not an
// authorization control: every route it fronts also enforces its own auth,
// price-from-DB, HMAC, and idempotency. Approximate limiting is acceptable.
//
// Trade-off to know about on Vercel/serverless: memory is PER-INSTANCE and
// resets on cold start, so the effective ceiling is (limit × warm instances).
// That still stops the attacks these limits exist for (credential stuffing,
// email bombing, certId sweeps) from any single source. If the project later
// wants exact global limits, set UPSTASH_REDIS_REST_URL/TOKEN and Upstash takes
// over automatically — no code change, the interface is identical.
// ─────────────────────────────────────────────────────────────────────────────

export type LimitResult = { success: boolean; retryAfterSeconds: number }

type Limiter = { limit: (key: string) => Promise<LimitResult> }

// ── In-memory sliding-window limiter (default) ──────────────────────────────

/**
 * True sliding window: stores the timestamps of recent hits per key and counts
 * the ones inside the window. Exact within one process; O(limit) per check.
 */
class MemoryLimiter implements Limiter {
  private hits = new Map<string, number[]>()
  private lastSweep = Date.now()

  constructor(
    private max: number,
    private windowMs: number,
  ) {}

  async limit(key: string): Promise<LimitResult> {
    const now = Date.now()
    const cutoff = now - this.windowMs

    // Periodic sweep so keys that stopped hitting us don't accumulate forever.
    // Amortized: runs at most once per window, scans every key once.
    if (now - this.lastSweep > this.windowMs) {
      this.lastSweep = now
      for (const [k, arr] of this.hits) {
        const alive = arr.filter((t) => t > cutoff)
        if (alive.length === 0) this.hits.delete(k)
        else this.hits.set(k, alive)
      }
    }

    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff)

    if (recent.length >= this.max) {
      // Oldest hit inside the window decides when a slot frees up.
      const oldest = recent[0] ?? now
      this.hits.set(key, recent)
      return {
        success: false,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)),
      }
    }

    recent.push(now)
    this.hits.set(key, recent)
    return { success: true, retryAfterSeconds: 0 }
  }
}

// ── Optional Upstash backend (opt-in via env, lazy-loaded) ──────────────────

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Wraps @upstash/ratelimit behind a dynamic import so the dependency is only
 * loaded — and only billed — when the env vars are actually set.
 */
function upstashLimiter(max: number, windowMs: number, prefix: string): Limiter {
  let instance: { limit: (key: string) => Promise<{ success: boolean; reset: number }> } | null =
    null

  return {
    async limit(key: string): Promise<LimitResult> {
      if (!instance) {
        const [{ Ratelimit }, { Redis }] = await Promise.all([
          import('@upstash/ratelimit'),
          import('@upstash/redis'),
        ])
        instance = new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(max, `${Math.round(windowMs / 1000)} s`),
          prefix,
          analytics: false,
        })
      }
      const res = await instance.limit(key)
      return {
        success: res.success,
        retryAfterSeconds: Math.max(0, Math.ceil((res.reset - Date.now()) / 1000)),
      }
    },
  }
}

// ── Limiter registry ────────────────────────────────────────────────────────

const MIN = 60_000

function make(max: number, windowMs: number, prefix: string): Limiter {
  return hasUpstash ? upstashLimiter(max, windowMs, prefix) : new MemoryLimiter(max, windowMs)
}

// CONTRACTS.md: /api/auth/* login — 10 / 15min / IP  ·  5 / 15min / email
const loginByIp = make(10, 15 * MIN, 'rl:login:ip')
const loginByEmail = make(5, 15 * MIN, 'rl:login:email')

// Signup and password-reset are cheap to abuse for email bombing.
const signupByIp = make(5, 60 * MIN, 'rl:signup:ip')
const resetByEmail = make(3, 60 * MIN, 'rl:reset:email')

// CONTRACTS.md: /api/checkout/create-order — 10 / hour / user
const checkoutByUser = make(10, 60 * MIN, 'rl:checkout:user')

// Certificate issue is idempotent but still renders a PDF — throttle the render.
const certIssueByUser = make(10, 60 * MIN, 'rl:cert:user')

// Public verification endpoint: block certId enumeration sweeps.
const verifyByIp = make(30, 60 * MIN, 'rl:verify:ip')

async function check(limiter: Limiter, key: string): Promise<LimitResult> {
  try {
    return await limiter.limit(key)
  } catch (err) {
    // A broken limiter backend (Upstash outage) must not take login/checkout
    // down with it — fail OPEN and log. The routes' own auth still holds.
    console.error('[ratelimit] backend error — allowing request', err)
    return { success: true, retryAfterSeconds: 0 }
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
