/**
 * Renders on every legal page until the client signs the drafts off.
 *
 * Deliberately visible on the page, not a code comment: these pages exist to
 * satisfy Razorpay's activation check, and the failure mode we are guarding
 * against is them quietly going live unreviewed because nobody remembered.
 *
 * REMOVE THIS COMPONENT'S USAGE once the client confirms the wording.
 * Tracked against P3-05 in orchestrate/tasks.md.
 */
export function LegalReviewNote() {
  return (
    <aside className="mt-6 rounded-[var(--radius-md)] border-l-4 border-[var(--brand-warning)] bg-[var(--brand-warning-soft)] p-4">
      <p className="text-[15px] leading-[1.6] text-[var(--brand-warning)]">
        <strong>Draft pending review.</strong> This page is a working draft
        prepared so payment processing can be activated. It has not yet been
        confirmed by the business owner or reviewed by a legal adviser.
      </p>
    </aside>
  );
}
