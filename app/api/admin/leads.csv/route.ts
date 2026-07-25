// DEV B — P10-06. GET /api/admin/leads.csv — CSV export, ADMIN only.
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/response'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'

/**
 * Excel-safe CSV escaping.
 *
 * Quotes and doubles internal quotes per RFC 4180, and — critically — prefixes
 * a `'` onto any value starting with = + - or @. A lead whose "message" field
 * is `=HYPERLINK(...)` would otherwise execute as a formula the moment the
 * client opens the export in Excel. Lead fields are attacker-controlled input
 * from a public form; this export is exactly where CSV injection bites.
 */
function csvCell(value: string | boolean | Date | null): string {
  if (value === null) return ''
  let s = value instanceof Date ? value.toISOString() : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return apiResponse(403, 'Forbidden')

    const leads = await db.lead.findMany({ orderBy: { createdAt: 'desc' } })

    const header = [
      'createdAt',
      'name',
      'email',
      'phone',
      'organization',
      'employeeCount',
      'serviceInterest',
      'source',
      'consentGiven',
      'message',
    ].join(',')

    const rows = leads.map((l) =>
      [
        csvCell(l.createdAt),
        csvCell(l.name),
        csvCell(l.email),
        csvCell(l.phone),
        csvCell(l.organization),
        csvCell(l.employeeCount),
        csvCell(l.serviceInterest),
        csvCell(l.source),
        csvCell(l.consentGiven),
        csvCell(l.message),
      ].join(','),
    )

    // BOM so Excel detects UTF-8 — without it, Devanagari names render mojibake.
    const csv = '﻿' + [header, ...rows].join('\r\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    return apiError('admin/leads-csv', err)
  }
}
