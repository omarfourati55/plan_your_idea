import { describe, it, expect } from 'vitest'
import {
  validateCreateIdea,
  validateUpdateIdea,
  validateCreateLink,
  validateUpdateLink,
} from '@/lib/validators/ideas-links'

describe('validateCreateIdea', () => {
  it('validates a valid idea', () => {
    const result = validateCreateIdea({
      title: 'Startup Idee',
      content: 'Eine tolle App bauen',
      color: 'blue',
      tags: ['business'],
    })
    expect(result.error).toBeNull()
    expect(result.data!.title).toBe('Startup Idee')
    expect(result.data!.color).toBe('blue')
  })

  it('requires title', () => {
    expect(validateCreateIdea({}).error).not.toBeNull()
    expect(validateCreateIdea({ title: '' }).error).not.toBeNull()
  })

  it('rejects invalid color', () => {
    const result = validateCreateIdea({ title: 'Test', color: 'orange' })
    expect(result.error).not.toBeNull()
    expect(result.error).toContain('Farbe')
  })

  it('accepts all valid colors', () => {
    const colors = ['default', 'red', 'yellow', 'green', 'blue', 'purple']
    for (const color of colors) {
      const result = validateCreateIdea({ title: 'Test', color })
      expect(result.error).toBeNull()
    }
  })

  it('sanitizes title', () => {
    const result = validateCreateIdea({ title: '<Idee>' })
    expect(result.error).toBeNull()
    expect(result.data!.title).toBe('Idee')
  })

  it('limits tags to 20', () => {
    const tags = Array.from({ length: 25 }, (_, i) => `tag${i}`)
    const result = validateCreateIdea({ title: 'Test', tags })
    expect(result.data!.tags).toHaveLength(20)
  })

  it('defaults color to default', () => {
    const result = validateCreateIdea({ title: 'Test' })
    expect(result.data!.color).toBe('default')
  })

  it('defaults content to empty string', () => {
    const result = validateCreateIdea({ title: 'Test' })
    expect(result.data!.content).toBe('')
  })

  it('rejects non-object body', () => {
    expect(validateCreateIdea(null).error).not.toBeNull()
    expect(validateCreateIdea(42).error).not.toBeNull()
  })
})

describe('validateUpdateIdea', () => {
  it('validates partial update', () => {
    const result = validateUpdateIdea({ color: 'red' })
    expect(result.error).toBeNull()
    expect(result.data!.color).toBe('red')
  })

  it('validates title update', () => {
    const result = validateUpdateIdea({ title: 'New Title' })
    expect(result.error).toBeNull()
    expect(result.data!.title).toBe('New Title')
  })

  it('rejects empty title update', () => {
    const result = validateUpdateIdea({ title: '' })
    expect(result.error).not.toBeNull()
  })

  it('allows empty update', () => {
    expect(validateUpdateIdea({}).error).toBeNull()
  })
})

describe('validateCreateLink', () => {
  it('validates a valid https URL', () => {
    const result = validateCreateLink({ url: 'https://example.com' })
    expect(result.error).toBeNull()
    expect(result.data!.url).toBe('https://example.com')
  })

  it('validates http URL', () => {
    const result = validateCreateLink({ url: 'http://example.com/path' })
    expect(result.error).toBeNull()
  })

  it('rejects missing URL', () => {
    expect(validateCreateLink({}).error).not.toBeNull()
    expect(validateCreateLink({ url: '' }).error).not.toBeNull()
  })

  it('rejects invalid URL protocols', () => {
    expect(validateCreateLink({ url: 'ftp://example.com' }).error).not.toBeNull()
    expect(validateCreateLink({ url: 'javascript:alert(1)' }).error).not.toBeNull()
    expect(validateCreateLink({ url: 'not-a-url' }).error).not.toBeNull()
  })

  it('rejects URLs over 2048 chars', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048)
    const result = validateCreateLink({ url: longUrl })
    expect(result.error).not.toBeNull()
  })

  it('accepts tags', () => {
    const result = validateCreateLink({ url: 'https://example.com', tags: ['tech', 'news'] })
    expect(result.data!.tags).toEqual(['tech', 'news'])
  })

  it('defaults tags to empty array', () => {
    const result = validateCreateLink({ url: 'https://example.com' })
    expect(result.data!.tags).toEqual([])
  })

  it('rejects non-object body', () => {
    expect(validateCreateLink(null).error).not.toBeNull()
  })
})

describe('validateUpdateLink', () => {
  it('validates status update', () => {
    const validStatuses = ['unread', 'read', 'later']
    for (const status of validStatuses) {
      const result = validateUpdateLink({ status })
      expect(result.error).toBeNull()
      expect(result.data!.status).toBe(status)
    }
  })

  it('rejects invalid status', () => {
    const result = validateUpdateLink({ status: 'archived' })
    expect(result.error).not.toBeNull()
  })

  it('validates title update', () => {
    const result = validateUpdateLink({ title: 'New Title' })
    expect(result.error).toBeNull()
    expect(result.data!.title).toBe('New Title')
  })

  it('allows empty update', () => {
    expect(validateUpdateLink({}).error).toBeNull()
  })

  it('rejects non-object body', () => {
    expect(validateUpdateLink(null).error).not.toBeNull()
  })
})
