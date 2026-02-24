import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types'
import { sanitizeInput } from '@/lib/utils'

export function validateCreateTask(body: unknown): { data: CreateTaskInput; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Ungültiger Request-Body' }
  }

  const input = body as Record<string, unknown>

  if (!input.title || typeof input.title !== 'string') {
    return { data: null, error: 'Titel ist erforderlich' }
  }

  const title = sanitizeInput(input.title)
  if (title.length === 0) {
    return { data: null, error: 'Titel darf nicht leer sein' }
  }
  if (title.length > 500) {
    return { data: null, error: 'Titel darf maximal 500 Zeichen lang sein' }
  }

  const validPriorities = ['high', 'medium', 'low']
  if (input.priority && !validPriorities.includes(input.priority as string)) {
    return { data: null, error: 'Ungültige Priorität' }
  }

  const validRecurring = ['daily', 'weekly', 'custom', null, undefined]
  if (!validRecurring.includes(input.recurring as string | null | undefined)) {
    return { data: null, error: 'Ungültiger Wiederholungstyp' }
  }

  if (input.due_date && typeof input.due_date === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(input.due_date)) {
      return { data: null, error: 'Ungültiges Datumsformat (erwartet: YYYY-MM-DD)' }
    }
  }

  if (input.due_time && typeof input.due_time === 'string') {
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/
    if (!timeRegex.test(input.due_time)) {
      return { data: null, error: 'Ungültiges Zeitformat (erwartet: HH:MM)' }
    }
  }

  const tags = Array.isArray(input.tags)
    ? (input.tags as string[]).filter((t) => typeof t === 'string').map(sanitizeInput).slice(0, 20)
    : []

  return {
    data: {
      title,
      description: input.description ? sanitizeInput(String(input.description)).slice(0, 5000) : undefined,
      due_date: input.due_date ? String(input.due_date) : undefined,
      due_time: input.due_time ? String(input.due_time) : undefined,
      priority: (input.priority as 'high' | 'medium' | 'low') ?? 'medium',
      tags,
      recurring: (input.recurring as 'daily' | 'weekly' | 'custom' | null) ?? null,
      parent_id: input.parent_id ? String(input.parent_id) : undefined,
    },
    error: null,
  }
}

export function validateUpdateTask(body: unknown): { data: UpdateTaskInput; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Ungültiger Request-Body' }
  }

  const input = body as Record<string, unknown>
  const update: UpdateTaskInput = {}

  if ('title' in input) {
    if (!input.title || typeof input.title !== 'string') {
      return { data: null, error: 'Titel darf nicht leer sein' }
    }
    const title = sanitizeInput(input.title)
    if (title.length === 0 || title.length > 500) {
      return { data: null, error: 'Ungültiger Titel' }
    }
    update.title = title
  }

  if ('completed' in input) {
    if (typeof input.completed !== 'boolean') {
      return { data: null, error: 'completed muss ein Boolean sein' }
    }
    update.completed = input.completed
  }

  if ('priority' in input) {
    const validPriorities = ['high', 'medium', 'low']
    if (!validPriorities.includes(input.priority as string)) {
      return { data: null, error: 'Ungültige Priorität' }
    }
    update.priority = input.priority as 'high' | 'medium' | 'low'
  }

  if ('due_date' in input) {
    if (input.due_date !== null && input.due_date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(String(input.due_date))) {
        return { data: null, error: 'Ungültiges Datumsformat' }
      }
    }
    update.due_date = input.due_date ? String(input.due_date) : undefined
  }

  if ('description' in input) {
    update.description = input.description ? sanitizeInput(String(input.description)).slice(0, 5000) : undefined
  }

  if ('tags' in input) {
    update.tags = Array.isArray(input.tags)
      ? (input.tags as string[]).filter((t) => typeof t === 'string').map(sanitizeInput).slice(0, 20)
      : []
  }

  return { data: update, error: null }
}
