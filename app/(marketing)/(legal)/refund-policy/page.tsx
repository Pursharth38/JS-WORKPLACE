import type { Metadata } from "next";

import { LegalReviewNote } from "@/components/marketing/legal-review-note";
import { getSiteSettings } from "@/lib/sanity";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Refund policy",
  description:
    "When you can get a refund on a JS Workplace Wellness course or training booking, and how to request one.",
};

/**
 * ⚠️ COMMERCIAL TERMS PENDING CLIENT SIGN-OFF.
 *
 * The 7-day / 20%-consumed window below is a reasonable industry-standard draft
 * chosen so Razorpay activation is not held up. It is a BUSINESS decision, not a
 * technical one — the client must confirm or change the numbers. Related open
 * question in MERGE-NOTES.md §7: whether a refund should automatically revoke
 * course access and any issued certificate. Today it does not; an admin acts
 * manually.
 */
export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();
  const name = settings.legalEntityName || settings.businessName;
  const contact = settings.supportEmail || settings.email;

  return (
    <article>
      <h1 className="font-serif text-[39px] font-semibold">Refund policy</h1>
      <p className="mt-2 text-[15px] text-[var(--brand-muted)]">
        Last updated{" "}
        {new Date().toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })}
      </p>

      <LegalReviewNote />

      <p>
        This policy explains when {name} will refund a purchase. It applies to
        self-paced online courses bought through this website. Bookings for live
        training sessions are covered separately at the bottom of this page.
      </p>

      <h2>Online courses</h2>

      <h3>Full refund</h3>
      <p>
        You can request a full refund within <strong>7 days</strong> of purchase,
        provided you have completed no more than <strong>20%</strong> of the
        course. We track lesson progress automatically, so you do not need to
        prove this.
      </p>

      <h3>When a refund is not available</h3>
      <ul>
        <li>More than 7 days have passed since purchase.</li>
        <li>You have completed more than 20% of the course.</li>
        <li>
          A Certificate of Completion has already been issued to you for that
          course.
        </li>
        <li>
          The purchase was made through an account found to be shared, or the
          course material has been copied or redistributed.
        </li>
      </ul>
      <p>
        The reason for these limits is straightforward: the course is delivered
        digitally and in full the moment you get access, so a completed course
        cannot meaningfully be returned.
      </p>

      <h3>If something is wrong with the course</h3>
      <p>
        The limits above do not apply if the problem is ours. If a course is
        broken, materially incomplete, or does not work as described, tell us and
        we will fix it or refund you in full, whatever stage you are at.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email{" "}
        {contact ? (
          <a
            href={`mailto:${contact}`}
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            {contact}
          </a>
        ) : (
          "our support address"
        )}{" "}
        from the address on your account, with your order reference and a short
        note about why you are asking. You do not need to justify a request that
        falls inside the 7-day window.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds go back to the original payment method through our
        payment provider. We aim to approve or decline within{" "}
        <strong>5 business days</strong> of receiving your request. Once
        approved, the money typically reaches you within{" "}
        <strong>5 to 10 business days</strong>, depending on your bank. We do not
        control that final step.
      </p>
      <p>
        Where a refund is issued, access to the course may be withdrawn and any
        certificate issued for it may be revoked.
      </p>

      <h2>Live training sessions</h2>
      <p>
        Bookings for in-person or online training sessions are separate from
        online course purchases:
      </p>
      <ul>
        <li>
          Cancel <strong>more than 14 days</strong> before the session date: full
          refund.
        </li>
        <li>
          Cancel <strong>7 to 14 days</strong> before: 50% refund, because the
          date has usually been held and preparation started.
        </li>
        <li>
          Cancel <strong>fewer than 7 days</strong> before: no refund, though we
          will normally offer to move the session once.
        </li>
        <li>
          If we cancel or reschedule a session, you get a full refund or a new
          date, whichever you prefer.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        If you think this policy has been applied unfairly to you, reply to our
        decision and say so. We would rather sort it out directly.
      </p>
    </article>
  );
}
