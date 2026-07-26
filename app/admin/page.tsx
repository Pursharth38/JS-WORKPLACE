// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P10-06. Admin dashboard: enrolments, payments, learner progress,
// certificate revocation, lead export.
//
// Server-rendered, role-guarded HERE via requireAdmin() (database read), not
// just in middleware (JWT read, up to 30 days stale).
// ─────────────────────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RevokeForm } from "@/components/admin/revoke-form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

function inr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

function d(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const [
    learnerCount,
    enrollmentCount,
    paidAgg,
    leadCount,
    recentEnrollments,
    recentPayments,
    recentCertificates,
  ] = await Promise.all([
    db.user.count({ where: { role: "LEARNER" } }),
    db.enrollment.count(),
    db.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountInPaise: true },
      _count: true,
    }),
    db.lead.count(),
    db.enrollment.findMany({
      take: PAGE_SIZE,
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        enrolledAt: true,
        user: { select: { id: true, name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    db.payment.findMany({
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountInPaise: true,
        status: true,
        createdAt: true,
        razorpayPaymentId: true,
        user: { select: { name: true, email: true } },
      },
    }),
    db.certificate.findMany({
      take: PAGE_SIZE,
      orderBy: { issuedAt: "desc" },
      select: {
        certId: true,
        learnerName: true,
        issuedAt: true,
        revokedAt: true,
      },
    }),
  ]);

  // Header + nav live in app/admin/layout.tsx since M1e.
  return (
    <div>
      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="stats-h">
        <h1 id="stats-h" className="sr-only">
          Overview
        </h1>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Learners" value={String(learnerCount)} />
          <Stat label="Enrolments" value={String(enrollmentCount)} />
          <Stat
            label="Revenue (paid)"
            value={inr(paidAgg._sum.amountInPaise ?? 0)}
            hint={`${paidAgg._count} payments`}
          />
          <Stat label="Leads" value={String(leadCount)} />
        </dl>
      </section>

      {/* ── Enrolments ────────────────────────────────────────────────── */}
      <AdminSection title="Recent enrolments">
        <Table
          head={["Date", "Learner", "Email", "Course"]}
          rows={recentEnrollments.map((e) => [
            d(e.enrolledAt),
            e.user.name,
            e.user.email,
            e.course.title,
          ])}
          empty="No enrolments yet."
        />
      </AdminSection>

      {/* ── Payments ──────────────────────────────────────────────────── */}
      <AdminSection title="Recent payments">
        <Table
          head={["Date", "Learner", "Amount", "Status", "Razorpay ref"]}
          rows={recentPayments.map((p) => [
            d(p.createdAt),
            `${p.user.name} · ${p.user.email}`,
            inr(p.amountInPaise),
            p.status,
            p.razorpayPaymentId ?? "—",
          ])}
          empty="No payments yet."
        />
        <p className="mt-3 text-[14px] text-[var(--brand-muted)]">
          REFUNDED payments do <strong>not</strong> auto-revoke access — review
          them here and revoke the enrolment/certificate manually if warranted.
        </p>
      </AdminSection>

      {/* ── Certificates ──────────────────────────────────────────────── */}
      <AdminSection title="Recent certificates">
        <Table
          head={["Issued", "Certificate ID", "Learner", "Status"]}
          rows={recentCertificates.map((c) => [
            d(c.issuedAt),
            c.certId,
            c.learnerName,
            c.revokedAt ? "REVOKED" : "Active",
          ])}
          empty="No certificates issued yet."
        />
      </AdminSection>

      {/* ── Revocation ────────────────────────────────────────────────── */}
      <AdminSection title="Revoke a certificate">
        <RevokeForm />
      </AdminSection>

      {/* ── Leads ─────────────────────────────────────────────────────── */}
      <AdminSection title="Leads">
        <p className="mb-4 text-[15px] leading-relaxed text-[var(--brand-muted)]">
          Export every lead captured by the demo, checklist, compliance-check
          and newsletter forms, with consent timestamps, as a spreadsheet.
        </p>
        <a
          href="/api/admin/leads.csv"
          className="inline-block rounded-md bg-[var(--brand-primary)] px-5 py-2.5 text-[16px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          Download leads.csv
        </a>
      </AdminSection>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-5">
      <dt className="text-[13px] uppercase tracking-wide text-[var(--brand-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-[26px] font-semibold text-[var(--brand-primary)]">
        {value}
      </dd>
      {hint && <p className="text-[13px] text-[var(--brand-muted)]">{hint}</p>}
    </div>
  );
}

function AdminSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-[22px]">{title}</h2>
      {children}
    </section>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 text-[15px] text-[var(--brand-muted)]">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
      <table className="w-full min-w-[640px] border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-[var(--brand-line)] bg-[var(--brand-surface)] text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr
              key={i}
              className="border-b border-[var(--brand-line)] last:border-0"
            >
              {cells.map((c, j) => (
                <td key={j} className="px-4 py-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
