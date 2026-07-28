"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/checkbox";
import { Honeypot, Input } from "@/components/ui/input";

/**
 * Newsletter capture (E6). Same `/api/leads` endpoint with `source:
 * "newsletter"`, so there is one lead table, one rate limit and one consent
 * record rather than a parallel pipeline.
 */
export function NewsletterForm() {
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
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          refCode: String(fd.get("refCode") ?? ""),
          consentGiven: fd.get("consentGiven") === "on",
          source: "newsletter",
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
      <p role="status" aria-live="polite" className="text-[16px] font-medium">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot />
      <Input id="newsletter-name" name="name" label="Your name" required />
      <Input
        id="newsletter-email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
      />
      <ConsentCheckbox id="consentGiven" />

      {status === "error" && (
        <p role="alert" className="text-[15px] text-[var(--brand-danger)]">
          {message}
        </p>
      )}

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Subscribing…" : "Subscribe"}
      </Button>
    </form>
  );
}
