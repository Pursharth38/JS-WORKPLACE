'use client'

// CMS migration M2 — Testimonial create/edit form.
import { useActionState } from 'react'

import { deleteTestimonial, saveTestimonial } from '@/app/admin/testimonials/actions'
import { CheckboxField, TextAreaField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'

export function TestimonialForm({
  testimonial,
}: {
  testimonial: {
    id: string
    quote: string
    authorName: string
    authorRole: string | null
    organization: string | null
    consentOnFile: boolean
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveTestimonial, CRUD_IDLE)

  return (
    <form action={formAction}>
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}

      <TextAreaField
        label="Quote"
        name="quote"
        defaultValue={testimonial?.quote}
        required
        rows={4}
        hint="The person's words, verbatim. Never edit a quote beyond trimming."
      />
      <TextField label="Author name" name="authorName" defaultValue={testimonial?.authorName} required />
      <TextField label="Author role" name="authorRole" defaultValue={testimonial?.authorRole} />
      <TextField label="Organisation" name="organization" defaultValue={testimonial?.organization} />

      {/* The rule that doesn't relax because the editing surface changed. */}
      <CheckboxField
        label="Written permission to publish this testimonial is on file"
        name="consentOnFile"
        defaultChecked={testimonial?.consentOnFile ?? false}
        required
        hint="Required. A testimonial cannot be saved, let alone published, without the author's written consent."
      />
      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={testimonial?.isPublished ?? true}
      />

      <SaveBar
        state={state}
        saveLabel={testimonial ? 'Save changes' : 'Create testimonial'}
        onDelete={testimonial ? deleteTestimonial.bind(null, testimonial.id) : undefined}
      />
    </form>
  )
}
