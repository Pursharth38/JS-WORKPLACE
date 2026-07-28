// ─────────────────────────────────────────────────────────────────────────────
// The "about Jyoti" biography, in ONE place.
//
// Two surfaces render it — the section on the home page and the top of /about —
// and a biography that says two different things on two pages is the kind of
// drift nobody notices until a client does.
//
// ⚠️ EVERY CLAIM HERE MUST BE TRUE AND CLIENT-SUPPLIED.
//
// CLAUDE.md §1: Jyoti Solaria is NOT empanelled by the Ministry of Women and
// Child Development, and none of the forbidden claim strings may appear. The
// Vite prototype this section's design comes from headlined "India's Leading
// PoSH Law Expert", described her as "a certified PoSH law practitioner with
// over a decade of experience", and carried three pills reading "10+ Years
// Experience / 500+ Workshops / 50+ Companies Trained". All five of those were
// tagged "COPY: client to review" in that repo — i.e. placeholder text that was
// never verified — and shipping them here would be inventing credentials and
// trained-employee counts, which is the one thing this file exists to prevent.
//
// So: the STRUCTURE below is the prototype's (three paragraphs, then chips),
// the WORDS are the ones already reviewed on /about, and the chips stay empty
// until P0-04 delivers real figures. Do not fill them in to make the page look
// finished — an empty rail is a smaller problem than a challenged claim.
// ─────────────────────────────────────────────────────────────────────────────

export const ABOUT_HEADING = "Training built to survive being tested";

export const ABOUT_PHOTO = {
  src: "/jyoti-solaria.png",
  alt: "Jyoti Solaria, POSH trainer",
} as const;

/**
 * @param businessName from getSiteSettings(), so the CMS still owns the name.
 */
export function aboutParagraphs(businessName: string): string[] {
  return [
    `${businessName} works with Indian organisations on the Prevention of Sexual Harassment Act — awareness training that people actually absorb, Internal Committees that can run a proper inquiry, and policies that hold up when they are tested.`,

    "Compliance training has a reputation for being a box-ticking exercise that everyone sits through and nobody remembers. That is a real problem, because the Act only works if the people covered by it understand what it protects them from and what the process actually involves.",

    "Sessions are built around situations people recognise from their own workplaces, with time for the questions that only come up once the formal part is over. Internal Committee training goes further into procedure — how to receive a complaint, how to run an inquiry within the statutory timelines, and how to write a report that survives an appeal.",
  ];
}
