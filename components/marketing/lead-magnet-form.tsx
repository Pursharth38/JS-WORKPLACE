"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/checkbox";
import { Honeypot, Input } from "@/components/ui/input";
import { Turnstile } from "@/components/ui/turnstile";

/**
 * Requests the gated checklist (E2).
 *
 * Deliberately NOT a timed pop-up. The reference competitor runs one; an
 * interstitial that interrupts someone mid-sentence on the Knowledge Hub would
 * undercut the one thing that page is trying to build, which is the sense that
 * this is a useful resource rather than a funnel. It sits inline instead, where
 * someone who wants it will look for it.
 */
export function LeadMagnetForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          organization: String(fd.get("organization") ?? ""),
          refCode: String(fd.get("refCode") ?? ""),
          consentGiven: fd.get("consentGiven") === "on",
          turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
          source: "checklist",
        }),
      });
      const body = (await res.json()) as { success: boolean; message: string };

      setStatus(body.success ? "sent" : "error");
      setMessage(body.message);
      if (body.success) form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius-md)] border border-[var(--brand-success)] bg-[var(--brand-success-soft)] p-5"
      >
        <p className="text-[17px] font-semibold text-[var(--brand-success)]">{message}</p>
        <p className="mt-1 text-[15px] text-[var(--brand-success)]">
          If it does not arrive in a few minutes, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot />
      <Input id="lm-name" name="name" label="Your name" required autoComplete="name" />
      <Input
        id="lm-email"
        name="email"
        label="Work email"
        type="email"
        required
        autoComplete="email"
      />
      {!compact && (
        <Input
          id="lm-organization"
          name="organization"
          label="Organisation"
          autoComplete="organization"
        />
      )}
      <ConsentCheckbox />
      <Turnstile action="lead-magnet" />

      {status === "error" && (
        <p role="alert" className="text-[15px] text-[var(--brand-danger)]">
          {message}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Email me the checklist"}
      </Button>
    </form>
  );
}
