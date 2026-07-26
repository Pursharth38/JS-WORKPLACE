'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M5 — assessment question editor.
//
// This form is the ONE surface that renders isCorrect: server-rendered, behind
// requireAdmin, for the person who authors the answer key. List views show
// counts only. The learner-facing /api/assessment/start strips correctness
// before serialization — that discipline is unchanged by the CMS migration.
// ─────────────────────────────────────────────────────────────────────────────
import { useActionState, useState } from 'react'

import { deleteQuestion, saveQuestion } from '@/app/admin/courses/actions'
import { CheckboxField, TextAreaField, TextField } from '@/components/admin/crud/fields'
import { SaveBar } from '@/components/admin/crud/save-bar'
import { CRUD_IDLE } from '@/components/admin/crud/types'

type Option = { id: string; text: string; isCorrect: boolean }

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f']

export function QuestionForm({
  courseId,
  chapterId,
  question,
}: {
  courseId: string
  chapterId: string
  question: {
    id: string
    text: string
    topic: string
    explanation: string | null
    options: Option[]
    isActive: boolean
  } | null
}) {
  const [state, formAction] = useActionState(saveQuestion, CRUD_IDLE)
  const [options, setOptions] = useState<Option[]>(
    question?.options ?? [
      { id: 'a', text: '', isCorrect: true },
      { id: 'b', text: '', isCorrect: false },
      { id: 'c', text: '', isCorrect: false },
      { id: 'd', text: '', isCorrect: false },
    ],
  )

  const setText = (i: number, text: string) =>
    setOptions(options.map((o, idx) => (idx === i ? { ...o, text } : o)))
  const setCorrect = (i: number) =>
    setOptions(options.map((o, idx) => ({ ...o, isCorrect: idx === i })))
  const addOption = () => {
    if (options.length >= 6) return
    const used = new Set(options.map((o) => o.id))
    const nextId = OPTION_IDS.find((c) => !used.has(c)) ?? `x${options.length}`
    setOptions([...options, { id: nextId, text: '', isCorrect: false }])
  }
  const removeOption = (i: number) => {
    if (options.length <= 2) return
    const next = options.filter((_, idx) => idx !== i)
    // Never leave the set without a correct answer.
    if (!next.some((o) => o.isCorrect) && next[0]) next[0].isCorrect = true
    setOptions([...next])
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="chapterId" value={chapterId} />
      {question && <input type="hidden" name="id" value={question.id} />}
      <input
        type="hidden"
        name="options"
        value={JSON.stringify(options.filter((o) => o.text.trim() !== ''))}
      />

      <TextAreaField label="Question" name="text" defaultValue={question?.text} required rows={3} />
      <TextField
        label="Topic"
        name="topic"
        defaultValue={question?.topic}
        required
        hint='Drives the "areas to review" feedback after an attempt — e.g. "IC composition".'
      />

      <fieldset className="mb-4">
        <legend className="mb-1.5 text-[14px] font-medium">
          Options <span className="font-normal text-[var(--brand-muted)]">— pick the correct one</span>
        </legend>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="__correct" // presentation only; the hidden JSON carries truth
                checked={o.isCorrect}
                onChange={() => setCorrect(i)}
                aria-label={`Mark option ${o.id.toUpperCase()} correct`}
                className="h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
              />
              <span className="w-5 text-[13px] font-semibold text-[var(--brand-muted)]">
                {o.id.toUpperCase()}
              </span>
              <input
                value={o.text}
                onChange={(e) => setText(i, e.target.value)}
                placeholder={`Option ${o.id.toUpperCase()}`}
                aria-label={`Option ${o.id.toUpperCase()} text`}
                className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-3 py-2 text-[15px] outline-none focus:border-[var(--brand-primary)]"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={options.length <= 2}
                aria-label={`Remove option ${o.id.toUpperCase()}`}
                className="rounded border border-[var(--brand-line)] px-2 py-1 text-[13px] text-[var(--brand-muted)] hover:bg-[var(--brand-line)] disabled:opacity-30"
              >
                −
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 6}
          className="mt-2 rounded border border-[var(--brand-line)] px-3 py-1 text-[13px] text-[var(--brand-muted)] hover:bg-[var(--brand-line)] disabled:opacity-30"
        >
          + option
        </button>
      </fieldset>

      <TextAreaField
        label="Explanation"
        name="explanation"
        defaultValue={question?.explanation}
        rows={2}
        hint="Internal note about why the answer is what it is. Never shown to learners."
      />
      <CheckboxField
        label="Active — drawn into assessments"
        name="isActive"
        defaultChecked={question?.isActive ?? true}
        hint="Untick to retire a question without losing past attempts' history."
      />

      <SaveBar
        state={state}
        saveLabel={question ? 'Save question' : 'Add question'}
        onDelete={question ? deleteQuestion.bind(null, courseId, chapterId, question.id) : undefined}
        deleteLabel="Retire"
      />
    </form>
  )
}
