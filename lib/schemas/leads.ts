import { z } from "zod";

/** Where the lead came from. Drives the notification subject and reporting. */
export const LEAD_SOURCES = [
  "demo",
  "checklist",
  "assessment",
  "newsletter",
  "contact",
] as const;

export const SERVICE_INTERESTS = [
  "Employee awareness sessions",
  "Manager training",
  "IC member training",
  "External IC member",
  "Policy drafting and review",
  "POSH audit / compliance check",
  "Soft-skills workshops",
  "Workplace wellness programme",
  "Not sure yet",
] as const;

export const EMPLOYEE_COUNTS = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "500+",
] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  employeeCount: z.enum(EMPLOYEE_COUNTS).optional().or(z.literal("")),
  serviceInterest: z.enum(SERVICE_INTERESTS).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),

  source: z.enum(LEAD_SOURCES),

  /**
   * DPDP Act. The checkbox renders UNTICKED and the server rejects `false`.
   * A pre-ticked box is not consent, and "they didn't untick it" is not a
   * defence anyone wants to run.
   */
  consentGiven: z.coerce.boolean(),

  /**
   * Honeypot. Invisible to a human, irresistible to a bot. When this arrives
   * non-empty the route returns 200 and discards — telling the bot it failed
   * just teaches it to try again without the field.
   *
   * NOT named `website`: password managers autofill that name for real humans,
   * whose enquiry was then thrown away. See `Honeypot` in `components/ui/input.tsx`.
   */
  refCode: z.string().max(200).optional(),

  /** Cloudflare Turnstile token, re-verified server-side. */
  turnstileToken: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
