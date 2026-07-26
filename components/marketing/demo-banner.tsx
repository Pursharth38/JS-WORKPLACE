/**
 * Sitewide warning that the content on screen is demo data.
 *
 * Renders whenever no Sanity project is configured. Deliberately loud and
 * deliberately not dismissible: the failure mode being guarded against is a
 * screenshot of placeholder testimonials or "[00]" statistics ending up in a
 * client deck, or an unconfigured deploy going live and reading as real.
 *
 * It disappears on its own the moment NEXT_PUBLIC_SANITY_PROJECT_ID is set.
 */
export function DemoBanner() {
  return (
    <div className="bg-[var(--brand-warning)] px-4 py-2 text-center text-[14px] font-medium text-[var(--brand-warning-on)]">
      <span aria-hidden="true" className="mr-1.5">
        ⚠
      </span>
      Demo content — no CMS connected. Text, statistics and testimonials on this
      site are placeholders, not real.
    </div>
  );
}
