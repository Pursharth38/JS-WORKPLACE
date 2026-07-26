"use client";

// CMS migration M2 — Service create/edit form.
import { useActionState, useRef } from "react";

import { deleteService, saveService } from "@/app/admin/services/actions";
import {
  CheckboxField,
  HelpIcon,
  SlugField,
  StringListField,
  TextAreaField,
  TextField,
} from "@/components/admin/crud/fields";
import { SaveBar } from "@/components/admin/crud/save-bar";
import { CRUD_IDLE } from "@/components/admin/crud/types";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uploadContentImage } from "@/components/admin/upload-image";

export function ServiceForm({
  service,
}: {
  service: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    icon: string | null;
    whoItIsFor: string[];
    whatIsCovered: string[];
    format: string | null;
    body: unknown;
    seoTitle: string | null;
    seoDescription: string | null;
    isPublished: boolean;
  } | null;
}) {
  const [state, formAction] = useActionState(saveService, CRUD_IDLE);
  const titleRef = useRef<HTMLDivElement>(null);

  return (
    <form action={formAction}>
      {service && <input type="hidden" name="id" value={service.id} />}

      <div ref={titleRef}>
        <TextField
          label="Title"
          name="title"
          defaultValue={service?.title}
          required
          help="The service name — shown as the heading on its own page and in the services grid, e.g. 'POSH Awareness Sessions.'"
        />
      </div>
      <SlugField
        name="slug"
        defaultValue={service?.slug}
        sourceValue={() =>
          titleRef.current?.querySelector("input")?.value ?? ""
        }
        locked={!!service}
        lockWarning="Changing a slug breaks the service's URL anywhere it has been shared. Unlock only if you are sure."
        hint="Forms the URL: /services/<slug>"
        help="The last part of the web address, e.g. /services/your-slug-here. Changing it after the service is live breaks any link, booking page, or bookmark pointing to it."
      />
      <TextAreaField
        label="Summary"
        name="summary"
        defaultValue={service?.summary}
        required
        rows={2}
        help="A one- or two-sentence description shown on the services grid, before someone clicks through to read the full page."
      />
      <TextField
        label="Icon"
        name="icon"
        defaultValue={service?.icon}
        hint="Lucide icon name used on the services grid (e.g. shield-check)."
        help="Picks the small icon shown next to this service on the grid. Type the exact name from the Lucide icon set — browse lucide.dev/icons to find one and copy its name spelled exactly as shown there."
      />
      <StringListField
        label="Who it's for"
        name="whoItIsFor"
        defaultValue={service?.whoItIsFor}
        help="Who should book this — one short line each, e.g. 'Companies setting up their first Internal Committee.' Shown as a bulleted list on the service's own page, so someone can tell at a glance if it's relevant to them."
      />
      <StringListField
        label="What's covered"
        name="whatIsCovered"
        defaultValue={service?.whatIsCovered}
        help="What's actually included, one line each — the specifics someone would want to know before enquiring, e.g. 'Policy drafting' or 'Post-session certificate for attendees.'"
      />
      <TextField
        label="Format"
        name="format"
        defaultValue={service?.format}
        hint="e.g. Half-day workshop, on-site or remote"
        help="How the service is delivered, in a few words — shown as a quick fact on the service page."
      />

      <div className="mb-1.5 flex items-center gap-1.5">
        <p className="text-[14px] font-medium">Detailed description</p>
        <HelpIcon text="The full write-up on this service's own page, below the summary. Use the toolbar for headings, lists, and callout boxes — this is where you go into real detail." />
      </div>
      <RichTextEditor
        name="body"
        initialValue={service?.body}
        onUploadImage={uploadContentImage}
        minHeight={220}
      />
      <div className="mb-4" />

      <TextField
        label="SEO title"
        name="seoTitle"
        defaultValue={service?.seoTitle}
        hint="≤70 characters."
        help="What shows as the blue clickable headline in Google search results, if you want it different from the Title above. Leave blank to just reuse the Title."
      />
      <TextAreaField
        label="SEO description"
        name="seoDescription"
        defaultValue={service?.seoDescription}
        rows={2}
        hint="≤160 characters."
        help="The short grey summary shown under the title in Google search results. Leave blank and Google will pick a snippet from the page itself."
      />

      <CheckboxField
        label="Published"
        name="isPublished"
        defaultChecked={service?.isPublished ?? true}
        help="When off, this service is a draft — hidden from the grid and not reachable at its own URL. Switch it on to make it live. You can also flip this from the services list without opening this form."
      />

      <SaveBar
        state={state}
        saveLabel={service ? "Save changes" : "Create service"}
        onDelete={service ? deleteService.bind(null, service.id) : undefined}
      />
    </form>
  );
}
