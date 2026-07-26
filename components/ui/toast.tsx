"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; message: string };

const ToastContext = createContext<{
  notify: (message: string, tone?: ToastTone) => void;
} | null>(null);

const TONES: Record<ToastTone, string> = {
  success: "border-[var(--brand-success)] bg-[var(--brand-success-soft)] text-[var(--brand-success)]",
  error: "border-[var(--brand-danger)] bg-[var(--brand-danger-soft)] text-[var(--brand-danger)]",
  info: "border-[var(--brand-primary)] bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]",
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, tone, message }]);
    // Long enough to read a sentence; short enough not to linger over content.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        `role="status"` + `aria-live="polite"` announces without interrupting.
        The region is always in the DOM — mounting it with the first toast
        means assistive tech misses that first announcement.
      */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-[var(--radius-md)] border px-4 py-3 text-[15px] font-medium shadow-[var(--shadow-md)]",
              TONES[t.tone],
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
