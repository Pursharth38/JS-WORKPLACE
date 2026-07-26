'use client'

// CMS migration M5 — chapter form (used inline on the chapter page, and in
// "add chapter" mode on the course page).
import { useActionState } from 'react'

import { saveChapter } from '@/app/admin/courses/actions'
import { NumberField, TextAreaField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'

export function ChapterForm({
  courseId,
  chapter,
}: {
  courseId: string
  chapter: {
    id: string
    title: string
    summary: string | null
    passThreshold: number
  } | null
}) {
  const [state, formAction] = useActionState(saveChapter, CRUD_IDLE)

  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      {chapter && <input type="hidden" name="id" value={chapter.id} />}

      <TextField label="Chapter title" name="title" defaultValue={chapter?.title} required />
      <TextAreaField label="Summary" name="summary" defaultValue={chapter?.summary} rows={2} />
      <NumberField
        label="Assessment pass %"
        name="passThreshold"
        defaultValue={chapter?.passThreshold ?? 80}
        required
        min={1}
        hint="Default 80 — see the DECISIONS LOG before changing; 100% with retries is brute-forceable."
      />

      <SaveBar state={state} saveLabel={chapter ? 'Save chapter' : 'Add chapter'} />
    </form>
  )
}
