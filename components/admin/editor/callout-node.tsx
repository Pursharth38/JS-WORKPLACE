'use client'

// CMS migration M1c — the editor-side twin of the `calloutBox` rich-text node.
// Same JSON shape as lib/richtext.ts defines: attrs {tone, title}, block content.
import {
  Node,
  mergeAttributes,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'

const TONES = [
  { value: 'info', label: 'Good to know' },
  { value: 'warning', label: 'Important' },
  { value: 'legal', label: 'Legal note' },
] as const

function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const tone = (node.attrs.tone as string) ?? 'info'
  const title = (node.attrs.title as string | null) ?? ''

  const toneClass =
    tone === 'warning'
      ? 'border-[var(--brand-warning)] bg-[var(--brand-warning-soft)]'
      : tone === 'legal'
        ? 'border-[var(--brand-muted)] bg-[var(--brand-line)]'
        : 'border-[var(--brand-primary)] bg-[var(--brand-primary-tint)]'

  return (
    <NodeViewWrapper className={`my-4 rounded-[var(--radius-md)] border-l-4 p-4 ${toneClass}`}>
      {/* contentEditable={false} so typing in the controls never leaks into the doc */}
      <div contentEditable={false} className="mb-2 flex flex-wrap items-center gap-2">
        <select
          value={tone}
          onChange={(e) => updateAttributes({ tone: e.target.value })}
          aria-label="Callout tone"
          className="rounded border border-[var(--brand-line)] bg-white px-2 py-1 text-[13px]"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value || null })}
          placeholder="Optional heading"
          aria-label="Callout heading"
          className="min-w-0 flex-1 rounded border border-[var(--brand-line)] bg-white px-2 py-1 text-[13px]"
        />
      </div>
      <NodeViewContent className="text-[15px] leading-relaxed [&>p]:my-1" />
    </NodeViewWrapper>
  )
}

export const CalloutBoxNode = Node.create({
  name: 'calloutBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      tone: { default: 'info' },
      title: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'aside[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    // Only used for clipboard/HTML export inside the editor — the public site
    // renders from JSON via components/marketing/rich-text.tsx.
    return ['aside', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})
