// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-01. Issues a Certificate of Completion.
//
// IDEMPOTENT: a double-submit returns the SAME certId. See lib/certificate.ts
// for how that is enforced (fast-path read + partial unique index).
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from 'next/server'

import { issueCertificate } from '@/lib/certificate'
import { rateLimit } from '@/lib/ratelimit'
import { apiError, apiResponse, invalidInput } from '@/lib/response'
import { issueSchema } from '@/lib/schemas/certificate'
import { requireSession } from '@/lib/session'

// @react-pdf/renderer cannot run on Edge. Without this the route fails at
// runtime, not at build time.
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if (!session) return apiResponse(401, 'Sign in required')

    const limit = await rateLimit.certIssueUser(session.userId)
    if (!limit.success) {
      return apiResponse(429, 'Too many requests. Please wait a moment.', null, {
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return invalidInput()
    }

    const parsed = issueSchema.safeParse(body)
    if (!parsed.success) return invalidInput()

    const result = await issueCertificate(session.userId, parsed.data.courseId)

    if (!result.ok) {
      switch (result.reason) {
        case 'not_enrolled':
          return apiResponse(403, 'You are not enrolled in this course')
        case 'not_passed':
          // Eligibility is read from AssessmentAttempt (the H5 contract). This
          // route never re-scores anything.
          return apiResponse(403, 'Final test not passed')
        case 'course_missing':
          return apiResponse(404, 'Course not found')
        case 'id_exhausted':
          return apiResponse(503, 'Could not issue a certificate right now. Please try again.')
      }
    }

    return apiResponse(200, result.alreadyIssued ? 'Already issued' : 'Certificate issued', {
      certId: result.certId,
    })
  } catch (err) {
    return apiError('certificate/issue', err)
  }
}
