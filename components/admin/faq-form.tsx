'use client'

// CMS migration M2 — FAQ create/edit form.
import { useActionState } from 'react'

import { deleteFaq, saveFaq } from '@/app/admin/faq/actions'
import { CheckboxField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { uploadContentImage } from '@/components/admin/upload-image'

export function FaqForm({
  faq,
}: {
  faq: {
    id: string
    question: string
    answer: unknown
    category: string
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveFaq, CRUD_IDLE)

  return (
    <form action={formAction}>
      {faq && <input type="hidden" name="id" value={faq.id} />}

      <TextField label="Question" name="question" defaultValue={faq?.question} required />
      <TextField
        label="Category"
        name="category"
        defaultValue={faq?.category}
        required
        hint="Questions are grouped by category on /faq. Reuse an existing name to add to a group."
      />

      <p className="mb-1.5 text-[14px] font-medium">Answer</p>
      <RichTextEditor
        name="answer"
        initialValue={faq?.answer}
        onUploadImage={uploadContentImage}
        minHeight={200}
      />
      <div className="mb-4" />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={faq?.isPublished ?? true}
        hint="Unpublished questions stay editable here but never appear on the site."
      />

      <SaveBar
        state={state}
        saveLabel={faq ? 'Save changes' : 'Create question'}
        onDelete={faq ? deleteFaq.bind(null, faq.id) : undefined}
      />
    </form>
  )
}
