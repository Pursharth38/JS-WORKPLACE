'use client'

// CMS migration M4 — CTA band create/edit form.
import { useActionState } from 'react'

import { deleteCtaBand, saveCtaBand } from '@/app/admin/cta-bands/actions'
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'
import { POSH_GROUPS } from '@/lib/posh-groups'

export function CtaBandForm({
  band,
}: {
  band: {
    id: string
    heading: string
    body: string | null
    buttonLabel: string
    buttonHref: string
    afterGroup: string | null
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveCtaBand, CRUD_IDLE)

  return (
    <form action={formAction}>
      {band && <input type="hidden" name="id" value={band.id} />}

      <TextField label="Heading" name="heading" defaultValue={band?.heading} required />
      <TextAreaField label="Supporting line" name="body" defaultValue={band?.body} rows={2} />
      <TextField label="Button label" name="buttonLabel" defaultValue={band?.buttonLabel} required />
      <TextField
        label="Button link"
        name="buttonHref"
        defaultValue={band?.buttonHref}
        required
        hint="e.g. /book-demo or /posh-compliance-check"
      />
      <SelectField
        label="Appears after group"
        name="afterGroup"
        defaultValue={band?.afterGroup ?? ''}
        options={[
          { value: '', label: '— Not placed on /posh-act —' },
          ...POSH_GROUPS.map((g) => ({ value: g, label: g })),
        ]}
        hint="Renders between hub groups on /posh-act. A band without a placement is kept but not shown."
      />
      <CheckboxField label="Published" name="isPublished" defaultChecked={band?.isPublished ?? true} />

      <SaveBar
        state={state}
        saveLabel={band ? 'Save changes' : 'Create band'}
        onDelete={band ? deleteCtaBand.bind(null, band.id) : undefined}
      />
    </form>
  )
}
