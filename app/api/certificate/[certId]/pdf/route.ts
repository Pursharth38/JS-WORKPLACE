// DEV B — downloads a learner's own certificate PDF.
//
// Ownership is required. The PUBLIC surface for a certificate is
// /verify/[certId], which returns the facts an employer needs to check a
// credential. The PDF itself is the learner's document and is served only to
// them (or to an admin).
import type { NextRequest } from 'next/server'

import { normalizeCertId } from '@/lib/cert-id'
import { buildCertificatePdf } from '@/lib/certificate'
import { db } from '@/lib/db'
import { getObject, isR2Configured } from '@/lib/r2'
import { apiError, apiResponse } from '@/lib/response'
import { requireSession } from '@/lib/session'

export const runtime = 'nodejs'

// See the note in app/api/lead-magnet/download/route.ts: @react-pdf/renderer
// cold starts can exceed the 10s Hobby default. 60s is the Hobby ceiling and
// only bills for time actually used.
export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certId: string }> },
) {
  try {
    const session = await requireSession()
    if (!session) return apiResponse(401, 'Sign in required')

    const { certId: rawCertId } = await params
    const certId = normalizeCertId(rawCertId)
    if (!certId) return apiResponse(404, 'Certificate not found')

    const cert = await db.certificate.findUnique({
      where: { certId },
      select: {
        certId: true,
        userId: true,
        courseId: true,
        learnerName: true,
        issuedAt: true,
        pdfUrl: true,
        revokedAt: true,
      },
    })

    // "Not yours" and "does not exist" return the same 404, so this endpoint
    // cannot be used to test whether a certId is real.
    if (!cert) return apiResponse(404, 'Certificate not found')
    if (cert.userId !== session.userId && session.role !== 'ADMIN') {
      return apiResponse(404, 'Certificate not found')
    }
    if (cert.revokedAt) return apiResponse(410, 'This certificate has been revoked')

    let pdf = isR2Configured() && cert.pdfUrl ? await getObject(cert.pdfUrl) : null

    // Regenerate on a cache miss. The PDF is fully determined by the stored row
    // — the name is a snapshot, the id and date are fixed — so re-rendering
    // produces the same document. A failed upload at issue time is therefore
    // invisible to the learner rather than a permanently broken download.
    if (!pdf) {
      const course = await db.course.findUnique({
        where: { id: cert.courseId },
        select: { title: true },
      })
      pdf = await buildCertificatePdf({
        certId: cert.certId,
        learnerName: cert.learnerName,
        courseTitle: course?.title ?? 'POSH Awareness Training',
        issuedAt: cert.issuedAt,
      })
    }

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cert.certId}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    return apiError('certificate/pdf', err)
  }
}
