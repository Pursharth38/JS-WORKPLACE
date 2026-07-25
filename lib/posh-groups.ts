/**
 * The 11 Knowledge Hub groups, in the order they appear on /posh-act.
 * Mirrors .claude/documentation/feature-inventory/knowledge-hub.md.
 *
 * ⚠️ This lives in lib/, NOT in sanity/schemas/, and has no imports on purpose.
 * The Studio schema file imports `defineType`/`defineField` from `sanity`, so a
 * public page importing the group list from there would drag the entire Sanity
 * Studio into the marketing bundle. The schema imports this constant instead.
 *
 * Order is the reading order of the guide and is deliberate: Compliance first
 * because that is what an employer arrives worried about; Background last
 * because the history matters least to someone with a problem today.
 */
export const POSH_GROUPS = [
  "Compliance",
  "Policy",
  "Internal Committee",
  "Local Committee",
  "Definitions",
  "Complaints",
  "Redressal",
  "False Complaints",
  "Confidentiality",
  "Appeal",
  "Background",
] as const;

export type PoshGroup = (typeof POSH_GROUPS)[number];
