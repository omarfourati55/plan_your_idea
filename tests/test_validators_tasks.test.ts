import { describe, it, expect } from 'vitest'
import { validateCreateTask, validateUpdateTask } from '@/lib/validators/tasks'

describe('validateCreateTask', () => {
  it('validates a valid task', () => {
    const result = validateCreateTask({
      title: 'Einkaufen gehen',
      priority: 'high',
      due_date: '2024-12-31',
      due_time: '09:00',
      tags: ['haushalt', 'wichtig'],
      recurring: null,
    })
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.title).toBe('Einkaufen gehen')
    expect(result.data!.priority).toBe('high')
  })

  it('requires a title', () => {
    expect(validateCreateTask({}).error).not.toBeNull()
    expect(validateCreateTask({ title: '' }).error).not.toBeNull()
    expect(validateCreateTask({ title: '   ' }).error).not.toBeNull()
  })

  it('rejects invalid priority', () => {
    const result = validateCreateTask({ title: 'Test', priority: 'critical' })
    expect(result.error).not.toBeNull()
    expect(result.error).toContain('Priorität')
  })

  it('rejects invalid date format', () => {
    const result = validateCreateTask({ title: 'Test', due_date: '31.12.2024' })
    expect(result.error).not.toBeNull()
    expect(result.error).toContain('Datum')
  })

  it('rejects invalid time format', () => {
    const result = validateCreateTask({ title: 'Test', due_time: '9:00am' })
    expect(result.error).not.toBeNull()
    expect(result.error).toContain('Zeit')
  })

  it('rejects invalid recurring type', () => {
    const result = validateCreateTask({ title: 'Test', recurring: 'monthly' })
    expect(result.error).not.toBeNull()
  })

  it('accepts valid recurring types', () => {
    expect(validateCreateTask({ title: 'Test', recurring: 'daily' }).error).toBeNull()
    expect(validateCreateTask({ title: 'Test', recurring: 'weekly' }).error).toBeNull()
    expect(validateCreateTask({ title: 'Test', recurring: 'custom' }).error).toBeNull()
  })

  it('truncates too many tags', () => {
    const tags = Array.from({ length: 25 }, (_, i) => `tag${i}`)
    const result = validateCreateTask({ title: 'Test', tags })
    expect(result.error).toBeNull()
    expect(result.data!.tags).toHaveLength(20)
  })

  it('sanitizes title', () => {
    const result = validateCreateTask({ title: '  <Test>  ' })
    expect(result.error).toBeNull()
    expect(result.data!.title).toBe('Test')
  })

  it('rejects title over 500 chars', () => {
    const result = validateCreateTask({ title: 'a'.repeat(501) })
    expect(result.error).not.toBeNull()
  })

  it('rejects non-object body', () => {
    expect(validateCreateTask(null).error).not.toBeNull()
    expect(validateCreateTask('string').error).not.toBeNull()
    expect(validateCreateTask(42).error).not.toBeNull()
  })

  it('defaults priority to medium', () => {
    const result = validateCreateTask({ title: 'Test' })
    expect(result.data!.priority).toBe('medium')
  })
})

describe('validateUpdateTask', () => {
  it('validates partial update - completed only', () => {
    const result = validateUpdateTask({ completed: true })
    expect(result.error).toBeNull()
    expect(result.data!.completed).toBe(true)
  })

  it('validates partial update - priority only', () => {
    const result = validateUpdateTask({ priority: 'low' })
    expect(result.error).toBeNull()
    expect(result.data!.priority).toBe('low')
  })

  it('rejects non-boolean completed', () => {
    const result = validateUpdateTask({ completed: 'true' })
    expect(result.error).not.toBeNull()
  })

  it('rejects invalid priority in update', () => {
    const result = validateUpdateTask({ priority: 'urgent' })
    expect(result.error).not.toBeNull()
  })

  it('validates due_date update', () => {
    const result = validateUpdateTask({ due_date: '2025-01-01' })
    expect(result.error).toBeNull()
    expect(result.data!.due_date).toBe('2025-01-01')
  })

  it('rejects invalid due_date in update', () => {
    const result = validateUpdateTask({ due_date: 'not-a-date' })
    expect(result.error).not.toBeNull()
  })

  it('allows empty update object', () => {
    const result = validateUpdateTask({})
    expect(result.error).toBeNull()
    expect(result.data).toEqual({})
  })

  it('rejects non-object body', () => {
    expect(validateUpdateTask(null).error).not.toBeNull()
  })
})
