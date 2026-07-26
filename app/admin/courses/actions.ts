'use server'

// ─────────────────────────────────────────────────────────────────────────────
// CMS migration M5 — Course / Chapter / Module / Question CRUD.
//
// HIGHEST-RISK admin surface: Course carries priceInPaise (the checkout price
// authority) and Module carries videoUid (the gated Stream UID). Both are
// legitimately the owner's to edit — from THIS authenticated, ADMIN-only
// surface. What must never happen is either value leaking through a public
// getter; that is lib/content/courses.ts's select discipline, not this file's.
//
// Questions: `options` is {id, text, isCorrect}[]. The single-question edit
// form (server-rendered, admin-authenticated) is the only surface that renders
// isCorrect. List views show counts, never answers.
// ─────────────────────────────────────────────────────────────────────────────
import { Prisma } from '@prisma/client'
import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import type { CrudState } from '@/components/admin/crud/types'
import { checkbox, computeSwap, jsonField, lines, optStr, reqStr } from '@/lib/admin-content'
import { db } from '@/lib/db'
import { richTextSchema } from '@/lib/richtext'
import { TAGS } from '@/lib/sanity'
import { requireAdmin } from '@/lib/session'

function bust(courseId?: string) {
  updateTag(TAGS.course)
  revalidatePath('/admin/courses')
  if (courseId) revalidatePath(`/admin/courses/${courseId}`)
}

/* ── Course ───────────────────────────────────────────────────────────────── */

const courseSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(96),
  summary: z.string().trim().min(10).max(500),
  priceInRupees: z.number().int().min(0).max(10_00_000),
  durationMinutes: z.number().int().min(0).max(10_000).nullable(),
  passThreshold: z.number().int().min(1).max(100),
  learningOutcomes: z.array(z.string().max(300)).max(20),
  description: richTextSchema.nullable(),
  seoTitle: z.string().trim().max(70).nullable(),
  seoDescription: z.string().trim().max(160).nullable(),
  isPublished: z.boolean(),
})

