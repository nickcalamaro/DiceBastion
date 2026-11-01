/** HTTPS image proxy for admin canvas export (CORS). */

const MAX_PROXY_BYTES = 5 * 1024 * 1024

export function isAllowedProxyUrl(urlStr) {
  try {
    const u = new URL(urlStr)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.local')) return false
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false
    return true
  } catch {
    return false
  }
}

export async function fetchProxyImage(urlStr) {
  if (!isAllowedProxyUrl(urlStr)) return { error: 'invalid_url' }
  const res = await fetch(urlStr, { redirect: 'follow' })
  if (!res.ok) return { error: 'fetch_failed', status: res.status }
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!ct.startsWith('image/')) return { error: 'not_an_image' }
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_PROXY_BYTES) return { error: 'image_too_large' }
  return { buffer: buf, contentType: ct.split(';')[0].trim() || 'image/jpeg' }
}

export function registerAdminImageProxyRoute(app, { requireAdmin }) {
  app.get('/admin/proxy-image', requireAdmin, async (c) => {
    try {
      const url = c.req.query('url')
      if (!url) return c.json({ error: 'missing_url' }, 400)
      const fetched = await fetchProxyImage(url)
      if (fetched.error) {
        const status = fetched.error === 'fetch_failed' ? 502 : 400
        return c.json(fetched, status)
      }
      return new Response(fetched.buffer, {
        headers: {
          'Content-Type': fetched.contentType,
          'Cache-Control': 'private, max-age=3600'
        }
      })
    } catch (e) {
      console.error('[admin/proxy-image] ERROR:', e)
      return c.json({ error: 'internal_error' }, 500)
    }
  })
}
