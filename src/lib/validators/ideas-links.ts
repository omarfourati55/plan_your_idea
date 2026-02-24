import type { CreateIdeaInput, UpdateIdeaInput, CreateLinkInput, UpdateLinkInput } from '@/types'
import { sanitizeInput, isValidUrl } from '@/lib/utils'

export function validateCreateIdea(body: unknown): { data: CreateIdeaInput; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Ungültiger Request-Body' }
  }

  const input = body as Record<string, unknown>

  if (!input.title || typeof input.title !== 'string') {
    return { data: null, error: 'Titel ist erforderlich' }
  }

  const title = sanitizeInput(input.title)
  if (title.length === 0 || title.length > 500) {
    return { data: null, error: 'Ungültiger Titel (max. 500 Zeichen)' }
  }

  const validColors = ['default', 'red', 'yellow', 'green', 'blue', 'purple']
  if (input.color && !validColors.includes(input.color as string)) {
    return { data: null, error: 'Ungültige Farbe' }
  }

  const tags = Array.isArray(input.tags)
    ? (input.tags as string[]).filter((t) => typeof t === 'string').map(sanitizeInput).slice(0, 20)
    : []

  return {
    data: {
      title,
      content: input.content ? sanitizeInput(String(input.content)).slice(0, 10000) : '',
      color: (input.color as 'default' | 'red' | 'yellow' | 'green' | 'blue' | 'purple') ?? 'default',
      tags,
    },
    error: null,
  }
}

export function validateUpdateIdea(body: unknown): { data: UpdateIdeaInput; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Ungültiger Request-Body' }
  }

  const input = body as Record<string, unknown>
  const update: UpdateIdeaInput = {}

  if ('title' in input) {
    const title = sanitizeInput(String(input.title))
    if (!title || title.length === 0 || title.length > 500) {
      return { data: null, error: 'Ungültiger Titel' }
    }
    update.title = title
  }

  if ('content' in input) {
    update.content = sanitizeInput(String(input.content ?? '')).slice(0, 10000)
  }

  if ('color' in input) {
    const validColors = ['default', 'red', 'yellow', 'green', 'blue', 'purple']
    if (!validColors.includes(input.color as string)) {
      return { data: null, error: 'Ungültige Farbe' }
    }
    update.color = input.color as 'default' | 'red' | 'yellow' | 'green' | 'blue' | 'purple'
  }

  if ('tags' in input) {
    update.tags = Array.isArray(input.tags)
      ? (input.tags as string[]).filter((t) => typeof t === 'string').map(sanitizeInput).slice(0, 20)
      : []
  }

  return { data: update, error: null }
}

export function validateCreateLink(body: unknown): { data: CreateLinkInput; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Ungültiger Request-Body' }
  }

  const input = body as Record<string, unknown>

  if (!input.url || typeof input.url !== 'string') {
    return { data: null, error: 'URL ist erforderlich' }
  }

  const url = input.url.trim()
  if (!isValidUrl(url)) {
    return { data: null, error: 'Ungültige URL (muss mit http:// oder https:// beginnen)' }
  }

  if (url.length > 2048) {
    return { data: null, error: 'URL ist zu lang (max. 2048 Zeichen)' }
  }

  const tags = Array.isArray(input.tags)
    ? (input.tags as string[]).filter((t) => typeof t === 'string').map(sanitizeInput).slice(0, 20)
    : []

  return { data: { url, tags }, error: null }
}

export function validateUpdateLink(body: unknown): { data: UpdateLinkInput; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Ungültiger Request-Body' }
  }

  const input = body as Record<string, unknown>
  const update: UpdateLinkInput = {}

  if ('status' in input) {
    const validStatuses = ['unread', 'read', 'later']
    if (!validStatuses.includes(input.status as string)) {
      return { data: null, error: 'Ungültiger Status' }
    }
    update.status = input.status as 'unread' | 'read' | 'later'
  }

  if ('title' in input) {
    update.title = sanitizeInput(String(input.title ?? '')).slice(0, 500) || undefined
  }

  if ('description' in input) {
    update.description = sanitizeInput(String(input.description ?? '')).slice(0, 2000) || undefined
  }

  if ('tags' in input) {
    update.tags = Array.isArray(input.tags)
      ? (input.tags as string[]).filter((t) => typeof t === 'string').map(sanitizeInput).slice(0, 20)
      : []
  }

  return { data: update, error: null }
}
