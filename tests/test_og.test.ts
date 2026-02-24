import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchOpenGraph } from '@/lib/utils/og'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function makeHtmlResponse(html: string, contentType = 'text/html') {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(html)
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
  return {
    ok: true,
    headers: new Headers({ 'content-type': contentType }),
    body: stream,
  }
}

describe('fetchOpenGraph', () => {
  it('returns null data for non-ok responses', async () => {
    mockFetch.mockResolvedValue({ ok: false, headers: new Headers() })
    const result = await fetchOpenGraph('https://example.com')
    expect(result.title).toBeNull()
    expect(result.description).toBeNull()
    expect(result.image).toBeNull()
  })

  it('returns null data for non-HTML content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      body: null,
    })
    const result = await fetchOpenGraph('https://example.com/api')
    expect(result.title).toBeNull()
  })

  it('extracts og:title', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Test Article Title" />
  <meta property="og:description" content="Test description" />
</head>
<body></body>
</html>`

    mockFetch.mockResolvedValue(makeHtmlResponse(html))
    const result = await fetchOpenGraph('https://example.com/article')
    expect(result.title).toBe('Test Article Title')
    expect(result.description).toBe('Test description')
  })

  it('falls back to <title> tag', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Page Title</title>
</head>
<body></body>
</html>`

    mockFetch.mockResolvedValue(makeHtmlResponse(html))
    const result = await fetchOpenGraph('https://example.com')
    expect(result.title).toBe('Page Title')
  })

  it('extracts og:image and resolves relative URLs', async () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:image" content="/images/thumb.jpg" />
</head>
<body></body>
</html>`

    mockFetch.mockResolvedValue(makeHtmlResponse(html))
    const result = await fetchOpenGraph('https://example.com')
    expect(result.image).toBe('https://example.com/images/thumb.jpg')
  })

  it('handles og:image with absolute URL', async () => {
    const html = `<head>
      <meta property="og:image" content="https://cdn.example.com/img.jpg" />
    </head>`

    mockFetch.mockResolvedValue(makeHtmlResponse(html))
    const result = await fetchOpenGraph('https://example.com')
    expect(result.image).toBe('https://cdn.example.com/img.jpg')
  })

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const result = await fetchOpenGraph('https://example.com')
    expect(result.title).toBeNull()
    expect(result.description).toBeNull()
    expect(result.image).toBeNull()
  })

  it('decodes HTML entities in title', async () => {
    const html = `<head><title>Test &amp; Article &lt;Script&gt;</title></head>`
    mockFetch.mockResolvedValue(makeHtmlResponse(html))
    const result = await fetchOpenGraph('https://example.com')
    expect(result.title).toBe('Test & Article <Script>')
  })

  it('extracts meta description when no og:description', async () => {
    const html = `<head>
      <meta name="description" content="This is the meta description" />
    </head>`
    mockFetch.mockResolvedValue(makeHtmlResponse(html))
    const result = await fetchOpenGraph('https://example.com')
    expect(result.description).toBe('This is the meta description')
  })
})
