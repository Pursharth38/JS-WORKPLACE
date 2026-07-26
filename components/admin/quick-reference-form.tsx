"use client";

// CMS migration M4 — IC Quick Reference create/edit form.
import { useActionState, useRef } from "react";

import {
  deleteQuickReference,
  saveQuickReference,
} from "@/app/admin/ic-reference/actions";
import {
  CheckboxField,
  HelpIcon,
  SlugField,
  TextAreaField,
  TextField,
} from "@/components/admin/crud/fields";
import { SaveBar } from "@/components/admin/crud/save-bar";
import { CRUD_IDLE } from "@/components/admin/crud/types";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uploadContentImage } from "@/components/admin/upload-image";

export function QuickReferenceForm({
  card,
}: {
  card: {
    id: string;
    title: string;
    anchor: string;
    intro: string | null;
    body: unknown;
    isPublished: boolean;
  } | null;
}) {
  const [state, formAction] = useActionState(saveQuickReference, CRUD_IDLE);
  const titleRef = useRef<HTMLDivElement>(null);

  return (
    <form action={formAction}>
      {card && <input type="hidden" name="id" value={card.id} />}

      <div ref={titleRef}>
        <TextField
          label="Title"
          name="title"
          defaultValue={card?.title}
          required
          help="The heading for this reference card, e.g. 'How long does the Committee have to act?' Shown on /ic-quick-reference as a quick-scan cheat-sheet entry."
        />
      </div>
      <SlugField
        label="Anchor"
        name="anchor"
        defaultValue={card?.anchor}
        sourceValue={() =>
          titleRef.current?.querySelector("input")?.value ?? ""
        }
        locked={!!card?.isPublished}
        lockWarning="Published anchors are shared links — changing one breaks them."
        hint="Deep-link id on /ic-quick-reference."
        help="The permanent web address for this card — people can link directly to /ic-quick-reference#this-anchor. Once published, treat it as fixed; changing it breaks any link already shared."
      />
      <TextAreaField
        label="Intro"
        name="intro"
        defaultValue={card?.intro}
        rows={2}
        help="A one-line lead-in shown above the card's main content — optional, use it if the title alone needs a little more context."
      />

      <div className="mb-1.5 flex items-center gap-1.5">
        <p className="text-[14px] font-medium">Body</p>
        <HelpIcon text="The actual reference content — the fact, rule, or timeline this card exists to answer. Keep it short and scannable; this is a quick-reference card, not a full explanation (that belongs in the POSH Hub)." />
      </div>
      <RichTextEditor
        name="body"
        initialValue={card?.body}
        onUploadImage={uploadContentImage}
        minHeight={260}
      />
      <div className="mb-4" />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={card?.isPublished ?? true}
        help="When off, this card is a draft — not shown on /ic-quick-reference. Switch it on to make it live. You can also flip this from the list without opening this form."
      />

      <SaveBar
        state={state}
        saveLabel={card ? "Save changes" : "Create card"}
        onDelete={card ? deleteQuickReference.bind(null, card.id) : undefined}
      />
    </form>
  );
}
