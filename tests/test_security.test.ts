import { describe, it, expect } from 'vitest'

/**
 * Tests for the open-redirect prevention logic used in auth/callback/route.ts
 * We test the pure path-sanitization logic independently.
 */
function sanitizeRedirectPath(rawNext: string | null): string {
  const path = rawNext ?? '/today'
  // Only allow relative paths that start with / but not // (protocol-relative URLs)
  return path.startsWith('/') && !path.startsWith('//') ? path : '/today'
}

describe('Auth Callback – Open Redirect Prevention', () => {
  it('allows valid relative paths', () => {
    expect(sanitizeRedirectPath('/today')).toBe('/today')
    expect(sanitizeRedirectPath('/settings')).toBe('/settings')
    expect(sanitizeRedirectPath('/planner')).toBe('/planner')
    expect(sanitizeRedirectPath('/ideas')).toBe('/ideas')
  })

  it('defaults to /today when no next param', () => {
    expect(sanitizeRedirectPath(null)).toBe('/today')
    expect(sanitizeRedirectPath('')).toBe('/today')
  })

  it('blocks protocol-relative URLs (// attack)', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/today')
    expect(sanitizeRedirectPath('//evil.com/steal')).toBe('/today')
  })

  it('blocks absolute URLs', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/today')
    expect(sanitizeRedirectPath('http://phishing.com')).toBe('/today')
    expect(sanitizeRedirectPath('ftp://example.com')).toBe('/today')
  })

  it('blocks javascript: protocol', () => {
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/today')
  })

  it('allows deep relative paths', () => {
    expect(sanitizeRedirectPath('/ideas/123')).toBe('/ideas/123')
    expect(sanitizeRedirectPath('/settings?tab=notifications')).toBe('/settings?tab=notifications')
  })
})

/**
 * Tests for the boolean validation logic used in api/settings/route.ts
 */
function validateBooleanField(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'boolean') {
    return `${fieldName} muss ein Boolean sein`
  }
  return null
}

describe('Settings API – Boolean Validation', () => {
  it('accepts true boolean for ai_enabled', () => {
    expect(validateBooleanField(true, 'ai_enabled')).toBeNull()
  })

  it('accepts false boolean for notifications_enabled', () => {
    expect(validateBooleanField(false, 'notifications_enabled')).toBeNull()
  })

  it('rejects string "true" for ai_enabled', () => {
    expect(validateBooleanField('true', 'ai_enabled')).not.toBeNull()
    expect(validateBooleanField('true', 'ai_enabled')).toContain('ai_enabled')
  })

  it('rejects number 1 for notifications_enabled', () => {
    expect(validateBooleanField(1, 'notifications_enabled')).not.toBeNull()
  })

  it('rejects null', () => {
    expect(validateBooleanField(null, 'ai_enabled')).not.toBeNull()
  })

  it('rejects undefined', () => {
    expect(validateBooleanField(undefined, 'ai_enabled')).not.toBeNull()
  })

  it('rejects object', () => {
    expect(validateBooleanField({}, 'ai_enabled')).not.toBeNull()
  })
})
