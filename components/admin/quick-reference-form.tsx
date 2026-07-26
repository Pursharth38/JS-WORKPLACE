'use client'

// CMS migration M4 — IC Quick Reference create/edit form.
import { useActionState, useRef } from 'react'

import { deleteQuickReference, saveQuickReference } from '@/app/admin/ic-reference/actions'
import { CheckboxField, SlugField, TextAreaField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { uploadContentImage } from '@/components/admin/upload-image'

export function QuickReferenceForm({
  card,
}: {
  card: {
    id: string
    title: string
    anchor: string
    intro: string | null
    body: unknown
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveQuickReference, CRUD_IDLE)
  const titleRef = useRef<HTMLDivElement>(null)

  return (
    <form action={formAction}>
      {card && <input type="hidden" name="id" value={card.id} />}

      <div ref={titleRef}>
        <TextField label="Title" name="title" defaultValue={card?.title} required />
      </div>
      <SlugField
        label="Anchor"
        name="anchor"
        defaultValue={card?.anchor}
        sourceValue={() => titleRef.current?.querySelector('input')?.value ?? ''}
        locked={!!card?.isPublished}
        lockWarning="Published anchors are shared links — changing one breaks them."
        hint="Deep-link id on /ic-quick-reference."
      />
      <TextAreaField label="Intro" name="intro" defaultValue={card?.intro} rows={2} />

      <p className="mb-1.5 text-[14px] font-medium">Body</p>
      <RichTextEditor
        name="body"
        initialValue={card?.body}
        onUploadImage={uploadContentImage}
        minHeight={260}
      />
      <div className="mb-4" />

      <CheckboxField label="Published" name="isPublished" defaultChecked={card?.isPublished ?? true} />

      <SaveBar
        state={state}
        saveLabel={card ? 'Save changes' : 'Create card'}
        onDelete={card ? deleteQuickReference.bind(null, card.id) : undefined}
      />
    </form>
  )
}
