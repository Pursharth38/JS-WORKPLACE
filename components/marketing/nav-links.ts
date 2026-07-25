/**
 * The public navigation, in one place so the header, the mobile drawer and the
 * footer cannot drift apart.
 *
 * Paths must match the ROUTE NAMESPACING table in CLAUDE.md. Several of these
 * are not built yet — see the DANGLING ROUTES table in orchestrate/tasks.md.
 */
export type NavLink = {
  href: string;
  label: string;
  description?: string;
};

export const PRIMARY_NAV: readonly NavLink[] = [
  {
    href: "/posh-act",
    label: "POSH Act guide",
    description: "A plain-English guide to the law, your duties and the process.",
  },
  {
    href: "/services",
    label: "Services",
    description: "Training, IC support, policy drafting and compliance audits.",
  },
  {
    href: "/courses",
    label: "Courses",
    description: "Self-paced POSH awareness training with a certificate.",
  },
  {
    href: "/blog",
    label: "Blog",
    description: "Updates, case notes and practical guidance.",
  },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const RESOURCE_NAV: readonly NavLink[] = [
  { href: "/posh-act", label: "POSH Act guide" },
  { href: "/ic-quick-reference", label: "IC quick reference" },
  { href: "/posh-compliance-check", label: "Compliance self-check" },
  { href: "/faq", label: "Frequently asked questions" },
  { href: "/blog", label: "Blog" },
] as const;

export const LEGAL_NAV: readonly NavLink[] = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/refund-policy", label: "Refund policy" },
] as const;
