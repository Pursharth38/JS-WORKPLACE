// CMS migration M5 — question editor ("new" creates). The one surface that
// renders the answer key — server-rendered, ADMIN-authenticated.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { QuestionForm } from '@/components/admin/question-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit question' }
export const dynamic = 'force-dynamic'

type Option = { id: string; text: string; isCorrect: boolean }

export default async function AdminQuestionEditPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string; questionId: string }>
}) {
  const { courseId, chapterId, questionId } = await params

  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: { title: true },
  })
  if (!chapter) notFound()

  const raw =
    questionId === 'new'
      ? null
      : await db.question.findFirst({
          where: { id: questionId, chapterId },
          select: {
            id: true,
            text: true,
            topic: true,
            explanation: true,
            options: true,
            isActive: true,
          },
        })

  if (questionId !== 'new' && !raw) notFound()

  const question = raw
    ? { ...raw, options: (raw.options as Option[] | null) ?? [] }
    : null

  return (
    <div className="max-w-3xl">
      <p className="mb-1 text-[13px] text-[var(--brand-muted)]">
        <Link href={`/admin/courses/${courseId}/${chapterId}`} className="hover:underline">
          {chapter.title}
        </Link>{' '}
        / question
      </p>
      <AdminPageHeader title={question ? 'Edit question' : 'New question'} />
      <AdminCard>
        <QuestionForm courseId={courseId} chapterId={chapterId} question={question} />
      </AdminCard>
    </div>
  )
}
