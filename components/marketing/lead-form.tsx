"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/checkbox";
import { Honeypot, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Turnstile } from "@/components/ui/turnstile";
import {
  EMPLOYEE_COUNTS,
  type LEAD_SOURCES,
  SERVICE_INTERESTS,
} from "@/lib/schemas/leads";

type Source = (typeof LEAD_SOURCES)[number];

/**
 * The lead form behind /contact and /book-demo.
 *
 * Uses a plain uncontrolled form + FormData rather than per-field state: fewer
 * re-renders, and the browser's own autofill and validation keep working.
 *
 * The consent checkbox is `ConsentCheckbox`, which cannot be pre-ticked. The
 * server rejects `consentGiven: false` regardless — this is the second line.
 */
export function LeadForm({
  source,
  showOrganizationFields = true,
  submitLabel = "Send enquiry",
}: {
  source: Source;
  showOrganizationFields?: boolean;
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      organization: String(fd.get("organization") ?? ""),
      employeeCount: String(fd.get("employeeCount") ?? ""),
      serviceInterest: String(fd.get("serviceInterest") ?? ""),
      message: String(fd.get("message") ?? ""),
      refCode: String(fd.get("refCode") ?? ""),
      consentGiven: fd.get("consentGiven") === "on",
      turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
      source,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { success: boolean; message: string };

      if (body.success) {
        setStatus("sent");
        setMessage(body.message);
        form.reset();
      } else {
        setStatus("error");
        setMessage(body.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage(
        "We could not reach the server. Please check your connection and try again.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius-lg)] border border-[var(--brand-success)] bg-[var(--brand-success-soft)] p-6"
      >
        <h2 className="font-serif text-[22px] font-semibold text-[var(--brand-success)]">
          Thank you
        </h2>
        <p className="mt-2 text-[16px] leading-relaxed text-[var(--brand-success)]">
          {message}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5">
      <Honeypot />

      <Input id="name" label="Your name" required autoComplete="name" />
      <Input
        id="email"
        label="Work email"
        type="email"
        required
        autoComplete="email"
      />
      <Input id="phone" label="Phone" type="tel" autoComplete="tel" />

      {showOrganizationFields && (
        <>
          <Input
            id="organization"
            label="Organisation"
            autoComplete="organization"
          />
          <Select
            id="employeeCount"
            label="Roughly how many employees?"
            placeholder="Select a range"
            options={EMPLOYEE_COUNTS.map((v) => ({ value: v, label: v }))}
          />
          <Select
            id="serviceInterest"
            label="What are you interested in?"
            placeholder="Select an option"
            options={SERVICE_INTERESTS.map((v) => ({ value: v, label: v }))}
          />
        </>
      )}

      <Textarea
        id="message"
        label="Anything you'd like us to know?"
        rows={4}
      />

      <ConsentCheckbox />

      <Turnstile action={`lead-${source}`} />

      {status === "error" && (
        <p
          role="alert"
          aria-live="polite"
          className="text-[15px] font-medium text-[var(--brand-danger)]"
        >
          {message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "sending"} fullWidth>
        {status === "sending" ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
