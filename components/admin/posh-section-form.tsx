"use client";

// CMS migration M4 — POSH Hub section create/edit form.
import { useActionState, useRef } from "react";

import { deleteSection, saveSection } from "@/app/admin/posh-hub/actions";
import {
  CheckboxField,
  HelpIcon,
  SelectField,
  SlugField,
  TextAreaField,
  TextField,
} from "@/components/admin/crud/fields";
import { SaveBar } from "@/components/admin/crud/save-bar";
import { CRUD_IDLE } from "@/components/admin/crud/types";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uploadContentImage } from "@/components/admin/upload-image";
import { POSH_GROUPS } from "@/lib/posh-groups";

export function PoshSectionForm({
  section,
}: {
  section: {
    id: string;
    title: string;
    anchor: string;
    group: string;
    summary: string | null;
    isFaq: boolean;
    body: unknown;
    isPublished: boolean;
  } | null;
}) {
  const [state, formAction] = useActionState(saveSection, CRUD_IDLE);
  const titleRef = useRef<HTMLDivElement>(null);

  return (
    <form action={formAction}>
      {section && <input type="hidden" name="id" value={section.id} />}

      <div ref={titleRef}>
        <TextField
          label="Title"
          name="title"
          defaultValue={section?.title}
          required
          help="The heading for this topic, shown at the top of this section on the /posh-act page and in its table of contents — e.g. 'Who can make a complaint.'"
        />
      </div>
      <SlugField
        label="Anchor"
        name="anchor"
        defaultValue={section?.anchor}
        sourceValue={() =>
          titleRef.current?.querySelector("input")?.value ?? ""
        }
        locked={!!section?.isPublished}
        confirmName="confirmAnchorChange"
        lockWarning="⚠ This anchor is a PERMANENT public link (/posh-act#…) shared in trainings and emails. Changing it breaks every copy of that link, everywhere, forever. Unlock only if you truly must."
        hint="Deep-link id on /posh-act — e.g. ic-constitution."
        help="The permanent web address for this exact section — people bookmark and share links like /posh-act#this-anchor. It's suggested from the title, but you can edit it before first publishing. Once the section is live, treat this as fixed forever."
      />
      <SelectField
        label="Group"
        name="group"
        defaultValue={section?.group ?? POSH_GROUPS[0]}
        options={POSH_GROUPS.map((g) => ({ value: g, label: g }))}
        hint="Which of the 11 Knowledge Hub groups this section belongs to. Moving group appends it at that group's end."
        help="Which part of the guide this section lives under — e.g. Compliance, Internal Committee, Complaints. This decides where it appears in the table of contents and the reading order on /posh-act."
      />
      <TextAreaField
        label="Summary"
        name="summary"
        defaultValue={section?.summary}
        rows={2}
        hint="One or two sentences shown under the heading and used by search engines."
        help="A short description shown under the heading and picked up by Google. Helps someone scanning the page — or a search result — tell at a glance whether this section answers their question."
      />
      <CheckboxField
        label="FAQ-style section"
        name="isFaq"
        defaultChecked={section?.isFaq ?? false}
        hint="Marks this section as a question-and-answer entry for FAQ schema markup."
        help="Tick this if the title is phrased as a direct question with a clear answer (e.g. 'Is home a workplace?'). It tells search engines to treat it as an FAQ, which can make it show up directly inside a Google search result, not just as a link."
      />

      <div className="mb-1.5 flex items-center gap-1.5">
        <p className="text-[14px] font-medium">Body</p>
        <HelpIcon text="The full explanation for this topic — the actual content people read. Use the toolbar for headings, lists, callout boxes and tables." />
      </div>
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
        help="When off, this section is a draft — not shown on /posh-act at all. Switch it on to make it live. You can also flip this from the POSH Hub list without opening this form."
      />

      <SaveBar
        state={state}
        saveLabel={section ? "Save changes" : "Create section"}
        onDelete={section ? deleteSection.bind(null, section.id) : undefined}
      />
    </form>
  );
}
