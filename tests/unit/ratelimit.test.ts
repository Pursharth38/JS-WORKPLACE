// DEV B — the in-memory sliding-window limiter (default backend, no Upstash).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// No UPSTASH_* env in tests → the module builds MemoryLimiter instances.
const { rateLimit } = await import('@/lib/ratelimit')

describe('in-memory rate limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-25T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to the limit, then refuses with a retry hint', async () => {
    // resetEmail is 3 / 60 min. Distinct key so tests don't interfere.
    const key = 'limit-test-1@example.com'

    expect((await rateLimit.resetEmail(key)).success).toBe(true)
    expect((await rateLimit.resetEmail(key)).success).toBe(true)
    expect((await rateLimit.resetEmail(key)).success).toBe(true)

    const fourth = await rateLimit.resetEmail(key)
    expect(fourth.success).toBe(false)
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0)
    expect(fourth.retryAfterSeconds).toBeLessThanOrEqual(60 * 60)
  })

  it('frees slots as the window slides, not all at once', async () => {
    const key = 'limit-test-2@example.com'

    await rateLimit.resetEmail(key) // t=0
    vi.advanceTimersByTime(30 * 60_000)
    await rateLimit.resetEmail(key) // t=30m
    await rateLimit.resetEmail(key) // t=30m
    expect((await rateLimit.resetEmail(key)).success).toBe(false)

    // At t=61m the t=0 hit has left the window; exactly one slot frees.
    vi.advanceTimersByTime(31 * 60_000)
    expect((await rateLimit.resetEmail(key)).success).toBe(true)
    expect((await rateLimit.resetEmail(key)).success).toBe(false)
  })

  it('keys are independent — one abuser does not lock out everyone', async () => {
    const abuser = 'abuser@example.com'
    for (let i = 0; i < 5; i += 1) await rateLimit.resetEmail(abuser)
    expect((await rateLimit.resetEmail(abuser)).success).toBe(false)

    expect((await rateLimit.resetEmail('innocent@example.com')).success).toBe(true)
  })

  it('is case-insensitive on email keys', async () => {
    const key = 'CaseTest@Example.com'
    await rateLimit.resetEmail(key.toLowerCase())
    await rateLimit.resetEmail(key.toUpperCase())
    await rateLimit.resetEmail(key)
    expect((await rateLimit.resetEmail(key)).success).toBe(false)
  })
})
