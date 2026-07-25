import { ButtonLink } from "@/components/ui/button";
import { Container } from "./container";

/**
 * Conversion band. Used between Knowledge Hub groups (Sanity-managed) and at the
 * foot of marketing pages.
 *
 * The button is `accent` (amber), which the Button component forces to 18px —
 * amber only clears 4.5:1 on Sand at ≥18px, and its label is Ink rather than
 * white for the same reason.
 */
export function CtaBand({
  heading,
  body,
  buttonLabel,
  buttonHref,
}: {
  heading: string;
  body?: string;
  buttonLabel: string;
  buttonHref: string;
}) {
  return (
    <section className="my-14 rounded-[var(--radius-lg)] bg-[var(--brand-primary)] px-6 py-10 md:px-10">
      <Container className="flex max-w-none flex-col gap-6 px-0 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[52ch]">
          <h2 className="font-serif text-[25px] font-semibold text-white md:text-[31px]">
            {heading}
          </h2>
          {body && (
            <p className="mt-3 text-[17px] leading-[1.65] text-white/85">
              {body}
            </p>
          )}
        </div>

        <ButtonLink href={buttonHref} variant="accent" className="shrink-0">
          {buttonLabel}
        </ButtonLink>
      </Container>
    </section>
  );
}
