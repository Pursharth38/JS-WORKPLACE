"use client";

// Drop-in superset of ImageField: adds a "Generate with AI" mode alongside
// the plain file upload. Either mode ends up setting the same hidden `key`
// input, so nothing downstream (the Server Action, the Prisma column) knows
// or cares whether an image was uploaded or generated.
//
// The auto-prompt is built from sibling form field values, not a second AI
// call — reading a form's own title/summary and templating them into a
// prompt is a few lines of string-joining, not something worth a network
// round-trip and a cost-per-click for. The Edit button exists because a
// templated prompt is a starting point, not a final answer.
import { Pencil } from "lucide-react";
import { useRef, useState } from "react";

type SourceField = { name: string; label: string };

const STYLE_SUFFIX =
  "Style: minimal, professional editorial illustration. Warm bronze and cream " +
  "colour palette (deep bronze, warm gold, cream — no pink, no purple, no neon). " +
  "Clean and modern, no readable text or logos in the image, no photorealistic " +
  "faces. Suitable as a website header/cover image.";

function readSourceFields(
  form: HTMLFormElement,
  fields: SourceField[],
): string {
  const parts: string[] = [];
  for (const { name, label } of fields) {
    const el = form.elements.namedItem(name);
    const value =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el.value.trim()
        : "";
    if (value) parts.push(`${label}: ${value}`);
  }
  return parts.join(". ");
}

export function AiImageField({
  label,
  name,
  defaultKey,
  required,
  hint,
  contentType,
  sourceFields,
}: {
  label: string;
  name: string;
  defaultKey?: string | null;
  required?: boolean;
  hint?: string;
  /** e.g. "blog post", "service", "course" — used inside the auto-built prompt. */
  contentType: string;
  /** Sibling plain-text fields (title, summary, excerpt…) to fold into the auto-prompt. */
  sourceFields: SourceField[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"upload" | "ai">("upload");
  const [key, setKey] = useState(defaultKey ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);

  function buildPrompt() {
    const form = rootRef.current?.closest("form");
    const context = form ? readSourceFields(form, sourceFields) : "";
    const subject = context
      ? `A cover image for this ${contentType} — ${context}.`
      : `A cover image for a ${contentType}.`;
    setPrompt(`${subject} ${STYLE_SUFFIX}`);
  }

  function switchToAiMode() {
    setMode("ai");
    setError(null);
    if (!prompt) buildPrompt();
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const payload: {
        success: boolean;
        message: string;
        data: { key: string } | null;
      } = await res.json();
      if (payload.success && payload.data) {
        setKey(payload.data.key);
      } else {
        setError(payload.message || "Upload failed. Please try again.");
      }
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  async function generate() {
    if (!prompt.trim()) {
      setError("Write or generate a prompt first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload: {
        success: boolean;
        message: string;
        data: { key: string } | null;
      } = await res.json();
      if (payload.success && payload.data) {
        setKey(payload.data.key);
      } else {
        setError(
          payload.message || "Image generation failed. Please try again.",
        );
      }
    } catch {
      setError(
        "Image generation failed — check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4" ref={rootRef}>
      <p className="mb-1.5 text-[14px] font-medium">
        {label}
        {!required && (
          <span className="ml-1.5 font-normal text-[var(--brand-muted)]">
            optional
          </span>
        )}
      </p>

      <input type="hidden" name={name} value={key} />

      <div className="mb-3 inline-flex rounded-[var(--radius-sm)] border border-[var(--brand-line)] p-0.5 text-[13px]">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-[3px] px-3 py-1.5 font-medium transition-colors ${
            mode === "upload"
              ? "bg-[var(--brand-primary)] text-white"
              : "text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={switchToAiMode}
          className={`rounded-[3px] px-3 py-1.5 font-medium transition-colors ${
            mode === "ai"
              ? "bg-[var(--brand-primary)] text-white"
              : "text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
          }`}
        >
          Generate with AI
        </button>
      </div>

      {mode === "ai" && (
        <div className="mb-3 rounded-[var(--radius-sm)] border border-[var(--brand-line)] bg-[var(--brand-surface)] p-3">
          {editingPrompt ? (
            <>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-2.5 py-2 text-[13px] text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
              />
              <button
                type="button"
                onClick={() => setEditingPrompt(false)}
                className="mt-1.5 text-[13px] font-medium text-[var(--brand-primary)] hover:underline"
              >
                Done editing
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-[var(--brand-muted)]">
                {prompt}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPrompt(true)}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--brand-primary)] hover:underline"
                >
                  <Pencil size={12} strokeWidth={2} />
                  Edit prompt
                </button>
                <button
                  type="button"
                  onClick={buildPrompt}
                  className="text-[13px] font-medium text-[var(--brand-muted)] hover:underline"
                >
                  Rebuild from form
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="mt-3 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Generating…" : key ? "Regenerate image" : "Generate image"}
          </button>
        </div>
      )}

      <div className="flex items-start gap-4">
        {key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${key}`}
            alt=""
            className="h-24 w-24 rounded-[var(--radius-sm)] border border-[var(--brand-line)] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--brand-line)] text-center text-[12px] text-[var(--brand-muted)]">
            No image
          </div>
        )}

        {mode === "upload" && (
          <div>
            <label
              htmlFor={`${name}-file`}
              className="inline-block cursor-pointer rounded-[var(--radius-sm)] border border-[var(--brand-line)] px-3 py-2 text-[14px] font-medium hover:bg-[var(--brand-line)]"
            >
              {busy ? "Uploading…" : key ? "Replace image" : "Upload image"}
            </label>
            <input
              id={`${name}-file`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={uploadFile}
              disabled={busy}
              className="sr-only"
            />
          </div>
        )}

        {key && (
          <button
            type="button"
            onClick={() => setKey("")}
            className="self-start text-[13px] text-[var(--brand-muted)] hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      {hint && (
        <p className="mt-1.5 text-[13px] text-[var(--brand-muted)]">{hint}</p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-1.5 text-[13px] text-[var(--brand-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
