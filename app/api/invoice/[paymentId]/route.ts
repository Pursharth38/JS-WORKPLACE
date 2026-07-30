// DEV B — streams a learner's own invoice PDF.
//
// The PDF is served THROUGH this handler rather than by handing out an R2 URL,
// so ownership is re-checked on every download. See lib/r2.ts.
import type { NextRequest } from 'next/server'

import { getInvoicePdf } from '@/lib/invoice'
import { apiError, apiResponse } from '@/lib/response'
import { requireSession } from '@/lib/session'

// @react-pdf/renderer cannot run on Edge.
export const runtime = 'nodejs'

// See the note in app/api/lead-magnet/download/route.ts: @react-pdf/renderer
// cold starts can exceed the 10s Hobby default. 60s is the Hobby ceiling and
// only bills for time actually used.
export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  try {
    const session = await requireSession()
    if (!session) return apiResponse(401, 'Sign in required')

    const { paymentId } = await params
    const result = await getInvoicePdf(paymentId, session.userId)

    if (!result.ok) {
      // `forbidden` and `not_found` collapse to the same 404. Distinguishing
      // them would confirm that a given payment id exists on someone else's
      // account.
      if (result.reason === 'not_paid') {
        return apiResponse(409, 'No invoice is available for an incomplete payment')
      }
      return apiResponse(404, 'Invoice not found')
    }

    return new Response(new Uint8Array(result.pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.invoiceNumber.replace(/\//g, '-')}.pdf"`,
        // Contains personal data — must never be held by a shared cache.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    return apiError('invoice/download', err)
  }
}
