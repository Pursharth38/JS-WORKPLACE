// ─────────────────────────────────────────────────────────────────────────────
// 🚧  STUB — OWNED BY DEV C (task P8-04). DELETE THIS FILE ON MERGE.
//
//     Dev B's dashboard consumes `getCourseProgress()` (the H5 contract in
//     CONTRACTS.md). Dev C's real implementation does not exist on this branch,
//     so this stub exists only so Dev B's code typechecks and renders offline.
//
//     Dev B must NEVER reimplement the completion or grading math here — that
//     is Dev C's correctness core and duplicating it guarantees the two
//     disagree. The stub returns a zeroed, safe-by-default shape: 0% complete,
//     no current module, final test NOT passed. Failing closed means that if
//     this file somehow survives the merge, no learner is wrongly shown a
//     certificate CTA.
//
//     MERGE STEP: delete this file, keep Dev C's lib/progress.ts. The exported
//     signature below is the agreed contract — if Dev C's differs, that is a
//     contract break to resolve before either branch lands.
// ─────────────────────────────────────────────────────────────────────────────

export type CourseProgress = {
  percentComplete: number
  currentModuleId: string | null
  finalTestPassed: boolean
}

export async function getCourseProgress(
  _userId: string,
  _courseId: string,
): Promise<CourseProgress> {
  return { percentComplete: 0, currentModuleId: null, finalTestPassed: false }
}
