interface OgData {
  title: string | null
  description: string | null
  image: string | null
  favicon: string | null
}

export async function fetchOpenGraph(url: string): Promise<OgData> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DayFlow/1.0 (+https://dayflow.app)',
        Accept: 'text/html',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { title: null, description: null, image: null, favicon: null }
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return { title: null, description: null, image: null, favicon: null }
    }

    // Read only a limited amount to avoid large payloads
    const reader = response.body?.getReader()
    if (!reader) return { title: null, description: null, image: null, favicon: null }

    let html = ''
    let bytesRead = 0
    const maxBytes = 100_000 // 100KB is enough for the <head>

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      html += new TextDecoder().decode(value)
      bytesRead += value.byteLength
      // Stop early if we've passed </head>
      if (html.includes('</head>')) break
    }

    reader.cancel()

    const baseUrl = new URL(url)

    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"[^>]*>/i)?.[1]
      ?? html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:title"[^>]*>/i)?.[1]
      ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
      ?? null

    const ogDescription = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"[^>]*>/i)?.[1]
      ?? html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:description"[^>]*>/i)?.[1]
      ?? html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"[^>]*>/i)?.[1]
      ?? null

    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"[^>]*>/i)?.[1]
      ?? html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:image"[^>]*>/i)?.[1]
      ?? null

    const faviconPath = html.match(/<link[^>]+rel="(?:shortcut )?icon"[^>]+href="([^"]*)"[^>]*>/i)?.[1]
      ?? `/favicon.ico`

    const favicon = faviconPath.startsWith('http')
      ? faviconPath
      : `${baseUrl.protocol}//${baseUrl.host}${faviconPath.startsWith('/') ? faviconPath : `/${faviconPath}`}`

    const resolveImage = (img: string | null): string | null => {
      if (!img) return null
      if (img.startsWith('http')) return img
      return `${baseUrl.protocol}//${baseUrl.host}${img.startsWith('/') ? img : `/${img}`}`
    }

    return {
      title: ogTitle ? decodeHtmlEntities(ogTitle).trim().slice(0, 500) : null,
      description: ogDescription ? decodeHtmlEntities(ogDescription).trim().slice(0, 2000) : null,
      image: resolveImage(ogImage),
      favicon,
    }
  } catch (err) {
    // Network errors, timeouts, etc. – return gracefully
    if (process.env.NODE_ENV !== 'test') {
      console.warn('OG fetch failed for', url, err instanceof Error ? err.message : err)
    }
    return { title: null, description: null, image: null, favicon: null }
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
}
