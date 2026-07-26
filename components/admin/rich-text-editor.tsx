'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M1c — the Tiptap editor every admin content form embeds.
//
// Contract with the server side:
//   · Emits exactly the vocabulary lib/richtext.ts validates — StarterKit is
//     configured DOWN to it (no code blocks, no strike/underline/hr, headings
//     2–4 only) plus the two custom nodes (calloutBox, dataTable).
//   · The current document rides in a <input type="hidden" name={name}> as a
//     JSON string; the Server Action parses it with parseRichText, which is
//     the real gate — nothing this component does is trusted.
//
// Image uploads go through the onUploadImage prop (wired to /api/admin/upload
// in M1d); the editor itself never talks to the network.
// ─────────────────────────────────────────────────────────────────────────────
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { useCallback, useRef, useState } from 'react'

import { EMPTY_DOC, isSafeHref, safeParseRichText } from '@/lib/richtext'
import { CalloutBoxNode } from './editor/callout-node'
import { DataTableNode } from './editor/data-table-node'

/* ── Toolbar chrome ───────────────────────────────────────────────────────── */

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection alive
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`rounded px-2 py-1 text-[13px] font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'bg-[var(--brand-primary)] text-white'
          : 'text-[var(--brand-ink)] hover:bg-[var(--brand-line)]'
      }`}
    >
      {children}
    </button>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-[var(--brand-line)]" />

/* ── Link + image input rows (no browser dialogs — they block automation and
     screen readers alike) ─────────────────────────────────────────────────── */

function LinkRow({
  editor,
  onClose,
}: {
  editor: Editor
  onClose: () => void
}) {
  const [href, setHref] = useState<string>(editor.getAttributes('link').href ?? '')
  const [error, setError] = useState<string | null>(null)

  const apply = () => {
    const trimmed = href.trim()
    if (trimmed === '') {
      editor.chain().focus().unsetLink().run()
      onClose()
      return
    }
    if (!isSafeHref(trimmed)) {
      setError('Use https://, mailto:, tel: or a path starting with /')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
    onClose()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--brand-line)] bg-[var(--brand-sand)] px-2 py-1.5">
      <input
        autoFocus
        value={href}
        onChange={(e) => {
          setHref(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            apply()
          }
          if (e.key === 'Escape') onClose()
        }}
        placeholder="https://…  or  /posh-act#anchor"
        aria-label="Link destination"
        className="min-w-0 flex-1 rounded border border-[var(--brand-line)] bg-white px-2 py-1 text-[13px]"
      />
      <button type="button" onClick={apply} className="rounded bg-[var(--brand-primary)] px-3 py-1 text-[13px] font-medium text-white">
        Apply
      </button>
      <button type="button" onClick={onClose} className="px-2 py-1 text-[13px] text-[var(--brand-muted)]">
        Cancel
      </button>
      {error && (
        <p role="alert" className="w-full text-[12px] text-[var(--brand-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

/* ── The editor ───────────────────────────────────────────────────────────── */

export function RichTextEditor({
  name,
  initialValue,
  onUploadImage,
  minHeight = 260,
}: {
  /** Hidden-input name the parent <form> reads the JSON document from. */
  name: string
  /** Stored document (unknown — re-validated) or null for a fresh one. */
  initialValue?: unknown
  /** Uploads a file and resolves to its public src, or null on failure (M1d). */
  onUploadImage?: (file: File) => Promise<string | null>
  minHeight?: number
}) {
  const [json, setJson] = useState<string>(() =>
    JSON.stringify(
      (initialValue && safeParseRichText(initialValue)) || EMPTY_DOC,
    ),
  )
  const [showLinkRow, setShowLinkRow] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false, // SSR-safe under the App Router
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      TiptapImage.configure({ allowBase64: false }),
      CalloutBoxNode,
      DataTableNode,
    ],
    content: (initialValue && safeParseRichText(initialValue)) || EMPTY_DOC,
    editorProps: {
      attributes: {
        // Typography loosely mirrors the public RichText renderer so the
        // author sees roughly what readers get.
        class:
          'focus:outline-none px-4 py-3 text-[15px] leading-[1.7] ' +
          '[&_h2]:font-serif [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:mt-6 ' +
          '[&_h3]:font-serif [&_h3]:text-[19px] [&_h3]:font-semibold [&_h3]:mt-4 ' +
          '[&_h4]:font-serif [&_h4]:text-[16px] [&_h4]:font-semibold [&_h4]:mt-3 ' +
          '[&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 ' +
          '[&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic ' +
          '[&_a]:text-[var(--brand-primary)] [&_a]:underline ' +
          '[&_img]:max-w-full [&_img]:rounded-[var(--radius-md)]',
      },
    },
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
  })

  const pickImage = useCallback(() => fileRef.current?.click(), [])

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = '' // allow re-selecting the same file
      if (!file || !editor || !onUploadImage) return

      setUploading(true)
      setUploadError(null)
      try {
        const src = await onUploadImage(file)
        if (src) {
          const alt = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')
          editor.chain().focus().setImage({ src, alt }).run()
        } else {
          setUploadError('Upload failed — check the file type and size, then try again.')
        }
      } catch {
        setUploadError('Upload failed — check your connection and try again.')
      } finally {
        setUploading(false)
      }
    },
    [editor, onUploadImage],
  )

  if (!editor) {
    return (
      <div
        className="animate-pulse rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-[var(--brand-sand)]"
        style={{ minHeight }}
        aria-hidden
      />
    )
  }

  const insertTable = () =>
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'dataTable',
        attrs: { caption: null, headers: ['Column 1', 'Column 2'], rows: [['', '']] },
      })
      .run()

  const toggleCallout = () => {
    if (editor.isActive('calloutBox')) {
      editor.chain().focus().lift('calloutBox').run()
    } else {
      editor.chain().focus().wrapIn('calloutBox', { tone: 'info', title: null }).run()
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--brand-line)] bg-white">
      {/* The document, for the parent form's Server Action. */}
      <input type="hidden" name={name} value={json} />

      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-[var(--brand-line)] px-2 py-1.5"
      >
        <ToolButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolButton>
        <ToolButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolButton>
        <ToolButton label="Heading 4" active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
          H4
        </ToolButton>
        <Divider />
        <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolButton>
        <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolButton>
        <ToolButton label={editor.isActive('link') ? 'Edit link' : 'Add link'} active={editor.isActive('link')} onClick={() => setShowLinkRow((v) => !v)}>
          Link
        </ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolButton>
        <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolButton>
        <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;&rdquo;
        </ToolButton>
        <Divider />
        <ToolButton label="Highlighted box" active={editor.isActive('calloutBox')} onClick={toggleCallout}>
          Callout
        </ToolButton>
        <ToolButton label="Insert table" onClick={insertTable}>
          Table
        </ToolButton>
        {onUploadImage && (
          <ToolButton label="Insert image" disabled={uploading} onClick={pickImage}>
            {uploading ? 'Uploading…' : 'Image'}
          </ToolButton>
        )}
        <Divider />
        <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          ↺
        </ToolButton>
        <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          ↻
        </ToolButton>
      </div>

      {showLinkRow && <LinkRow editor={editor} onClose={() => setShowLinkRow(false)} />}

      {uploadError && (
        <p role="alert" className="border-b border-[var(--brand-line)] px-3 py-1.5 text-[13px] text-[var(--brand-danger)]">
          {uploadError}
        </p>
      )}

      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  )
}
