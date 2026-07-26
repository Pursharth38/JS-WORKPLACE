"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/checkbox";
import { Honeypot, Input } from "@/components/ui/input";
import { Turnstile } from "@/components/ui/turnstile";
import {
  type Answer,
  type Answers,
  QUESTIONS,
  scoreAnswers,
} from "@/lib/compliance-check";
import { cn } from "@/lib/cn";

const OPTIONS: Array<{ value: Answer; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

/**
 * The 8-question self-check (E3).
 *
 * The result is shown IMMEDIATELY on screen, before the email step. Gating the
 * score behind an email address is the standard pattern and it is the wrong one
 * here: the value we are trading on is being straight with people, and holding
 * their own answers hostage undercuts that on the highest-intent page on the
 * site. The email captures the lead by offering something extra — the written
 * report — rather than by withholding what they already earned.
 */
export function ComplianceCheck() {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [emailState, setEmailState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [emailMessage, setEmailMessage] = useState("");

  const answeredCount = QUESTIONS.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const result = submitted ? scoreAnswers(answers) : null;

  function setAnswer(id: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function onEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailState("sending");

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          organization: String(fd.get("organization") ?? ""),
          website: String(fd.get("website") ?? ""),
          consentGiven: fd.get("consentGiven") === "on",
          turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
          answers,
        }),
      });
      const body = (await res.json()) as { success: boolean; message: string };
      setEmailState(body.success ? "sent" : "error");
      setEmailMessage(body.message);
    } catch {
      setEmailState("error");
      setEmailMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mt-10">
      {!submitted && (
        <>
          <ol className="space-y-8">
            {QUESTIONS.map((q, i) => (
              <li key={q.id}>
                <fieldset>
                  <legend className="text-[19px] font-semibold leading-snug">
                    <span
                      aria-hidden="true"
                      className="mr-2 text-[var(--brand-muted)]"
                    >
                      {i + 1}.
                    </span>
                    {q.text}
                  </legend>
                  {q.help && (
                    <p className="mt-1.5 pl-6 text-[15px] text-[var(--brand-muted)]">
                      {q.help}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 pl-6">
                    {OPTIONS.map((o) => {
                      const selected = answers[q.id] === o.value;
                      return (
                        <label
                          key={o.value}
                          className={cn(
                            "cursor-pointer rounded-[var(--radius-md)] border px-4 py-2 text-[16px] font-medium transition-colors",
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                              : "border-[var(--brand-line)] bg-[var(--brand-elevated)] text-[var(--brand-ink)] hover:border-[var(--brand-primary)]",
                          )}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={o.value}
                            checked={selected}
                            onChange={() => setAnswer(q.id, o.value)}
                            className="sr-only"
                          />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>

          <div className="mt-10 border-t border-[var(--brand-line)] pt-6">
            <p aria-live="polite" className="text-[15px] text-[var(--brand-muted)]">
              {answeredCount} of {QUESTIONS.length} answered
            </p>
            <Button
              size="lg"
              className="mt-3"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
            >
              See my result
            </Button>
            {!allAnswered && (
              <p className="mt-2 text-[15px] text-[var(--brand-muted)]">
                Answer all eight to see where you stand.
              </p>
            )}
          </div>
        </>
      )}

      {result && (
        <div aria-live="polite">
          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:p-8">
            <p className="text-[15px] font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
              Your result
            </p>
            <p
              data-numeric
              className="mt-2 font-serif text-[49px] font-semibold leading-none text-[var(--brand-primary)]"
            >
              {result.scorePercent}%
            </p>
            <p className="mt-2 font-serif text-[25px] font-semibold">
              {result.bandLabel}
            </p>
            <p className="mt-3 max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]">
              {result.bandMessage}
            </p>

            {result.gaps.length > 0 && (
              <>
                <h2 className="mt-8 font-serif text-[20px] font-semibold">
                  What to look at first
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {result.gaps.map((gap) => (
                    <li key={gap} className="flex gap-3 text-[17px] leading-[1.6]">
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-[var(--brand-warning)]"
                      >
                        →
                      </span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-8 rounded-[var(--radius-md)] bg-[var(--brand-surface)] p-4 text-[15px] leading-[1.6] text-[var(--brand-muted)]">
              This is an awareness tool based on eight questions. It is not a
              legal audit and it is not advice about your specific situation.
            </p>
          </div>

          {emailState === "sent" ? (
            <div
              role="status"
              className="mt-6 rounded-[var(--radius-lg)] border border-[var(--brand-success)] bg-[var(--brand-success-soft)] p-6"
            >
              <p className="text-[17px] font-semibold text-[var(--brand-success)]">
                {emailMessage}
              </p>
            </div>
          ) : (
            <form
              onSubmit={onEmailSubmit}
              noValidate
              className="relative mt-6 rounded-[var(--radius-lg)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] p-6 md:p-8"
            >
              <h2 className="font-serif text-[25px] font-semibold">
                Want this as a written report?
              </h2>
              <p className="mt-2 max-w-[52ch] text-[17px] leading-[1.6] text-[var(--brand-muted)]">
                We&rsquo;ll email you the result above with the gaps written out,
                so you can forward it to whoever needs to see it.
              </p>

              <div className="mt-6 max-w-md space-y-5">
                <Honeypot />
                <Input id="name" label="Your name" required autoComplete="name" />
                <Input
                  id="email"
                  label="Work email"
                  type="email"
                  required
                  autoComplete="email"
                />
                <Input
                  id="organization"
                  label="Organisation"
                  autoComplete="organization"
                />
                <ConsentCheckbox />
                <Turnstile action="compliance-check" />

                {emailState === "error" && (
                  <p role="alert" className="text-[15px] text-[var(--brand-danger)]">
                    {emailMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={emailState === "sending"}
                >
                  {emailState === "sending" ? "Sending…" : "Email me the report"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
