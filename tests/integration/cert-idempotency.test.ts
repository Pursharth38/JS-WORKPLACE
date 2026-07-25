// ─────────────────────────────────────────────────────────────────────────────
// DEV B — cert-idempotency (listed in codebase.md as a Dev B deliverable).
//
// ARCHITECTURE.md §13 mandatory adversarial test: "Double-submit
// /certificate/issue → must return the same certId". These tests exercise
// lib/certificate.ts against an in-memory Prisma fake that ENFORCES the partial
// unique index — because the route-level read alone is not what guarantees
// idempotency, the index is.
// ─────────────────────────────────────────────────────────────────────────────
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── In-memory Prisma fake with the partial unique index enforced ────────────

type CertRow = {
  id: string
  certId: string
  userId: string
  courseId: string
  learnerName: string
  issuedAt: Date
  pdfUrl: string
  revokedAt: Date | null
}

const store = {
  certificates: [] as CertRow[],
  users: new Map<string, { name: string; nameLocked: boolean }>(),
  enrollments: [] as { userId: string; courseId: string }[],
  attempts: [] as { userId: string; courseId: string; chapterId: string | null; passed: boolean }[],
  courses: new Map<string, { title: string }>(),
}

let idSeq = 0

class FakeP2002 extends Error {
  code = 'P2002'
}

const certModel = {
  findFirst: async ({ where }: { where: { userId: string; courseId: string; revokedAt: null } }) =>
    store.certificates.find(
      (c) =>
        c.userId === where.userId && c.courseId === where.courseId && c.revokedAt === null,
    ) ?? null,
  findUnique: async ({ where }: { where: { certId: string } }) =>
    store.certificates.find((c) => c.certId === where.certId) ?? null,
  create: async ({ data }: { data: Omit<CertRow, 'id' | 'revokedAt'> }) => {
    // ★ cert_active_unique: (userId, courseId) WHERE revokedAt IS NULL
    const clash = store.certificates.some(
      (c) => c.userId === data.userId && c.courseId === data.courseId && c.revokedAt === null,
    )
    if (clash) throw new FakeP2002('Unique constraint failed')
    if (store.certificates.some((c) => c.certId === data.certId)) {
      throw new FakeP2002('Unique constraint failed on certId')
    }
    const row: CertRow = { id: `cert_${idSeq++}`, revokedAt: null, ...data }
    store.certificates.push(row)
    return row
  },
}

const fakeDb = {
  certificate: certModel,
  user: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const u = store.users.get(where.id)
      return u ? { name: u.name } : null
    },
    update: async ({ where, data }: { where: { id: string }; data: { nameLocked: boolean } }) => {
      const u = store.users.get(where.id)
      if (u) u.nameLocked = data.nameLocked
      return u
    },
  },
  enrollment: {
    findUnique: async ({
      where,
    }: {
      where: { userId_courseId: { userId: string; courseId: string } }
    }) =>
      store.enrollments.find(
        (e) =>
          e.userId === where.userId_courseId.userId &&
          e.courseId === where.userId_courseId.courseId,
      )
        ? { id: 'enr_1' }
        : null,
  },
  assessmentAttempt: {
    findFirst: async ({
      where,
    }: {
      where: { userId: string; courseId: string; chapterId: null; passed: true }
    }) =>
      store.attempts.find(
        (a) =>
          a.userId === where.userId &&
          a.courseId === where.courseId &&
          a.chapterId === null &&
          a.passed,
      )
        ? { id: 'att_1' }
        : null,
  },
  course: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const c = store.courses.get(where.id)
      return c ? { title: c.title } : null
    },
  },
}

async function fakeTransaction(fn: (tx: typeof fakeDb) => Promise<unknown>): Promise<unknown> {
  return fn(fakeDb)
}

vi.mock('@/lib/db', () => ({ db: { ...fakeDb, $transaction: fakeTransaction } }))
// R2 unconfigured in tests → issuance skips the upload path entirely.
vi.mock('@/lib/r2', () => ({
  isR2Configured: () => false,
  putObject: vi.fn(),
  getObject: vi.fn(),
}))

const { issueCertificate, hasPassedFinalTest } = await import('@/lib/certificate')

// ── Helpers ─────────────────────────────────────────────────────────────────

function seedEligibleLearner(userId = 'usr_1', courseId = 'crs_1') {
  store.users.set(userId, { name: 'Asha Iyer', nameLocked: false })
  store.courses.set(courseId, { title: 'POSH Awareness Training' })
  store.enrollments.push({ userId, courseId })
  store.attempts.push({ userId, courseId, chapterId: null, passed: true })
}