export async function saveCourse(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const priceRaw = Number.parseInt(reqStr(fd, 'priceInRupees'), 10)
  const durationRaw = optStr(fd, 'durationMinutes')
  const thresholdRaw = Number.parseInt(reqStr(fd, 'passThreshold'), 10)

  const parsed = courseSchema.safeParse({
    title: reqStr(fd, 'title'),
    slug: reqStr(fd, 'slug'),
    summary: reqStr(fd, 'summary'),
    priceInRupees: Number.isFinite(priceRaw) ? priceRaw : -1,
    durationMinutes: durationRaw ? Number.parseInt(durationRaw, 10) : null,
    passThreshold: Number.isFinite(thresholdRaw) ? thresholdRaw : 85,
    learningOutcomes: lines(fd, 'learningOutcomes'),
    description: jsonField(fd, 'description'),
    seoTitle: optStr(fd, 'seoTitle'),
    seoDescription: optStr(fd, 'seoDescription'),
    isPublished: checkbox(fd, 'isPublished'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { status: 'error', message: first?.message ?? 'Check the form and try again.' }
  }

  const { priceInRupees, description, ...rest } = parsed.data
  const data = {
    ...rest,
    // Money is integer paise everywhere — the admin edits rupees, the row
    // stores paise, checkout keeps reading the same authoritative column.
    priceInPaise: priceInRupees * 100,
    description: description ?? Prisma.JsonNull,
  }

  try {
    if (id) {
      await db.course.update({ where: { id }, data })
      bust(id)
      return { status: 'success', message: 'Saved.' }
    }
    const created = await db.course.create({ data })
    bust(created.id)
    redirect(`/admin/courses/${created.id}`)
  } catch (err) {
    if (isRedirect(err)) throw err
    if (isUniqueViolation(err)) {
      return { status: 'error', message: 'That slug is already used by another course.' }
    }
    console.error('[admin:course:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
  return { status: 'success', message: 'Saved.' }
}

/* ── Chapter ──────────────────────────────────────────────────────────────── */

const chapterSchema = z.object({
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(500).nullable(),
  passThreshold: z.number().int().min(1).max(100),
})

export async function saveChapter(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const courseId = reqStr(fd, 'courseId')
  const thresholdRaw = Number.parseInt(reqStr(fd, 'passThreshold') || '80', 10)

  const parsed = chapterSchema.safeParse({
    title: reqStr(fd, 'title'),
    summary: optStr(fd, 'summary'),
    passThreshold: Number.isFinite(thresholdRaw) ? thresholdRaw : 80,
  })
  if (!parsed.success) return { status: 'error', message: 'Give the chapter a title.' }

  try {
    if (id) {
      await db.chapter.update({ where: { id }, data: parsed.data })
    } else {
      const max = await db.chapter.aggregate({ where: { courseId }, _max: { order: true } })
      await db.chapter.create({
        data: { ...parsed.data, courseId, order: (max._max.order ?? 0) + 1 },
      })
    }
  } catch (err) {
    console.error('[admin:chapter:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust(courseId)
  revalidatePath(`/admin/courses/${courseId}/${id ?? ''}`)
  return { status: 'success', message: 'Saved.' }
}

export async function deleteChapter(courseId: string, id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    // Refuse while learners have attempts against it — history must survive.
    const attempts = await db.assessmentAttempt.count({ where: { chapterId: id } })
    if (attempts > 0) {
      console.warn('[admin:chapter:delete] refused — attempts exist', { id })
      return
    }
    await db.chapter.delete({ where: { id } })
    bust(courseId)
  } catch (err) {
    console.error('[admin:chapter:delete]', err)
  }
  redirect(`/admin/courses/${courseId}`)
}

export async function moveChapter(courseId: string, id: string, direction: 'up' | 'down'): Promise<void> {
  if (!(await requireAdmin())) return
  const rows = await db.chapter.findMany({ where: { courseId }, select: { id: true, order: true } })
  const swap = computeSwap(rows, id, direction)
  if (!swap) return

  // Two-phase swap: (courseId, order) carries a unique constraint, so a direct
  // swap collides mid-transaction. Park one row at a temporary order first.
  await db.$transaction([
    db.chapter.update({ where: { id: swap.a.id }, data: { order: -1 } }),
    db.chapter.update({ where: { id: swap.b.id }, data: { order: swap.b.order } }),
    db.chapter.update({ where: { id: swap.a.id }, data: { order: swap.a.order } }),
  ])
  bust(courseId)
}

/* ── Module ───────────────────────────────────────────────────────────────── */

const moduleSchema = z.object({
  title: z.string().trim().min(2).max(200),
  videoUid: z.string().trim().min(8).max(64),
  durationSeconds: z.number().int().min(1).max(4 * 60 * 60),
  isFreePreview: z.boolean(),
  notes: richTextSchema.nullable(),
})

export async function saveModule(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const chapterId = reqStr(fd, 'chapterId')
  const courseId = reqStr(fd, 'courseId')
  const durationRaw = Number.parseInt(reqStr(fd, 'durationSeconds'), 10)

  const parsed = moduleSchema.safeParse({
    title: reqStr(fd, 'title'),
    videoUid: reqStr(fd, 'videoUid'),
    durationSeconds: Number.isFinite(durationRaw) ? durationRaw : 0,
    isFreePreview: checkbox(fd, 'isFreePreview'),
    notes: jsonField(fd, 'notes'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      status: 'error',
      message: first?.message ?? 'Title, Stream video UID and duration are required.',
    }
  }

  const { notes, ...rest } = parsed.data
  const data = { ...rest, notes: notes ?? Prisma.JsonNull }

  try {
    if (id) {
      await db.module.update({ where: { id }, data })
    } else {
      const max = await db.module.aggregate({ where: { chapterId }, _max: { order: true } })
      await db.module.create({ data: { ...data, chapterId, order: (max._max.order ?? 0) + 1 } })
    }
  } catch (err) {
    console.error('[admin:module:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust(courseId)
  revalidatePath(`/admin/courses/${courseId}/${chapterId}`)
  return { status: 'success', message: 'Saved.' }
}

export async function deleteModule(courseId: string, chapterId: string, id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    const progress = await db.moduleProgress.count({ where: { moduleId: id } })
    if (progress > 0) {
      console.warn('[admin:module:delete] refused — learner progress exists', { id })
      return
    }
    await db.module.delete({ where: { id } })
    bust(courseId)
    revalidatePath(`/admin/courses/${courseId}/${chapterId}`)
  } catch (err) {
    console.error('[admin:module:delete]', err)
  }
  redirect(`/admin/courses/${courseId}/${chapterId}`)
}

export async function moveModule(
  courseId: string,
  chapterId: string,
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  if (!(await requireAdmin())) return
  const rows = await db.module.findMany({ where: { chapterId }, select: { id: true, order: true } })
  const swap = computeSwap(rows, id, direction)
  if (!swap) return

  await db.$transaction([
    db.module.update({ where: { id: swap.a.id }, data: { order: -1 } }),
    db.module.update({ where: { id: swap.b.id }, data: { order: swap.b.order } }),
    db.module.update({ where: { id: swap.a.id }, data: { order: swap.a.order } }),
  ])
  bust(courseId)
  revalidatePath(`/admin/courses/${courseId}/${chapterId}`)
}

/* ── Question ─────────────────────────────────────────────────────────────── */

const optionSchema = z.object({
  id: z.string().min(1).max(10),
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
})

const questionSchema = z.object({
  text: z.string().trim().min(5).max(1000),
  topic: z.string().trim().min(2).max(100),
  explanation: z.string().trim().max(1000).nullable(),
  options: z
    .array(optionSchema)
    .min(2, 'At least two options')
    .max(6)
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: 'Exactly one option must be marked correct',
    }),
  isActive: z.boolean(),
})

export async function saveQuestion(_prev: CrudState, fd: FormData): Promise<CrudState> {
  if (!(await requireAdmin())) return { status: 'error', message: 'Not authorised.' }

  const id = optStr(fd, 'id')
  const chapterId = reqStr(fd, 'chapterId')
  const courseId = reqStr(fd, 'courseId')

  const parsed = questionSchema.safeParse({
    text: reqStr(fd, 'text'),
    topic: reqStr(fd, 'topic'),
    explanation: optStr(fd, 'explanation'),
    options: jsonField(fd, 'options'),
    isActive: checkbox(fd, 'isActive'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { status: 'error', message: first?.message ?? 'Check the question and its options.' }
  }

  try {
    if (id) {
      await db.question.update({ where: { id }, data: parsed.data })
    } else {
      await db.question.create({ data: { ...parsed.data, chapterId } })
    }
  } catch (err) {
    console.error('[admin:question:save]', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  bust(courseId)
  revalidatePath(`/admin/courses/${courseId}/${chapterId}`)
  redirect(`/admin/courses/${courseId}/${chapterId}`)
}

export async function deleteQuestion(courseId: string, chapterId: string, id: string): Promise<void> {
  if (!(await requireAdmin())) return
  try {
    // Retire, don't delete: past attempts reference question ids in their
    // answers JSON. isActive=false removes it from future draws while keeping
    // history interpretable.
    await db.question.update({ where: { id }, data: { isActive: false } })
    bust(courseId)
  } catch (err) {
    console.error('[admin:question:retire]', err)
  }
  redirect(`/admin/courses/${courseId}/${chapterId}`)
}

/* ── shared ───────────────────────────────────────────────────────────────── */

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002'
}

/** next/navigation redirect() throws a control-flow error we must re-throw. */
function isRedirect(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    String((err as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
  )
}
