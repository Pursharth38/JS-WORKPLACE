/**
 * The 8-question POSH compliance self-check (E3).
 *
 * ⚠️ This is an AWARENESS TOOL, not a legal audit, and every piece of copy that
 * surrounds it says so. Telling an employer they are "compliant" on the strength
 * of eight yes/no questions would be wrong and would be a liability for the
 * client. The output is framed as "here is what to look at first".
 *
 * Shared deliberately between the browser and the server: the visitor sees an
 * instant result, and the emailed report is recomputed server-side from the same
 * function. One scoring implementation means the two can never disagree.
 *
 * The questions restate obligations that appear in the POSH Act itself. They are
 * written in our own words — no wording is taken from any competitor's site.
 */

export type Answer = "yes" | "no" | "unsure";

export type Question = {
  id: string;
  /** Shown to the visitor. */
  text: string;
  /** Extra context, shown smaller beneath the question. */
  help?: string;
  /** What to tell them to look at when the answer is not "yes". */
  gap: string;
};

export const QUESTIONS: readonly Question[] = [
  {
    id: "policy",
    text: "Do you have a written policy on sexual harassment at work?",
    help: "A standalone document, not a paragraph inside the general HR handbook.",
    gap: "Put a written anti-sexual-harassment policy in place and circulate it.",
  },
  {
    id: "ic-constituted",
    text: "Have you formally constituted an Internal Committee?",
    help: "Required at every workplace with 10 or more employees.",
    gap: "Constitute an Internal Committee by a written order and record who sits on it.",
  },
  {
    id: "ic-composition",
    text: "Is the Presiding Officer a woman, with at least half the members women?",
    help: "Both conditions apply to the committee's composition.",
    gap: "Reconstitute the committee so a woman presides and at least half the members are women.",
  },
  {
    id: "ic-external",
    text: "Does your Internal Committee include an external member?",
    help: "Someone from outside your organisation, familiar with the issues involved.",
    gap: "Appoint an external member to the committee — an internal-only committee is not validly constituted.",
  },
  {
    id: "ic-trained",
    text: "Have your Internal Committee members been trained to run an inquiry?",
    help: "Knowing the law is not the same as knowing the procedure and its timelines.",
    gap: "Train the committee on inquiry procedure, evidence, timelines and report writing.",
  },
  {
    id: "awareness",
    text: "Have all employees had awareness training in the last 12 months?",
    help: "Including new joiners since the last session.",
    gap: "Run an awareness session covering all staff, and repeat it for new joiners.",
  },
  {
    id: "display",
    text: "Are the penalties and the complaint process displayed where staff can see them?",
    help: "Physically at the workplace, or somewhere equally visible for remote teams.",
    gap: "Display the consequences of harassment and how to complain, where employees will actually see them.",
  },
  {
    id: "annual-report",
    text: "Did you file the annual report with the District Officer this year?",
    help: "Covering the number of complaints received and disposed of.",
    gap: "Prepare and file the annual report — this is a recurring obligation, not one-off.",
  },
] as const;

export type Answers = Record<string, Answer>;

export type Result = {
  scorePercent: number;
  bandLabel: string;
  bandMessage: string;
  gaps: string[];
};

/**
 * "unsure" scores as zero, not as half.
 *
 * If the person filling this in does not know whether their committee has an
 * external member, then in practice it is not something the organisation can
 * evidence — and an evidence gap is a real gap. Scoring it generously would
 * flatter the result and defeat the purpose of the tool.
 */
function points(answer: Answer | undefined): number {
  return answer === "yes" ? 1 : 0;
}

export function scoreAnswers(answers: Answers): Result {
  const earned = QUESTIONS.reduce((sum, q) => sum + points(answers[q.id]), 0);
  const scorePercent = Math.round((earned / QUESTIONS.length) * 100);

  const gaps = QUESTIONS.filter((q) => answers[q.id] !== "yes").map((q) => q.gap);

  let bandLabel: string;
  let bandMessage: string;

  if (scorePercent === 100) {
    bandLabel = "No gaps flagged";
    bandMessage =
      "Your answers did not flag any of the common gaps this check looks for. That is a good position to be in — worth confirming with a proper review, since these eight questions cannot cover everything.";
  } else if (scorePercent >= 75) {
    bandLabel = "Mostly in place";
    bandMessage =
      "Most of the basics are covered. The items below are the ones that would come up first if your arrangements were examined.";
  } else if (scorePercent >= 40) {
    bandLabel = "Significant gaps";
    bandMessage =
      "Several core obligations look unmet. These are the kind of gaps that matter if a complaint is ever raised, because they affect whether a committee's findings can stand.";
  } else {
    bandLabel = "Urgent attention needed";
    bandMessage =
      "Most of the foundations are missing. This is worth treating as a priority — not because of the risk of a penalty, but because there is currently no working route for someone to raise a complaint.";
  }

  return { scorePercent, bandLabel, bandMessage, gaps };
}
