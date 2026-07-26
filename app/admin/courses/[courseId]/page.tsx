// CMS migration M5 — /admin/courses/[courseId]: course form + chapter tree.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { moveChapter } from '@/app/admin/courses/actions'
import { ChapterForm } from '@/components/admin/chapter-form'
import { CourseForm } from '@/components/admin/course-form'
import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { ReorderButtons } from '@/components/admin/crud/reorder-buttons'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit course' }
export const dynamic = 'force-dynamic'

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  const course =
    courseId === 'new'
      ? null
      : await db.course.findUnique({
          where: { id: courseId },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            priceInPaise: true,
            durationMinutes: true,
            passThreshold: true,
            learningOutcomes: true,
            description: true,
            seoTitle: true,
            seoDescription: true,
            isPublished: true,
            chapters: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                _count: { select: { modules: true, questions: true } },
              },
            },
          },
        })

  if (courseId !== 'new' && !course) notFound()

  const boundMoveChapter = course
    ? moveChapter.bind(null, course.id)
    : undefined

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title={course ? course.title : 'New course'} />

      <AdminCard>
        <CourseForm course={course} />
      </AdminCard>

      {course && boundMoveChapter && (
        <>
          <h2 className="mb-3 mt-10 text-[20px]">Chapters</h2>
          {course.chapters.length === 0 ? (
            <p className="mb-4 text-[15px] text-[var(--brand-muted)]">
              No chapters yet — add the first one below.
            </p>
          ) : (
            <ul className="mb-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-elevated)]">
              {course.chapters.map((ch, i) => (
                <li
                  key={ch.id}
                  className="flex items-center gap-3 border-b border-[var(--brand-line)] px-4 py-3 last:border-0"
                >
                  <span className="w-6 text-[13px] text-[var(--brand-muted)]">{i + 1}.</span>
                  <ReorderButtons
                    id={ch.id}
                    isFirst={i === 0}
                    isLast={i === course.chapters.length - 1}
                    action={boundMoveChapter}
                  />
                  <Link
                    href={`/admin/courses/${course.id}/${ch.id}`}
                    className="min-w-0 flex-1 hover:text-[var(--brand-primary)]"
                  >
                    <span className="block truncate text-[15px]">{ch.title}</span>
                    <span className="text-[13px] text-[var(--brand-muted)]">
                      {ch._count.modules} modules · {ch._count.questions} questions
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <AdminCard>
            <h3 className="mb-3 text-[16px] font-semibold">Add a chapter</h3>
            <ChapterForm courseId={course.id} chapter={null} />
          </AdminCard>
        </>
      )}
    </div>
  )
}
