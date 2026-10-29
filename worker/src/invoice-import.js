/**
 * Supplier invoice import via Mistral OCR (admin proxy; API key from client only).
 */

const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr'
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions'

const INVOICE_ANNOTATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    supplier_name: { type: ['string', 'null'] },
    invoice_reference: { type: ['string', 'null'] },
    order_reference: { type: ['string', 'null'] },
    invoice_date: { type: ['string', 'null'], description: 'YYYY-MM-DD if possible' },
    currency: { type: ['string', 'null'] },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          ean: { type: ['string', 'null'] },
          sku: { type: ['string', 'null'] },
          quantity: { type: 'number' },
          unit_net_price: { type: 'number' },
          vat_rate: { type: ['string', 'null'] }
        },
        required: ['name', 'quantity', 'unit_net_price']
      }
    }
  },
  required: ['lines']
}

export function getMistralApiKey(c, body) {
  if (body && body.mistral_api_key != null) {
    const fromBody = String(body.mistral_api_key).trim()
    if (fromBody) return fromBody
  }
  return String(c.req.header('X-Mistral-Api-Key') || '').trim() || null
}

export function parseEuAmount(raw) {
  if (raw == null || raw === '') return null
  let s = String(raw).trim().replace(/\u00a0/g, ' ').replace(/[€£$]/g, '').trim()
  if (!s) return null
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function normalizeIsoDate(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const de = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (de) return `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`
  const uk = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (uk) return `${uk[3]}-${uk[2].padStart(2, '0')}-${uk[1].padStart(2, '0')}`
  return null
}

function normalizeOcrLines(lines) {
  if (!Array.isArray(lines)) return []
  const out = []
  for (const line of lines) {
    if (!line || typeof line !== 'object') continue
    const name = String(line.name || '').trim()
    const qty = Number(line.quantity)
    let unit = line.unit_net_price
    if (typeof unit !== 'number' || !Number.isFinite(unit)) unit = parseEuAmount(unit)
    if (!name || !Number.isFinite(qty) || qty <= 0 || unit == null) continue
    const eanRaw = line.ean != null ? String(line.ean).trim() : ''
    out.push({
      name,
      ean: eanRaw ? eanRaw.replace(/[^\dX]/gi, '') : null,
      sku: line.sku != null ? String(line.sku).trim() : null,
      quantity: Math.round(qty),
      unit_net_price: unit,
      vat_rate: line.vat_rate != null ? String(line.vat_rate) : null
    })
  }
  return out
}

function parseDocumentAnnotation(raw) {
  if (raw == null) return null
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return null
}

async function callMistralOcr(apiKey, pdfBase64) {
  const dataUrl = pdfBase64.startsWith('data:')
    ? pdfBase64
    : `data:application/pdf;base64,${String(pdfBase64).replace(/^data:[^;]+;base64,/, '')}`

  const res = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: dataUrl
      },
      document_annotation_format: {
        type: 'json_schema',
        json_schema: {
          name: 'supplier_invoice',
          strict: true,
          schema: INVOICE_ANNOTATION_SCHEMA
        }
      },
      document_annotation_prompt:
        'Extract supplier invoice metadata and every product line item only. ' +
        'Ignore addresses, payment instructions, bank details, and page footers. ' +
        'Use unit net price per line (before VAT). Quantity must be a whole number.'
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      error: 'mistral_ocr_failed',
      status: res.status,
      message: String(data.message || data.detail || res.statusText).slice(0, 500)
    }
  }
  return { data }
}

