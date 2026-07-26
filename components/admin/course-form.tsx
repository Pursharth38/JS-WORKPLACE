'use client'

// CMS migration M5 — course metadata form. Price edits here feed the SAME
// priceInPaise column checkout reads — that is the point, and it is admin-only.
import { useActionState, useRef } from 'react'

import { saveCourse } from '@/app/admin/courses/actions'
import {
  CheckboxField,
  NumberField,
  SlugField,
  StringListField,
  TextAreaField,
  TextField,
} from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { uploadContentImage } from '@/components/admin/upload-image'

export function CourseForm({
  course,
}: {
  course: {
    id: string
    title: string
    slug: string
    summary: string | null
    priceInPaise: number
    durationMinutes: number | null
    passThreshold: number
    learningOutcomes: string[]
    description: unknown
    seoTitle: string | null
    seoDescription: string | null
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveCourse, CRUD_IDLE)
  const titleRef = useRef<HTMLDivElement>(null)

  return (
    <form action={formAction}>
      {course && <input type="hidden" name="id" value={course.id} />}

      <div ref={titleRef}>
        <TextField label="Title" name="title" defaultValue={course?.title} required />
      </div>
      <SlugField
        name="slug"
        defaultValue={course?.slug}
        sourceValue={() => titleRef.current?.querySelector('input')?.value ?? ''}
        locked={!!course?.isPublished}
        lockWarning="This course is published — its URL is on receipts and shared links. Unlock only if you must."
        hint="Forms the URL: /courses/<slug>"
      />
      <TextAreaField label="Summary" name="summary" defaultValue={course?.summary} required rows={2} />

      <div className="grid gap-x-4 sm:grid-cols-3">
        <NumberField
          label="Price (₹)"
          name="priceInRupees"
          defaultValue={course ? Math.round(course.priceInPaise / 100) : undefined}
          required
          min={0}
          step={1}
          hint="Whole rupees. This IS the checkout price."
        />
        <NumberField
          label="Duration (minutes)"
          name="durationMinutes"
          defaultValue={course?.durationMinutes}
          min={0}
          hint="Total course length shown on the sales page."
        />
        <NumberField
          label="Final test pass %"
          name="passThreshold"
          defaultValue={course?.passThreshold ?? 85}
          required
          min={1}
          hint="Default 85. Changing this changes who earns a certificate."
        />
      </div>

      <StringListField
        label="Learning outcomes"
        name="learningOutcomes"
        defaultValue={course?.learningOutcomes}
        hint="Bulleted on the sales page."
      />

      <p className="mb-1.5 text-[14px] font-medium">Description</p>
      <RichTextEditor
        name="description"
        initialValue={course?.description}
        onUploadImage={uploadContentImage}
        minHeight={240}
      />
      <div className="mb-4" />

      <TextField label="SEO title" name="seoTitle" defaultValue={course?.seoTitle} hint="≤70 characters." />
      <TextAreaField label="SEO description" name="seoDescription" defaultValue={course?.seoDescription} rows={2} hint="≤160 characters." />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={course?.isPublished ?? false}
        hint="Unpublished courses are invisible on the site AND unbuyable — checkout refuses them."
      />

      <SaveBar state={state} saveLabel={course ? 'Save course' : 'Create course'} />
    </form>
  )
}
