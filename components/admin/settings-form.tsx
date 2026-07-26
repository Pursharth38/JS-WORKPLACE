'use client'

// CMS migration M2 — site settings form (singleton).
import { useActionState } from 'react'

import { saveSettings } from '@/app/admin/settings/actions'
import {
  CheckboxField,
  StringListField,
  TextAreaField,
  TextField,
} from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'

type Settings = {
  businessName: string
  email: string
  phone: string | null
  whatsappNumber: string | null
  whatsappDefaultMessage: string | null
  addressLines: string[]
  linkedinUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
  announcementEnabled: boolean
  announcementText: string | null
  announcementHref: string | null
  heroHeading: string | null
  heroSubheading: string | null
  heroPrimaryCtaLabel: string | null
  heroPrimaryCtaHref: string | null
  legalEntityName: string | null
  gstin: string | null
  supportEmail: string | null
} | null

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-8">
      <legend className="mb-3 text-[17px] font-semibold">{title}</legend>
      {children}
    </fieldset>
  )
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(saveSettings, CRUD_IDLE)

  return (
    <form action={formAction}>
      <Section title="Business">
        <TextField label="Business name" name="businessName" defaultValue={settings?.businessName ?? 'JS Workplace Wellness'} required />
        <TextField label="Contact email" name="email" defaultValue={settings?.email} required />
        <TextField label="Phone" name="phone" defaultValue={settings?.phone} />
        <TextField label="Legal entity name" name="legalEntityName" defaultValue={settings?.legalEntityName} hint="Shown on legal pages and invoices." />
        <TextField label="GSTIN" name="gstin" defaultValue={settings?.gstin} hint="Leave empty unless GST-registered — never a placeholder." />
        <TextField label="Support email" name="supportEmail" defaultValue={settings?.supportEmail} />
        <StringListField label="Address" name="addressLines" defaultValue={settings?.addressLines} rows={3} />
      </Section>

      <Section title="WhatsApp">
        <TextField label="WhatsApp number" name="whatsappNumber" defaultValue={settings?.whatsappNumber} hint="International format, digits only — e.g. 919876543210." />
        <TextAreaField label="Default message" name="whatsappDefaultMessage" defaultValue={settings?.whatsappDefaultMessage} rows={2} hint="Pre-filled when a visitor taps the WhatsApp button." />
      </Section>

      <Section title="Social links">
        <TextField label="LinkedIn URL" name="linkedinUrl" defaultValue={settings?.linkedinUrl} />
        <TextField label="Instagram URL" name="instagramUrl" defaultValue={settings?.instagramUrl} />
        <TextField label="YouTube URL" name="youtubeUrl" defaultValue={settings?.youtubeUrl} />
      </Section>

      <Section title="Announcement bar">
        <CheckboxField label="Show the announcement bar" name="announcementEnabled" defaultChecked={settings?.announcementEnabled ?? false} />
        <TextField label="Announcement text" name="announcementText" defaultValue={settings?.announcementText} />
        <TextField label="Announcement link" name="announcementHref" defaultValue={settings?.announcementHref} />
      </Section>

      <Section title="Home page hero">
        <TextField label="Heading" name="heroHeading" defaultValue={settings?.heroHeading} />
        <TextAreaField label="Subheading" name="heroSubheading" defaultValue={settings?.heroSubheading} rows={2} />
        <TextField label="Primary button label" name="heroPrimaryCtaLabel" defaultValue={settings?.heroPrimaryCtaLabel} />
        <TextField label="Primary button link" name="heroPrimaryCtaHref" defaultValue={settings?.heroPrimaryCtaHref} />
      </Section>

      <SaveBar state={state} saveLabel="Save settings" />
    </form>
  )
}
