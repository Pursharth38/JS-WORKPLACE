// CMS migration M5 — /admin/courses/[courseId]/[chapterId]:
// chapter form + module list + question pool.
//
// The question list shows text/topic/option-count — NEVER which option is
// correct. Correctness renders only inside the single-question edit form.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { deleteChapter, moveModule } from '@/app/admin/courses/actions'
import { ChapterForm } from '@/components/admin/chapter-form'
import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit chapter' }
export const dynamic = 'force-dynamic'

export default async function AdminChapterPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>
}) {
  const { courseId, chapterId } = await params

  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, courseId }, // scoped: a chapter of another course 404s
    select: {
      id: true,
      title: true,
      summary: true,
      passThreshold: true,
      course: { select: { title: true } },
      modules: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, durationSeconds: true, isFreePreview: true },
      },
      questions: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, text: true, topic: true, isActive: true },
      },
    },
  })
  if (!chapter) notFound()

  const boundMoveModule = moveModule.bind(null, courseId, chapterId)
  const boundDeleteChapter = deleteChapter.bind(null, courseId, chapterId)

  const activeQuestions = chapter.questions.filter((q) => q.isActive)

  return (
    <div className="max-w-3xl">
      <p className="mb-1 text-[13px] text-[var(--brand-muted)]">
        <Link href={`/admin/courses/${courseId}`} className="hover:underline">
          {chapter.course.title}
        </Link>{' '}
        / chapter
      </p>
      <AdminPageHeader title={chapter.title} />

      <AdminCard>
        <ChapterForm courseId={courseId} chapter={chapter} />
        <form action={boundDeleteChapter} className="mt-3 border-t border-[var(--brand-line)] pt-3">
          <button
            type="submit"
            className="text-[13px] text-[var(--brand-danger)] hover:underline"
          >
            Delete chapter (refused automatically if learners have attempts)
          </button>
        </form>
      </AdminCard>

      {/* ── Modules ─────────────────────────────────────────────────────── */}
      <div className="mb-3 mt-10 flex items-end justify-between">
        <h2 className="text-[20px]">Modules</h2>
        <Link
          href={`/admin/courses/${courseId}/${chapterId}/module/new`}
          className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-3 py-2 text-[14px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          Add module
        </Link>
      </div>

      {chapter.modules.length === 0 ? (
        <p className="text-[15px] text-[var(--brand-muted)]">No modules yet.</p>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {chapter.modules.map((m, i) => (
            <li
              key={m.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <span className="w-6 text-[13px] text-[var(--brand-muted)]">{i + 1}.</span>
              <ReorderButtons
                id={m.id}
                isFirst={i === 0}
                isLast={i === chapter.modules.length - 1}
                action={boundMoveModule}
              />
              <Link
                href={`/admin/courses/${courseId}/${chapterId}/module/${m.id}`}
                className="min-w-0 flex-1 truncate text-[15px] hover:text-[var(--brand-primary)] hover:underline"
              >
                {m.title}
              </Link>
              <span className="text-[13px] tabular-nums text-[var(--brand-muted)]">
                {Math.round(m.durationSeconds / 60)} min
              </span>
              {m.isFreePreview && (
                <span className="rounded-full bg-[var(--brand-primary-tint)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--brand-primary)]">
                  Preview
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── Question pool ───────────────────────────────────────────────── */}
      <div className="mb-3 mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-[20px]">Question pool</h2>
          <p className="text-[13px] text-[var(--brand-muted)]">
            {activeQuestions.length} active — assessments draw a random subset per attempt.
          </p>
        </div>
        <Link
          href={`/admin/courses/${courseId}/${chapterId}/question/new`}
          className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-3 py-2 text-[14px] font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
        >
          Add question
        </Link>
      </div>

      {chapter.questions.length === 0 ? (
        <p className="text-[15px] text-[var(--brand-muted)]">No questions yet.</p>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
          {chapter.questions.map((q) => (
            <li
              key={q.id}
              className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
            >
              <Link
                href={`/admin/courses/${courseId}/${chapterId}/question/${q.id}`}
                className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
              >
                <span className="block truncate text-[15px]">{q.text}</span>
                <span className="text-[13px] text-[var(--brand-muted)]">{q.topic}</span>
              </Link>
              {!q.isActive && (
                <span className="rounded-full bg-[var(--brand-line)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--brand-muted)]">
                  Retired
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
