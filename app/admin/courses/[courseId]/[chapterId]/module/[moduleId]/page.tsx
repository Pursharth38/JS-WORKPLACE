// CMS migration M5 — module editor ("new" creates). ADMIN-only; this is the
// one place videoUid is legitimately visible.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminCard, AdminPageHeader } from '@/components/admin/crud/list-page'
import { ModuleForm } from '@/components/admin/module-form'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit module' }
export const dynamic = 'force-dynamic'

export default async function AdminModuleEditPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string; moduleId: string }>
}) {
  const { courseId, chapterId, moduleId } = await params

  // Scope the whole chain — a module under someone else's chapter/course 404s.
  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: { title: true },
  })
  if (!chapter) notFound()

  const moduleRow =
    moduleId === 'new'
      ? null
      : await db.module.findFirst({
          where: { id: moduleId, chapterId },
          select: {
            id: true,
            title: true,
            videoUid: true,
            durationSeconds: true,
            isFreePreview: true,
            notes: true,
          },
        })

  if (moduleId !== 'new' && !moduleRow) notFound()

  return (
    <div className="max-w-3xl">
      <p className="mb-1 text-[13px] text-[var(--brand-muted)]">
        <Link href={`/admin/courses/${courseId}/${chapterId}`} className="hover:underline">
          {chapter.title}
        </Link>{' '}
        / module
      </p>
      <AdminPageHeader title={moduleRow ? moduleRow.title : 'New module'} />
      <AdminCard>
        <ModuleForm courseId={courseId} chapterId={chapterId} module={moduleRow} />
      </AdminCard>
    </div>
  )
}
