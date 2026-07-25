// ─────────────────────────────────────────────────────────────────────────────
// 🚧  STUB — OWNED BY DEV C (task P8-04). NOT YET REPLACED.
//
//     MERGE DECISION (Dev A, 2026-07-25, A+B integration): MERGE-NOTES.md §2 said
//     to delete this file on merge. It was deleted, then RESTORED — deliberately.
//     Three merged Dev B call sites import it:
//       app/(learner)/dashboard/page.tsx
//       app/api/dashboard/summary/route.ts
//       app/api/admin/learners/[id]/route.ts
//     Dev C's lane has not started, so deleting this breaks `next build` for as
//     long as Phase 8 takes. A tree that does not compile is not a merged tree.
//     The stub is fail-closed (0%, no current module, final test NOT passed), so
//     surviving the merge cannot wrongly unlock anything or show a certificate CTA.
//
//     ⚠️  P8-04 MUST overwrite this file. It is logged in the BLOCKED TASKS table
//     in orchestrate/tasks.md so it cannot be forgotten. Dev C: your real
//     implementation replaces this wholesale — do not merge into it.
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
