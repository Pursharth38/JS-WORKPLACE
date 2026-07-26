'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DEV B — P7-02. Razorpay Checkout trigger.
//
// ★ FOR DEV A: drop this into app/(marketing)/courses/[slug]/page.tsx. ★
//
// ★★ THIS COMPONENT NEVER GRANTS ACCESS. ★★
// The success handler's only job is to navigate. It does not create an
// Enrollment, does not mark a Payment paid, and does not unlock anything —
// an attacker controls every line of code that runs in this file and can
// invoke the handler directly from the console. Enrolment is created solely
// by the HMAC-verified webhook at /api/webhooks/razorpay.
// ─────────────────────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => void
  modal?: { ondismiss?: () => void }
}

type RazorpayInstance = { open: () => void }

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)

    // Loaded on click rather than on page load. The course sales page is a
    // marketing route with a ≥90 mobile Lighthouse budget, and Razorpay's
    // checkout bundle is not small — most visitors never press Buy.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function CheckoutButton({
  courseId,
  courseTitle,
  priceInPaise,
  isEnrolled,
  isSignedIn,
  courseSlug,
  learnerName,
  learnerEmail,
}: {
  courseId: string
  courseTitle: string
  priceInPaise: number
  isEnrolled: boolean
  isSignedIn: boolean
  courseSlug: string
  learnerName?: string
  learnerEmail?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    setBusy(true)
    setError(null)

    try {
      const scriptOk = await loadRazorpayScript()
      if (!scriptOk || !window.Razorpay) {
        setError('Could not reach the payment provider. Check your connection and try again.')
        setBusy(false)
        return
      }

      // Body carries the courseId ONLY. The server reads the price.
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const payload: {
        success: boolean
        message: string
        data: { orderId: string; amount: number; currency: string } | null
      } = await res.json()

      if (res.status === 401) {
        router.push(`/login?redirectTo=/courses/${courseSlug}`)
        return
      }
      if (res.status === 409) {
        router.push(`/learn/${courseSlug}`)
        return
      }
      if (!payload.success || !payload.data) {
        setError(payload.message || 'Could not start checkout. Please try again.')
        setBusy(false)
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!publicKey) {
        setError('Payments are not configured yet. Please contact us.')
        setBusy(false)
        return
      }

      const rzp = new window.Razorpay({
        key: publicKey,
        // Displayed only. The authoritative amount is on the order Razorpay
        // already holds; tampering here changes the label, not the charge.
        amount: payload.data.amount,
        currency: payload.data.currency,
        name: 'JS Workplace Wellness',
        description: courseTitle,
        order_id: payload.data.orderId,
        prefill: { name: learnerName, email: learnerEmail },
        theme: { color: '#0F5257' },

        handler: () => {
          // ★ Navigate. That is all. ★
          // The webhook may not have landed yet, so the dashboard shows a
          // "confirming your payment" state rather than asserting enrolment.
          router.push(`/dashboard?payment=processing&course=${encodeURIComponent(courseSlug)}`)
          router.refresh()
        },

        modal: {
          ondismiss: () => setBusy(false),
        },
      })

      rzp.open()
    } catch {
      setError('Something went wrong starting checkout. Please try again.')
      setBusy(false)
    }
  }, [courseId, courseSlug, courseTitle, learnerEmail, learnerName, router])

  if (isEnrolled) {
    return (
      <a
        href={`/learn/${courseSlug}`}
        className="block w-full rounded-md bg-[var(--brand-primary)] px-5 py-3.5 text-center text-[18px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
      >
        Continue the course
      </a>
    )
  }

  if (!isSignedIn) {
    return (
      <a
        href={`/login?redirectTo=/courses/${courseSlug}`}
        className="block w-full rounded-md bg-[var(--brand-accent)] px-5 py-3.5 text-center text-[18px] font-semibold text-[var(--brand-accent-on)] hover:bg-[var(--brand-accent-hover)]"
      >
        Sign in to enrol — {formatInr(priceInPaise)}
      </a>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="w-full rounded-md bg-[var(--brand-accent)] px-5 py-3.5 text-[18px] font-semibold text-[var(--brand-accent-on)] hover:bg-[var(--brand-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Opening checkout…' : `Enrol now — ${formatInr(priceInPaise)}`}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-[15px] text-[var(--brand-danger)]">
          {error}
        </p>
      )}

      <p className="mt-3 text-center text-[13px] text-[var(--brand-muted)]">
        Secure payment via Razorpay. See our{' '}
        <a href="/refund-policy" className="underline">
          refund policy
        </a>
        .
      </p>
    </div>
  )
}

function formatInr(amountInPaise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountInPaise / 100)
}
