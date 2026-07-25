// DEV B — P7-07. Payment history and invoice downloads.
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Invoices' }
export const dynamic = 'force-dynamic'

const STATUS_COPY: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Not completed', color: 'var(--brand-muted)' },
  PAID: { label: 'Paid', color: 'var(--brand-success)' },
  FAILED: { label: 'Failed', color: 'var(--brand-danger)' },
  REFUNDED: { label: 'Refunded', color: 'var(--brand-accent)' },
}

export default async function InvoicesPage() {
  const session = await getSession()
  if (!session) redirect('/login?redirectTo=/dashboard/invoices')

  // Scoped to the caller's own userId. There is no route parameter here that
  // could be swapped for someone else's id.
  const payments = await db.payment.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      courseId: true,
      amountInPaise: true,
      status: true,
      createdAt: true,
      invoiceNumber: true,
      razorpayPaymentId: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const courseIds = [...new Set(payments.map((p) => p.courseId))]
  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  })
  const titleById = new Map(courses.map((c) => [c.id, c.title]))

  return (
    <div>
      <h1 className="mb-1 text-[30px]">Invoices</h1>
      <p className="mb-8 text-[16px] text-[var(--brand-muted)]">
        Every payment on your account. Invoices are generated on first download.
      </p>

      {payments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--brand-line)] bg-white p-10 text-center">
          <p className="text-[17px] text-[var(--brand-muted)]">
            You have not made any payments yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--brand-line)] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <caption className="sr-only">Your payment history</caption>
            <thead>
              <tr className="border-b border-[var(--brand-line)] bg-[var(--brand-surface)] text-left">
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3 font-semibold">Course</th>
                <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const status = STATUS_COPY[p.status] ?? {
                  label: p.status,
                  color: 'var(--brand-muted)',
                }
                const downloadable = p.status === 'PAID' || p.status === 'REFUNDED'

                return (
                  <tr key={p.id} className="border-b border-[var(--brand-line)] last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.createdAt.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">{titleById.get(p.courseId) ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatInr(p.amountInPaise)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: status.color }}>
                      {status.label}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {downloadable ? (
                        <a
                          href={`/api/invoice/${p.id}`}
                          className="font-medium text-[var(--brand-primary)] underline"
                        >
                          {p.invoiceNumber ?? 'Download PDF'}
                        </a>
                      ) : (
                        <span className="text-[var(--brand-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[14px] leading-relaxed text-[var(--brand-muted)]">
        Refunds are governed by our{' '}
        <a href="/refund-policy" className="underline">
          refund policy
        </a>
        . If a payment left your account but is not listed here, contact us with the
        payment reference from your bank statement.
      </p>
    </div>
  )
}

function formatInr(amountInPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amountInPaise / 100)
}
