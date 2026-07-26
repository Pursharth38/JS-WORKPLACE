// DEV B — Google OAuth entry point. Server component wrapping a form so it
// works without JavaScript; the action performs the redirect server-side.
import { googleSignInAction } from "@/app/(auth)/actions";

export function GoogleButton({
  redirectTo,
  label = "Continue with Google",
}: {
  redirectTo?: string;
  label?: string;
}) {
  return (
    <form action={googleSignInAction}>
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      {/* Google's brand guidelines fix this button's colours regardless of host-site
          theme, the same way an Apple Pay or PayPal button would — so every colour
          here is a literal, not a --brand-* token. Using text-[var(--brand-ink)] on
          bg-white broke exactly this way: --brand-ink flips to near-white in dark
          mode, so the label went invisible on the still-white button (same bug as
          the Field inputs in form-fields.tsx, fixed alongside this). */}
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-[#dadce0] bg-white px-4 py-3 text-[16px] font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        {label}
      </button>
    </form>
  );
}
