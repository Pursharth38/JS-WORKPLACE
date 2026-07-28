// DEV B — Zod schemas for every auth boundary.
// CONTRACTS.md "VALIDATION": a parse failure is 400 with the fixed message
// "Invalid input". Never return the Zod issue list — it leaks the schema shape.
import { z } from 'zod'

/**
 * The certificate prints this verbatim and `nameLocked` freezes it on first
 * issue, so it is validated harder than a display name would be.
 */
export const legalNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name')
  .max(100)
  // Letters (incl. accented and Devanagari), spaces, apostrophes, hyphens, dots.
  // Digits and symbols are rejected — this ends up on a legal-looking document.
  .regex(/^[\p{L}][\p{L}\s.'-]*$/u, 'Enter your name as it should appear on your certificate')

export const emailSchema = z.string().trim().toLowerCase().email().max(254)

/**
 * 10 chars minimum, not the conventional 8. The whole account is a paid
 * enrolment plus a credential, and there is no MFA in v1.
 * No composition rules (upper/digit/symbol) — length beats character classes,
 * and composition rules push users toward `Password1!`.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(200, 'Password is too long')

export const signupSchema = z.object({
  name: legalNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // DPDP Act: must arrive `true` from an explicitly unticked checkbox.
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Please accept the privacy policy to continue' }),
  }),
  /**
   * Honeypot. Bots fill it; humans never see it.
   *
   * Permissive ON PURPOSE. This was `z.string().max(0)`, which rejected any
   * non-empty value at the validation layer — two bugs in one: it made
   * `signupAction`'s own honeypot branch unreachable dead code, and it failed
   * signup with a generic "Invalid input" for any human whose password manager
   * filled the field. Accept the value and let the action decide, so the reply
   * is indistinguishable from success and a bot learns nothing.
   *
   * NOT named `website` — see `Honeypot` in `components/auth/form-fields.tsx`.
   */
  refCode: z.string().max(200).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(200),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
