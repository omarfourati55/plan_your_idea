import { describe, it, expect, vi } from 'vitest'
import {
  cn,
  formatDate,
  formatDateTime,
  isValidUrl,
  getPriorityColor,
  getPriorityLabel,
  generateId,
  truncate,
  sanitizeInput,
  debounce,
  groupTasksByDate,
} from '@/lib/utils'
import { format } from 'date-fns'

describe('cn (class name utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', true && 'bar')).toBe('foo bar')
  })

  it('merges Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })
})

describe('formatDate', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('formats today as "Heute"', () => {
    const today = new Date()
    expect(formatDate(today)).toBe('Heute')
  })

  it('formats a Date object', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    expect(result).toBe('15.01.2024')
  })

  it('formats a string date', () => {
    const result = formatDate('2024-06-20')
    expect(result).toBe('20.06.2024')
  })
})

describe('formatDateTime', () => {
  it('returns empty string for null date', () => {
    expect(formatDateTime(null)).toBe('')
  })

  it('returns only date when no time given', () => {
    const today = new Date()
    const result = formatDateTime(today)
    expect(result).toBe('Heute')
  })

  it('includes time when provided', () => {
    const today = new Date()
    const result = formatDateTime(today, '09:30')
    expect(result).toBe('Heute, 09:30 Uhr')
  })
})

describe('isValidUrl', () => {
  it('returns true for valid http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('returns true for valid https URLs', () => {
    expect(isValidUrl('https://example.com/path?query=1')).toBe(true)
  })

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('')).toBe(false)
    expect(isValidUrl('http://')).toBe(false)
  })

  it('returns false for null-like inputs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('getPriorityColor', () => {
  it('returns red for high priority', () => {
    expect(getPriorityColor('high')).toBe('text-red-500')
  })

  it('returns yellow for medium priority', () => {
    expect(getPriorityColor('medium')).toBe('text-yellow-500')
  })

  it('returns blue for low priority', () => {
    expect(getPriorityColor('low')).toBe('text-blue-500')
  })
})

describe('getPriorityLabel', () => {
  it('returns German labels', () => {
    expect(getPriorityLabel('high')).toBe('Hoch')
    expect(getPriorityLabel('medium')).toBe('Mittel')
    expect(getPriorityLabel('low')).toBe('Niedrig')
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })
})

describe('truncate', () => {
  it('does not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates long strings', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('does not truncate at exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('removes < and > characters', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
  })

  it('handles normal input', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })
})

describe('debounce', () => {
  it('delays function execution', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})

describe('groupTasksByDate', () => {
  it('groups tasks correctly', () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
    const future = format(new Date(Date.now() + 86400000 * 7), 'yyyy-MM-dd')

    const tasks = [
      { due_date: today, title: 'Today task' },
      { due_date: yesterday, title: 'Overdue task' },
      { due_date: tomorrow, title: 'Tomorrow task' },
      { due_date: future, title: 'Future task' },
      { due_date: null, title: 'Someday task' },
    ]

    const groups = groupTasksByDate(tasks)

    expect(groups.today).toHaveLength(1)
    expect(groups.overdue).toHaveLength(1)
    expect(groups.tomorrow).toHaveLength(1)
    expect(groups.future).toHaveLength(1)
    expect(groups.someday).toHaveLength(1)
  })

  it('returns empty groups for empty input', () => {
    const groups = groupTasksByDate([])
    expect(groups.today).toHaveLength(0)
    expect(groups.overdue).toHaveLength(0)
    expect(groups.someday).toHaveLength(0)
  })
})
