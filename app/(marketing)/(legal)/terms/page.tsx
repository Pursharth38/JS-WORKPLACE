import type { Metadata } from "next";
import Link from "next/link";

import { LegalReviewNote } from "@/components/marketing/legal-review-note";
import { getSiteSettings } from "@/lib/sanity";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms on which JS Workplace Wellness provides this website, its courses and its training services.",
};

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const name = settings.legalEntityName || settings.businessName;
  const contact = settings.supportEmail || settings.email;

  return (
    <article>
      <h1 className="font-serif text-[39px] font-semibold">Terms of service</h1>
      <p className="mt-2 text-[15px] text-[var(--brand-muted)]">
        Last updated{" "}
        {new Date().toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })}
      </p>

      <LegalReviewNote />

      <p>
        These terms govern your use of this website and any course or service you
        buy through it. By using the site or buying a course you agree to them.
        The site is operated by {name}.
      </p>

      <h2>What we provide</h2>
      <p>
        We provide awareness and compliance training relating to the Sexual
        Harassment of Women at Workplace (Prevention, Prohibition and Redressal)
        Act, 2013, delivered as live sessions and as self-paced online courses.
      </p>

      <h2>This is training, not legal advice</h2>
      <p>
        Everything on this site and in our courses is general information about
        the law and good practice. It is not legal advice and does not create a
        lawyer-client relationship. Your obligations depend on your specific
        circumstances, and you should take professional advice before acting on
        anything here. We are not liable for decisions taken solely on the basis
        of this material.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>
          You must give accurate information when you register, including the
          full legal name you want printed on your certificate.
        </li>
        <li>
          You are responsible for keeping your password confidential and for
          activity under your account.
        </li>
        <li>
          An account is personal to you. Sharing login details, or letting more
          than one person use one enrolment, is a breach of these terms and may
          result in access being withdrawn without refund.
        </li>
      </ul>

      <h2>Course access</h2>
      <p>
        When your payment is confirmed you get access to the course you bought.
        Lessons unlock in order: you move to the next lesson once you have
        watched the current one, and to the next chapter once you have passed
        that chapter&rsquo;s assessment. This structure is part of the training
        design and is not negotiable per learner.
      </p>

      <h2>Certificates</h2>
      <p>
        Completing a course and passing the final test earns a{" "}
        <strong>Certificate of Completion — POSH Awareness Training</strong>. The
        certificate records that you completed our training. It is not a
        government-issued qualification, a licence, or an accreditation, and it
        does not by itself make an organisation compliant with the Act.
      </p>
      <p>
        The certificate is issued in the legal name on your account at the time
        of issue, and that name is locked afterwards. Certificates can be
        verified publicly using the certificate ID. We may revoke a certificate
        obtained by sharing an account or otherwise breaching these terms.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All course videos, written material, assessments and site content belong
        to us. You may use them for your own learning. You may not record,
        download, copy, redistribute, resell or use them to deliver training to
        others without our written permission.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>
          Do not attempt to circumvent course progression, assessment rules or
          access controls.
        </li>
        <li>
          Do not attempt to gain unauthorised access to any part of the site.
        </li>
        <li>Do not use the site to break the law or infringe anyone&rsquo;s rights.</li>
      </ul>

      <h2>Payment</h2>
      <p>
        Prices are shown in Indian Rupees and include applicable taxes unless
        stated otherwise. Payments are processed by a third-party payment
        provider; we do not receive or store your card details. Refunds are
        governed by our{" "}
        <Link
          href="/refund-policy"
          className="text-[var(--brand-primary)] underline underline-offset-2"
        >
          refund policy
        </Link>
        .
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep the site available but do not guarantee uninterrupted
        access. We may suspend access for maintenance, and we may change or
        withdraw course content — though we will not remove a course you have
        already paid for without giving you reasonable access or a refund.
      </p>

      <h2>Liability</h2>
      <p>
        Nothing in these terms excludes liability that cannot lawfully be
        excluded. Subject to that, our total liability arising out of your use of
        the site or a course is limited to the amount you paid us for it.
      </p>

      <h2>Termination</h2>
      <p>
        You may close your account at any time. We may suspend or close an
        account that breaches these terms. Where we close an account for a breach
        that is not your fault, we will refund the unused portion of anything you
        have paid.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts of India
        have jurisdiction over any dispute arising from them.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
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