export async function parseInvoiceDocument(apiKey, { pdf_base64 }) {
  if (!apiKey) {
    return { error: 'missing_mistral_key', message: 'Mistral API key is required for invoice OCR.' }
  }
  if (!pdf_base64) return { error: 'missing_pdf', message: 'No PDF was uploaded.' }

  const ocr = await callMistralOcr(apiKey, pdf_base64)
  if (ocr.error) return ocr

  const annotation = parseDocumentAnnotation(ocr.data?.document_annotation)
  if (!annotation) {
    return {
      error: 'invalid_ocr_response',
      message: 'Mistral OCR did not return structured invoice data.'
    }
  }

  const lines = normalizeOcrLines(annotation.lines)
  if (!lines.length) {
    return {
      error: 'no_line_items',
      message: 'Mistral OCR returned no usable line items.'
    }
  }

  return {
    success: true,
    parse_source: 'mistral_ocr',
    supplier_name: annotation.supplier_name ? String(annotation.supplier_name).trim() : null,
    invoice_reference: annotation.invoice_reference ? String(annotation.invoice_reference).trim() : null,
    order_reference: annotation.order_reference ? String(annotation.order_reference).trim() : null,
    invoice_date: annotation.invoice_date ? normalizeIsoDate(annotation.invoice_date) : null,
    currency: annotation.currency ? String(annotation.currency).trim() : null,
    lines
  }
}

function rainposUrlFromSku(sku) {
  const s = String(sku || '').trim()
  const m = /^AT-(\d+)/i.exec(s)
  if (!m) return null
  return `https://media.rainpos.com/11863/at_${m[1]}_1.jpg`
}

export async function verifyImageUrl(url) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-8191' },
      redirect: 'follow'
    })
    if (!res.ok && res.status !== 206) return false
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    return ct.startsWith('image/')
  } catch {
    return false
  }
}

async function mistralChatImageUrl(apiKey, { ean, sku, name }) {
  const res = await fetch(MISTRAL_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content:
            'Find a direct HTTPS URL to a product packshot or retail box image. JSON only. URL must be jpg/png/webp, not a product page.'
        },
        {
          role: 'user',
          content: `Product image URL for:\nName: ${name || ''}\nEAN: ${ean || ''}\nSKU: ${sku || ''}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'product_image',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { image_url: { type: ['string', 'null'] } },
            required: ['image_url']
          }
        }
      },
      temperature: 0.1
    })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { error: 'mistral_chat_failed', message: String(data.message || res.statusText).slice(0, 300) }
  }
  const content = data.choices?.[0]?.message?.content
  let parsed = null
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return { error: 'invalid_chat_response' }
  }
  const url = parsed?.image_url ? String(parsed.image_url).trim() : null
  if (!url || !/^https:\/\//i.test(url)) return { error: 'no_image_url' }
  if (!(await verifyImageUrl(url))) return { error: 'image_not_verified' }
  return { image_url: url, source: 'mistral_chat' }
}

export async function resolveProductImage(apiKey, { ean, sku, name }) {
  const heuristic = rainposUrlFromSku(sku)
  if (heuristic && (await verifyImageUrl(heuristic))) {
    return { image_url: heuristic, source: 'sku_heuristic' }
  }
  if (apiKey) {
    const chat = await mistralChatImageUrl(apiKey, { ean, sku, name })
    if (chat.image_url) return chat
  }
  return { error: 'image_not_found' }
}

export function registerInvoiceImportRoutes(app, { requireAdmin, requireAccountsOwner }) {
  app.post('/admin/invoice-import/parse', requireAdmin, requireAccountsOwner, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const apiKey = getMistralApiKey(c, body)
      const result = await parseInvoiceDocument(apiKey, body)
      if (result.error) {
        const status =
          result.error === 'mistral_ocr_failed' ? 502 : result.error === 'missing_mistral_key' ? 401 : 400
        return c.json(result, status)
      }
      return c.json(result)
    } catch (e) {
      console.error('[invoice-import/parse] ERROR:', e)
      return c.json({ error: 'internal_error' }, 500)
    }
  })

  app.post('/admin/invoice-import/resolve-image', requireAdmin, requireAccountsOwner, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const apiKey = getMistralApiKey(c, body)
      const result = await resolveProductImage(apiKey, body)
      if (result.error) return c.json(result, 404)
      return c.json({ success: true, ...result })
    } catch (e) {
      console.error('[invoice-import/resolve-image] ERROR:', e)
      return c.json({ error: 'internal_error' }, 500)
    }
  })
}
