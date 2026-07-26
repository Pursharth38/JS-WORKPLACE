'use client'

// CMS migration M2 — Service create/edit form.
import { useActionState, useRef } from 'react'

import { deleteService, saveService } from '@/app/admin/services/actions'
import {
  CheckboxField,
  SlugField,
  StringListField,
  TextAreaField,
  TextField,
} from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { uploadContentImage } from '@/components/admin/upload-image'

export function ServiceForm({
  service,
}: {
  service: {
    id: string
    title: string
    slug: string
    summary: string
    icon: string | null
    whoItIsFor: string[]
    whatIsCovered: string[]
    format: string | null
    body: unknown
    seoTitle: string | null
    seoDescription: string | null
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveService, CRUD_IDLE)
  const titleRef = useRef<HTMLDivElement>(null)

  return (
    <form action={formAction}>
      {service && <input type="hidden" name="id" value={service.id} />}

      <div ref={titleRef}>
        <TextField label="Title" name="title" defaultValue={service?.title} required />
      </div>
      <SlugField
        name="slug"
        defaultValue={service?.slug}
        sourceValue={() => titleRef.current?.querySelector('input')?.value ?? ''}
        locked={!!service}
        lockWarning="Changing a slug breaks the service's URL anywhere it has been shared. Unlock only if you are sure."
        hint="Forms the URL: /services/<slug>"
      />
      <TextAreaField label="Summary" name="summary" defaultValue={service?.summary} required rows={2} />
      <TextField
        label="Icon"
        name="icon"
        defaultValue={service?.icon}
        hint="Lucide icon name used on the services grid (e.g. shield-check)."
      />
      <StringListField label="Who it's for" name="whoItIsFor" defaultValue={service?.whoItIsFor} />
      <StringListField label="What's covered" name="whatIsCovered" defaultValue={service?.whatIsCovered} />
      <TextField label="Format" name="format" defaultValue={service?.format} hint="e.g. Half-day workshop, on-site or remote" />

      <p className="mb-1.5 text-[14px] font-medium">Detailed description</p>
      <RichTextEditor
        name="body"
        initialValue={service?.body}
        onUploadImage={uploadContentImage}
        minHeight={220}
      />
      <div className="mb-4" />

      <TextField label="SEO title" name="seoTitle" defaultValue={service?.seoTitle} hint="≤70 characters." />
      <TextAreaField label="SEO description" name="seoDescription" defaultValue={service?.seoDescription} rows={2} hint="≤160 characters." />

      <CheckboxField label="Published" name="isPublished" defaultChecked={service?.isPublished ?? true} />

      <SaveBar
        state={state}
        saveLabel={service ? 'Save changes' : 'Create service'}
        onDelete={service ? deleteService.bind(null, service.id) : undefined}
      />
    </form>
  )
}
