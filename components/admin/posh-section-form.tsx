'use client'

// CMS migration M4 — POSH Hub section create/edit form.
import { useActionState, useRef } from 'react'

import { deleteSection, saveSection } from '@/app/admin/posh-hub/actions'
import {
  CheckboxField,
  SelectField,
  SlugField,
  TextAreaField,
  TextField,
} from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { uploadContentImage } from '@/components/admin/upload-image'
import { POSH_GROUPS } from '@/lib/posh-groups'

export function PoshSectionForm({
  section,
}: {
  section: {
    id: string
    title: string
    anchor: string
    group: string
    summary: string | null
    isFaq: boolean
    body: unknown
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveSection, CRUD_IDLE)
  const titleRef = useRef<HTMLDivElement>(null)

  return (
    <form action={formAction}>
      {section && <input type="hidden" name="id" value={section.id} />}

      <div ref={titleRef}>
        <TextField label="Title" name="title" defaultValue={section?.title} required />
      </div>
      <SlugField
        label="Anchor"
        name="anchor"
        defaultValue={section?.anchor}
        sourceValue={() => titleRef.current?.querySelector('input')?.value ?? ''}
        locked={!!section?.isPublished}
        confirmName="confirmAnchorChange"
        lockWarning="⚠ This anchor is a PERMANENT public link (/posh-act#…) shared in trainings and emails. Changing it breaks every copy of that link, everywhere, forever. Unlock only if you truly must."
        hint="Deep-link id on /posh-act — e.g. ic-constitution."
      />
      <SelectField
        label="Group"
        name="group"
        defaultValue={section?.group ?? POSH_GROUPS[0]}
        options={POSH_GROUPS.map((g) => ({ value: g, label: g }))}
        hint="Which of the 11 Knowledge Hub groups this section belongs to. Moving group appends it at that group's end."
      />
      <TextAreaField
        label="Summary"
        name="summary"
        defaultValue={section?.summary}
        rows={2}
        hint="One or two sentences shown under the heading and used by search engines."
      />
      <CheckboxField
        label="FAQ-style section"
        name="isFaq"
        defaultChecked={section?.isFaq ?? false}
        hint="Marks this section as a question-and-answer entry for FAQ schema markup."
      />

      <p className="mb-1.5 text-[14px] font-medium">Body</p>
      <RichTextEditor
        name="body"
        initialValue={section?.body}
        onUploadImage={uploadContentImage}
        minHeight={320}
      />
      <div className="mb-4" />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={section?.isPublished ?? true}
      />

      <SaveBar
        state={state}
        saveLabel={section ? 'Save changes' : 'Create section'}
        onDelete={section ? deleteSection.bind(null, section.id) : undefined}
      />
    </form>
  )
}
