import type { Metadata } from "next";

import { LegalReviewNote } from "@/components/marketing/legal-review-note";
import { getSiteSettings } from "@/lib/content";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How JS Workplace Wellness collects, uses and protects your personal data.",
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const name = settings.legalEntityName || settings.businessName;
  const contact = settings.supportEmail || settings.email;

  return (
    <article>
      <h1 className="font-serif text-[39px] font-semibold">Privacy policy</h1>
      <p className="mt-2 text-[15px] text-[var(--brand-muted)]">
        Last updated{" "}
        {new Date().toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })}
      </p>

      <LegalReviewNote />

      <p>
        This policy explains what personal data {name} collects when you use this
        website, why we collect it, and what rights you have over it. It is
        written to meet our obligations under India&rsquo;s Digital Personal Data
        Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <p>We collect only what we need for the purpose you gave it to us for.</p>
      <ul>
        <li>
          <strong>When you contact us or request a consultation:</strong> your
          name, email address, and optionally your phone number, organisation,
          approximate employee count and whatever you write in the message field.
        </li>
        <li>
          <strong>When you create an account:</strong> your name and email
          address, and a securely hashed version of your password. We never store
          your password itself.
        </li>
        <li>
          <strong>When you buy a course:</strong> a record of the transaction.
          Card and banking details are handled entirely by our payment processor
          and never reach our servers.
        </li>
        <li>
          <strong>When you use the course:</strong> which lessons you have
          watched, how far through them you are, and your assessment results.
        </li>
        <li>
          <strong>Analytics:</strong> aggregate, anonymous usage statistics. We
          use a cookieless analytics tool and do not track you across other
          websites.
        </li>
      </ul>

      <h2>Why we collect it</h2>
      <ul>
        <li>To respond to your enquiry.</li>
        <li>To give you access to a course you have paid for.</li>
        <li>
          To record your progress and issue a Certificate of Completion in your
          name.
        </li>
        <li>To meet our tax and accounting obligations.</li>
      </ul>

      <h2>Consent</h2>
      <p>
        Where we rely on your consent — for example, to contact you after you
        submit an enquiry form — we ask for it explicitly. Consent boxes on this
        site are never pre-ticked, and we record the date on which you gave it.
        You can withdraw consent at any time by emailing us.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We do not sell your personal data, and we do not share it for anyone
        else&rsquo;s marketing. We use a small number of service providers to run
        the site: a hosting provider, a database provider, a payment processor,
        an email delivery service and a file storage provider. Each receives only
        the data needed to perform its function.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>
          <strong>Enquiries:</strong> up to 24 months from your last contact with
          us, unless you ask us to delete them sooner.
        </li>
        <li>
          <strong>Account and course records:</strong> for as long as your
          account is open.
        </li>
        <li>
          <strong>Certificates:</strong> retained indefinitely, because a
          certificate that cannot be verified is worthless. If you close your
          account we keep the minimum needed to honour verification requests.
        </li>
        <li>
          <strong>Financial records:</strong> for the period Indian tax law
          requires.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Ask what personal data we hold about you.</li>
        <li>Ask us to correct anything that is wrong.</li>
        <li>
          Ask us to delete your data, subject to records we are legally required
          to keep.
        </li>
        <li>Withdraw consent you previously gave.</li>
        <li>Nominate someone to exercise these rights on your behalf.</li>
      </ul>
      <p>
        To exercise any of these, email us at the address below. We will respond
        within a reasonable period.
      </p>

      <h2>Security</h2>
      <p>
        Data is transmitted over encrypted connections and passwords are stored
        hashed. No system is perfectly secure, but we take reasonable technical
        and organisational measures to protect your information, and we will tell
        you and the relevant authority if a breach occurs that affects you.
      </p>

      <h2>Children</h2>
      <p>
        This site is intended for adults in a workplace context. We do not
        knowingly collect data from children.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy, or a request about your data, can be sent to{" "}
        {contact ? (
          <a
            href={`mailto:${contact}`}
            className="text-[var(--brand-primary)] underline underline-offset-2"
          >
            {contact}
          </a>
        ) : (
          "our contact address"
        )}
        .
      </p>
    </article>
  );
}
