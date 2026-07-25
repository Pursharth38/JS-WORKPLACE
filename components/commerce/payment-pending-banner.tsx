'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DEV B — bridges the gap between Razorpay's browser callback and our webhook.
//
// Enrolment is created by the webhook, which arrives out-of-band and typically
// lands within a couple of seconds — but *after* Razorpay has already sent the
// browser back here. Without this, a learner who just paid sees an empty
// dashboard and reasonably concludes their money vanished.
//
// It polls a read-only summary endpoint. It cannot and does not grant access;
// it only asks the server whether the enrolment has appeared yet.
// ─────────────────────────────────────────────────────────────────────────────
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const POLL_MS = 2500
const GIVE_UP_MS = 45_000

export function PaymentPendingBanner({ courseSlug }: { courseSlug: string }) {
  const router = useRouter()
  const [state, setState] = useState<'waiting' | 'slow'>('waiting')
  const startedAt = useRef(Date.now())

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      if (cancelled) return

      try {
        const res = await fetch('/api/dashboard/summary', { cache: 'no-store' })
        const payload: {
          data: { enrollments: { slug: string }[] } | null
        } = await res.json()

        const found = payload.data?.enrollments.some((e) => e.slug === courseSlug)
        if (found) {
          // The enrolment exists. Re-render the server component tree so the
          // course appears, and drop the ?payment=processing query.
          router.replace('/dashboard')
          router.refresh()
          return
        }
      } catch {
        // Network blip — just try again on the next tick.
      }

      if (Date.now() - startedAt.current > GIVE_UP_MS) {
        setState('slow')
        return
      }
      timer = setTimeout(tick, POLL_MS)
    }

    let timer = setTimeout(tick, POLL_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [courseSlug, router])

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-8 rounded-lg border border-[var(--brand-line)] bg-white p-5"
    >
      {state === 'waiting' ? (
        <>
          <p className="text-[17px] font-semibold text-[var(--brand-teal)]">
            Confirming your payment…
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--brand-muted)]">
            This usually takes a few seconds. Your course will appear below automatically —
            you do not need to refresh or pay again.
          </p>
        </>
      ) : (
        <>
          <p className="text-[17px] font-semibold text-[var(--brand-ink)]">
            Your payment is taking longer than usual to confirm
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--brand-muted)]">
            If money has left your account, it has been received and your enrolment will
            appear shortly — <strong>please do not pay again</strong>. If it has not
            appeared within an hour, contact us with your payment reference and we will
            sort it out.
          </p>
          <a
            href="/contact"
            className="mt-3 inline-block text-[15px] font-medium text-[var(--brand-teal)] underline"
          >
            Contact support
          </a>
        </>
      )}
    </div>
  )
}
