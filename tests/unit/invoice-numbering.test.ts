// DEV B — the Indian financial year boundary. Off-by-one here restarts the
// invoice series mid-filing-period, which is the kind of thing a CA notices.
import { describe, expect, it } from 'vitest'

import { financialYearFor, invoiceObjectKey } from '@/lib/invoice'

describe('financialYearFor', () => {
  it('starts a new financial year on 1 April', () => {
    expect(financialYearFor(new Date('2026-04-01T00:00:00+05:30'))).toBe('2026-27')
  })

  it('keeps 31 March in the OUTGOING year', () => {
    expect(financialYearFor(new Date('2026-03-31T23:59:00+05:30'))).toBe('2025-26')
  })

  it('treats January–March as the previous April start', () => {
    expect(financialYearFor(new Date('2027-01-15T12:00:00+05:30'))).toBe('2026-27')
  })

  it('treats April–December as the current April start', () => {
    expect(financialYearFor(new Date('2026-12-31T12:00:00+05:30'))).toBe('2026-27')
  })

  it('rolls the two-digit suffix across a century boundary', () => {
    expect(financialYearFor(new Date('2099-06-01T12:00:00+05:30'))).toBe('2099-00')
  })
})

describe('invoiceObjectKey', () => {
  it('flattens the slashes in an invoice number into a single object key', () => {
    // Slashes would otherwise create nested "directories" per invoice.
    expect(invoiceObjectKey('JSWW/2026-27/0042')).toBe('invoices/JSWW-2026-27-0042.pdf')
  })
})
