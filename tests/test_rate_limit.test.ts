import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, getRateLimitKey } from '@/lib/utils/rate-limit'

// We need to clear the rate limit store between tests by using unique identifiers
function uniqueKey() {
  return `test:${Math.random().toString(36).slice(2)}`
}

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const result = checkRateLimit(uniqueKey())
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99)
  })

  it('counts requests correctly', () => {
    const key = uniqueKey()
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key)
    }
    const result = checkRateLimit(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(89)
  })

  it('blocks after exceeding max requests', () => {
    const key = uniqueKey()
    // Make 100 requests (the max)
    for (let i = 0; i < 100; i++) {
      checkRateLimit(key)
    }
    // 101st request should be blocked
    const result = checkRateLimit(key)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    vi.useFakeTimers()
    const key = uniqueKey()

    // Exhaust limit
    for (let i = 0; i < 101; i++) {
      checkRateLimit(key)
    }
    expect(checkRateLimit(key).allowed).toBe(false)

    // Advance time past window (61 seconds)
    vi.advanceTimersByTime(61_000)

    // Should be allowed again after reset
    const result = checkRateLimit(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99)

    vi.useRealTimers()
  })
})

describe('getRateLimitKey', () => {
  it('extracts first IP from x-forwarded-for header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    })
    expect(getRateLimitKey(req)).toBe('rate:192.168.1.1')
  })

  it('returns unknown for requests without forwarded header', () => {
    const req = new Request('https://example.com')
    expect(getRateLimitKey(req)).toBe('rate:unknown')
  })

  it('handles single IP in forwarded header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    expect(getRateLimitKey(req)).toBe('rate:1.2.3.4')
  })

  it('trims whitespace from IP', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '  203.0.113.1  ' },
    })
    expect(getRateLimitKey(req)).toBe('rate:203.0.113.1')
  })
})
