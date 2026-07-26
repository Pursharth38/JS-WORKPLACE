"use client";

// DEV B — certificate revocation form on /admin.
import { useActionState } from "react";

import {
  revokeCertificateAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { FormAlert, SubmitButton } from "@/components/auth/form-fields";

const initial: AdminActionState = { status: "idle" };

export function RevokeForm() {
  const [state, formAction] = useActionState(revokeCertificateAction, initial);

  return (
    <form action={formAction} className="max-w-md">
      <FormAlert state={state} />

      <label
        htmlFor="revoke-certId"
        className="mb-1.5 block text-[15px] font-medium"
      >
        Certificate ID
      </label>
      <input
        id="revoke-certId"
        name="certId"
        required
        placeholder="JSWW-2026-A7K2P9"
        className="mb-4 w-full rounded-md border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-3 py-2.5 font-mono text-[15px] outline-none focus:border-[var(--brand-primary)]"
      />

      <label
        htmlFor="revoke-reason"
        className="mb-1.5 block text-[15px] font-medium"
      >
        Reason{" "}
        <span className="font-normal text-[var(--brand-muted)]">
          (kept on record)
        </span>
      </label>
      <textarea
        id="revoke-reason"
        name="reason"
        required
        rows={2}
        minLength={3}
        maxLength={500}
        placeholder="e.g. Issued against a payment that was later charged back"
        className="mb-4 w-full rounded-md border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-3 py-2.5 text-[15px] outline-none focus:border-[var(--brand-primary)]"
      />

      <p className="mb-4 text-[14px] leading-relaxed text-[var(--brand-muted)]">
        Revocation cannot be undone from here. The public verification page will
        show the certificate as withdrawn, and a replacement can be issued if
        the learner is still eligible.
      </p>

      <SubmitButton>Revoke certificate</SubmitButton>
    </form>
  );
}
