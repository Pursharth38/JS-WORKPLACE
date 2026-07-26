'use client'

// CMS migration M2 — Instagram grid entry form.
import { useActionState } from 'react'

import { deleteInstagramPost, saveInstagramPost } from '@/app/admin/instagram/actions'
import { CheckboxField, TextAreaField, TextField } from '@/components/admin/crud/fields'
import { ImageField } from '@/components/admin/crud/image-field'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'

export function InstagramForm({
  post,
}: {
  post: {
    id: string
    imageKey: string
    permalink: string
    caption: string
    isPublished: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveInstagramPost, CRUD_IDLE)

  return (
    <form action={formAction}>
      {post && <input type="hidden" name="id" value={post.id} />}

      <ImageField
        label="Image"
        name="imageKey"
        defaultKey={post?.imageKey}
        required
        hint="Square works best — the grid crops to 1:1. Download the image from the Instagram post and upload it here."
      />
      <TextField
        label="Post URL"
        name="permalink"
        defaultValue={post?.permalink}
        required
        placeholder="https://www.instagram.com/p/…"
        hint="Where the tile links to."
      />
      <TextAreaField
        label="Caption"
        name="caption"
        defaultValue={post?.caption}
        required
        rows={2}
        hint="Used as the image's alt text — describe what's in the picture."
      />
      <CheckboxField label="Published" name="isPublished" defaultChecked={post?.isPublished ?? true} />

      <SaveBar
        state={state}
        saveLabel={post ? 'Save changes' : 'Add to grid'}
        onDelete={post ? deleteInstagramPost.bind(null, post.id) : undefined}
      />
    </form>
  )
}
