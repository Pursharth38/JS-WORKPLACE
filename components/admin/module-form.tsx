'use client'

// CMS migration M5 — module form. videoUid is edited HERE, on an ADMIN-only,
// server-rendered page. It must never appear on any public surface — the
// public getters' selects enforce that.
import { useActionState } from 'react'

import { deleteModule, saveModule } from '@/app/admin/courses/actions'
import { CheckboxField, NumberField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { uploadContentImage } from '@/components/admin/upload-image'

export function ModuleForm({
  courseId,
  chapterId,
  module,
}: {
  courseId: string
  chapterId: string
  module: {
    id: string
    title: string
    videoUid: string
    durationSeconds: number
    isFreePreview: boolean
    notes: unknown
  } | null
}) {
  const [state, formAction] = useActionState(saveModule, CRUD_IDLE)

  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="chapterId" value={chapterId} />
      {module && <input type="hidden" name="id" value={module.id} />}

      <TextField label="Module title" name="title" defaultValue={module?.title} required />
      <TextField
        label="Cloudflare Stream video UID"
        name="videoUid"
        defaultValue={module?.videoUid}
        required
        hint="From the Cloudflare dashboard after uploading the video. Learners never see this — playback uses short-lived signed tokens."
      />
      <NumberField
        label="Duration (seconds)"
        name="durationSeconds"
        defaultValue={module?.durationSeconds}
        required
        min={1}
        hint="Completion = 90% of this watched. Must match the real video length or the module becomes impossible (too long) or trivially completable (too short)."
      />
      <CheckboxField
        label="Free preview"
        name="isFreePreview"
        defaultChecked={module?.isFreePreview ?? false}
        hint="Preview modules are watchable by anyone, enrolled or not."
      />

      <p className="mb-1.5 text-[14px] font-medium">Module notes (shown under the player)</p>
      <RichTextEditor
        name="notes"
        initialValue={module?.notes}
        onUploadImage={uploadContentImage}
        minHeight={180}
      />
      <div className="mb-4" />

      <SaveBar
        state={state}
        saveLabel={module ? 'Save module' : 'Add module'}
        onDelete={module ? deleteModule.bind(null, courseId, chapterId, module.id) : undefined}
      />
      {module && (
        <p className="mt-2 text-[13px] text-[var(--brand-muted)]">
          Deletion is refused automatically if any learner has progress on this module.
        </p>
      )}
    </form>
  )
}