describe('issueCertificate', () => {
  beforeEach(() => {
    store.certificates = []
    store.users = new Map()
    store.enrollments = []
    store.attempts = []
    store.courses = new Map()
    idSeq = 0
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('issues a certificate to an eligible learner and locks the name', async () => {
    seedEligibleLearner()

    const result = await issueCertificate('usr_1', 'crs_1')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.certId).toMatch(/^JSWW-\d{4}-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{6}$/)
    expect(result.alreadyIssued).toBe(false)
    expect(store.users.get('usr_1')?.nameLocked).toBe(true)
    // Name is snapshotted at issue time.
    expect(store.certificates[0]?.learnerName).toBe('Asha Iyer')
  })

  it('★ DOUBLE-SUBMIT returns the SAME certId and mints no second row', async () => {
    seedEligibleLearner()

    const first = await issueCertificate('usr_1', 'crs_1')
    const second = await issueCertificate('usr_1', 'crs_1')
    const third = await issueCertificate('usr_1', 'crs_1')

    expect(first.ok && second.ok && third.ok).toBe(true)
    if (!first.ok || !second.ok || !third.ok) return

    expect(second.certId).toBe(first.certId)
    expect(third.certId).toBe(first.certId)
    expect(second.alreadyIssued).toBe(true)
    expect(store.certificates).toHaveLength(1)
  })

  it('★ CONCURRENT RACE: both requests resolve to one certId via the unique index', async () => {
    seedEligibleLearner()

    // Fire both before either has written — both pass the fast-path read, and
    // the loser must recover from P2002 by returning the winner's id.
    const [a, b] = await Promise.all([
      issueCertificate('usr_1', 'crs_1'),
      issueCertificate('usr_1', 'crs_1'),
    ])

    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(a.certId).toBe(b.certId)
    expect(store.certificates).toHaveLength(1)
  })

  it('refuses a learner who has not passed the final test', async () => {
    seedEligibleLearner()
    store.attempts = [] // no passing final attempt

    const result = await issueCertificate('usr_1', 'crs_1')

    expect(result).toEqual({ ok: false, reason: 'not_passed' })
    expect(store.certificates).toHaveLength(0)
    expect(store.users.get('usr_1')?.nameLocked).toBe(false)
  })

  it('a passing CHAPTER attempt does not count as the final test', async () => {
    // H5 contract: final test is chapterId IS NULL. A chapter pass must not
    // mint a certificate.
    seedEligibleLearner()
    store.attempts = [{ userId: 'usr_1', courseId: 'crs_1', chapterId: 'ch_1', passed: true }]

    const result = await issueCertificate('usr_1', 'crs_1')

    expect(result).toEqual({ ok: false, reason: 'not_passed' })
  })

  it('refuses a learner who is not enrolled', async () => {
    seedEligibleLearner()
    store.enrollments = []

    const result = await issueCertificate('usr_1', 'crs_1')

    expect(result).toEqual({ ok: false, reason: 'not_enrolled' })
  })

  it('allows re-issuance after the active certificate is revoked', async () => {
    // cert_active_unique is scoped to revokedAt IS NULL precisely so an admin
    // revocation can be followed by a corrected replacement.
    seedEligibleLearner()

    const first = await issueCertificate('usr_1', 'crs_1')
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const row = store.certificates.find((c) => c.certId === first.certId)
    row!.revokedAt = new Date()

    const second = await issueCertificate('usr_1', 'crs_1')
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.certId).not.toBe(first.certId)
    expect(second.alreadyIssued).toBe(false)
    expect(store.certificates).toHaveLength(2)
  })
})

describe('hasPassedFinalTest', () => {
  beforeEach(() => {
    store.attempts = []
  })

  it('is true only for a passing attempt with chapterId null on the right course', async () => {
    store.attempts.push({ userId: 'u', courseId: 'c', chapterId: null, passed: true })
    expect(await hasPassedFinalTest('u', 'c')).toBe(true)
    expect(await hasPassedFinalTest('u', 'other')).toBe(false)
    expect(await hasPassedFinalTest('other', 'c')).toBe(false)
  })

  it('is false when the only attempts failed', async () => {
    store.attempts.push({ userId: 'u', courseId: 'c', chapterId: null, passed: false })
    expect(await hasPassedFinalTest('u', 'c')).toBe(false)
  })
})
