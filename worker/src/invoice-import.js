/**
 * Supplier invoice import via Mistral OCR (admin proxy; API key from client only).
 */

const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr'
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions'
const MISTRAL_CONVERSATIONS_URL = 'https://api.mistral.ai/v1/conversations'

const SPLIT_EXPAND_MODEL = 'mistral-medium-latest'
const LISTING_COPY_MODEL = 'mistral-large-latest'

const LISTING_COPY_SYSTEM =
  'You write shop listing copy for Dice Bastion, a UK retail shop for board games, trading card games (TCGs), and tabletop RPGs.\n\n' +
  'Tone of voice (Dice Bastion site guidelines):\n' +
  '- Factual, friendly British English for hobbyists.\n' +
  '- No emojis. No arrow characters. No decorative Unicode symbols.\n' +
  '- Plain, descriptive wording — no hype or empty marketing filler.\n' +
  '- Short card summary; longer modal description in clear paragraphs.\n\n' +
  'Always use web search before writing. When an EAN/GTIN is provided, search by barcode first to identify the exact product, brand, and range.\n' +
  'Use that identification to expand distributor abbreviations and acronyms in the invoice line into full names customers recognise (e.g. invoice text "DS Matte Std" with EAN for Dragon Shield becomes "Dragon Shield" in the listing title and copy). ' +
  'Only expand abbreviations when the EAN or authoritative listings confirm the match; if unsure, keep the invoice wording and do not guess.\n\n' +
  'Product-type guidance:\n' +
  '- Card sleeves, deck boxes, binders, playmats: state size or fit and name suitable games (e.g. standard sleeves: Pokémon, Magic: The Gathering, and most standard-size TCGs).\n' +
  '- TCG sealed product (boosters, decks, tins): use official set or product name from the EAN; do not invent card lists or pull rates.\n' +
  '- Board games and standalone card games: player count, play time, or age rating only when stated in publisher sources; never invent stats. Each title/edition is usually a distinct product — write copy for that EAN only.\n' +
  '- RPG books, adventure modules, dice sets, paints, terrain, miniatures: practical use for tabletop and RPG players; match format (hardcover, softcover, layer, scale) when sources specify.\n' +
  '- Expansions: name the base game required when publisher listings do.\n\n' +
  'Product variants (same SKU line, different EAN — not different games or expansions):\n' +
  'Examples: sleeve or dice colour, paint shade, deck box art, RPG rulebook language edition with the same contents, regional packaging for the same item.\n' +
  '- When the user prompt includes a reference listing from a sibling variant already in this import batch, treat the current item as that variant only if web search confirms the same product line.\n' +
  '- summary and description must stay structurally identical to the reference: same paragraph count, same specs and compatibility lists, same SEO keywords.\n' +
  '- Change only variant-specific wording (colour, shade, finish, language, edition label where contents match) in display_name, summary, and description.\n' +
  '- Do not apply variant rules across different product names, sets, or expansions.\n' +
  '- Do not rewrite generic paragraphs differently for each colour; avoid alternate phrasing for the same facts.\n' +
  '- image_url: use the official variant packshot from the same publisher or manufacturer site and URL path pattern as the reference when possible (same layout, different SKU).\n\n' +
  'Return JSON with display_name (shop product title with expanded brand/name, max 200 characters), summary (max 500 characters; aim 140–160 — this becomes the shop card blurb and Google meta description, truncated to 160 on product pages), and description (2-4 short paragraphs plain text for the product page body, no HTML).\n\n' +
  'Summary (SEO-aware, same field as manual product add):\n' +
  '- One clear sentence: product type, brand or line name, and one factual spec customers search for (size, player count, format) when known.\n' +
  '- Natural British English keywords; no hype, no keyword stuffing, no emojis.\n' +
  '- Factual and professional; write for hobbyists and search snippets alike.\n\n' +
  'Product image (same single web search as copy — reuse sources, do not run separate image-only searches):\n' +
  'Find the most likely official product image URL (direct https link to a JPEG, PNG, or WebP file).\n' +
  '- Prefer publisher or manufacturer images; same catalog pages used for copy.\n' +
  '- Prefer isolated product photography on neutral backgrounds.\n' +
  '- Match exact edition and language when identifiable from the EAN.\n' +
  '- If no direct image for this EAN, search the same brand range for the matching product name or visually identical official packshot (e.g. same accessory line or finish). Use a sibling SKU image only when packaging clearly matches; lower confidence and explain in reason.\n' +
  '- Reject watermarked images, marketplace seller photos, opened products, and screenshots.\n' +
  'Set image_url to null if no suitable direct image URL is found. Set confidence 0-1, product_verified true only when EAN/name match is confident, and reason briefly explains the image choice.\n\n' +
  'Always use the web_search tool once per request. Respond with JSON matching the listing_enrichment schema only.'

/** Stable system instructions (Mistral `instructions` field — identical every call for prefix cache). */
const LISTING_ENRICHMENT_INSTRUCTIONS = LISTING_COPY_SYSTEM

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

const SPLIT_LINES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          sku: { type: ['string', 'null'] },
          quantity: { type: ['number', 'null'] },
          ean: { type: ['string', 'null'] }
        },
        required: ['name']
      }
    }
  },
  required: ['lines']
}

const LISTING_ENRICHMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    display_name: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    image_url: { type: ['string', 'null'] },
    confidence: { type: 'number' },
    reason: { type: 'string' },
    product_verified: { type: 'boolean' }
  },
  required: ['display_name', 'summary', 'description', 'image_url', 'confidence', 'reason', 'product_verified']
}

/** @deprecated alias */
const LISTING_COPY_SCHEMA = LISTING_ENRICHMENT_SCHEMA

const FAMILY_ENRICHMENT_MAX_LINES = 15

const LISTING_FAMILY_VARIANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ean: { type: 'string' },
    variant_label: { type: 'string' },
    display_name: { type: 'string' },
    image_url: { type: ['string', 'null'] },
    confidence: { type: 'number' },
    product_verified: { type: 'boolean' },
    reason: { type: 'string' }
  },
  required: ['ean', 'variant_label', 'display_name', 'image_url', 'confidence', 'product_verified', 'reason']
}

const LISTING_FAMILY_ENRICHMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    product_line_name: { type: 'string' },
    naming_pattern: { type: 'string' },
    summary_template: { type: 'string' },
    description_paragraphs: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 4
    },
    variants: {
      type: 'array',
      items: LISTING_FAMILY_VARIANT_SCHEMA,
      minItems: 2,
      maxItems: FAMILY_ENRICHMENT_MAX_LINES
    }
  },
  required: ['product_line_name', 'naming_pattern', 'summary_template', 'description_paragraphs', 'variants']
}

const LISTING_FAMILY_INSTRUCTIONS_ADDENDUM =
  '\n\nFamily batch mode (multiple variants in one request):\n' +
  '- One web search for the whole product line, then return listing_family_enrichment JSON.\n' +
  '- All variants share the same summary_template and description_paragraphs; use {variant} placeholder where the colour/edition/language differs.\n' +
  '- naming_pattern uses {product_line_name} and {variant} (e.g. "{product_line_name} — {variant}").\n' +
  '- variants[] must include one entry per input EAN with variant_label, display_name, and official image_url per EAN (same publisher path pattern).\n' +
  '- variant_label is the colour/edition token only (e.g. "Apple Green"). display_name must follow naming_pattern with that label substituted — do not invent alternate title wording per variant.\n' +
  '- Do not write different specs or paragraph structures per variant.'

const LISTING_FAMILY_INSTRUCTIONS = LISTING_ENRICHMENT_INSTRUCTIONS + LISTING_FAMILY_INSTRUCTIONS_ADDENDUM

export function applyFamilyTemplate(template, variantLabel, productLineName) {
  const variant = String(variantLabel || '').trim()
  const line = String(productLineName || '').trim()
  const replace = (s) =>
    String(s || '')
      .replace(/\{variant\}/gi, variant)
      .replace(/\{product_line_name\}/gi, line)
      .trim()
  return {
    summary: replace(template.summary_template).slice(0, 500),
    description: (template.description_paragraphs || []).map(replace).filter(Boolean).join('\n\n').slice(0, 4000),
    display_name: replace(template.naming_pattern).slice(0, 200)
  }
}

export function matchFamilyVariantToInput(inputLine, variants, usedIndices) {
  const ean = normalizeGtin(inputLine.ean)
  const list = variants || []
  if (ean) {
    for (let i = 0; i < list.length; i++) {
      if (usedIndices.has(i)) continue
      const vEan = normalizeGtin(list[i].ean)
      if (vEan && vEan === ean) {
        usedIndices.add(i)
        return list[i]
      }
    }
  }
  const nameNorm = String(inputLine.name || '').trim().toLowerCase()
  for (let i = 0; i < list.length; i++) {
    if (usedIndices.has(i)) continue
    const label = String(list[i].variant_label || '').trim().toLowerCase()
    if (label && nameNorm.includes(label)) {
      usedIndices.add(i)
      return list[i]
    }
  }
  for (let i = 0; i < list.length; i++) {
    if (!usedIndices.has(i)) {
      usedIndices.add(i)
      return list[i]
    }
  }
  return null
}

function normalizeFamilyInputLines(rawLines) {
  const out = []
  for (const line of rawLines || []) {
    if (!line || typeof line !== 'object') continue
    const name = String(line.name || '').trim()
    if (!name) continue
    const ean = line.ean != null ? normalizeGtin(String(line.ean)) : null
    out.push({ name, ean })
  }
  return out
}

function buildFamilyEnrichmentUserPrompt(inputLines, familyHint) {
  const hint = String(familyHint || '').trim()
  const bullets = inputLines.map((l) => {
    const ean = l.ean ? l.ean : 'none'
    return `- EAN ${ean}: ${l.name}`
  })
  return [
    'Enrich this product family as one cohesive listing set (all variants together).',
    hint ? `Product line hint: ${hint}` : '',
    '',
    'Variants to include (one variants[] entry each):',
    ...bullets
  ]
    .filter(Boolean)
    .join('\n')
}

async function callMistralWebSearchFamilyEnrichment(apiKey, { inputLines, familyHint }) {
  const userPrompt = buildFamilyEnrichmentUserPrompt(inputLines, familyHint)

  const res = await fetch(MISTRAL_CONVERSATIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: LISTING_COPY_MODEL,
      store: true,
      tools: [{ type: 'web_search' }],
      instructions: LISTING_FAMILY_INSTRUCTIONS,
      inputs: userPrompt,
      completion_args: {
        temperature: 0.2,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'listing_family_enrichment',
            strict: true,
            schema: LISTING_FAMILY_ENRICHMENT_SCHEMA
          }
        }
      }
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      error: 'mistral_search_failed',
      message: String(data.message || data.detail || res.statusText).slice(0, 400)
    }
  }

  const { texts } = collectConversationContent(data.outputs)
  for (const t of texts) {
    const parsed = parseChatJsonContent(t)
    if (parsed?.summary_template && parsed?.variants?.length) return { parsed }
  }
  return { error: 'invalid_mistral_response', message: 'Mistral did not return family enrichment JSON.' }
}

export async function enrichProductFamily(apiKey, { lines, family_hint }) {
  if (!apiKey) {
    return { error: 'missing_mistral_key', message: 'Mistral API key is required.' }
  }
  const inputLines = normalizeFamilyInputLines(lines)
  if (inputLines.length < 2) {
    return { error: 'too_few_lines', message: 'Family enrichment requires at least 2 lines.' }
  }
  if (inputLines.length > FAMILY_ENRICHMENT_MAX_LINES) {
    return {
      error: 'too_many_lines',
      message: `Family enrichment supports at most ${FAMILY_ENRICHMENT_MAX_LINES} lines per call.`
    }
  }

  const started = Date.now()
  console.log(`[invoice-import/enrich-family] start lines=${inputLines.length}`)

  const webStarted = Date.now()
  const researched = await callMistralWebSearchFamilyEnrichment(apiKey, {
    inputLines,
    familyHint: family_hint
  })
  const webMs = Date.now() - webStarted

  let parsed = researched.parsed
  if (!parsed) {
    console.log(`[invoice-import/enrich-family] web_search failed ms=${webMs} error=${researched.error}`)
    const chat = await callMistralChatJson(apiKey, {
      system: LISTING_FAMILY_INSTRUCTIONS,
      user: buildFamilyEnrichmentUserPrompt(inputLines, family_hint),
      schemaName: 'listing_family_enrichment',
      schema: LISTING_FAMILY_ENRICHMENT_SCHEMA,
      model: LISTING_COPY_MODEL
    })
    if (chat.error) return { ...researched, duration_ms: Date.now() - started }
    parsed = chat.parsed
  } else {
    console.log(`[invoice-import/enrich-family] web_search ok ms=${webMs}`)
  }

  const template = {
    product_line_name: String(parsed.product_line_name || '').trim().slice(0, 200),
    naming_pattern: String(parsed.naming_pattern || '{product_line_name} — {variant}').slice(0, 200),
    summary_template: String(parsed.summary_template || '').trim().slice(0, 500),
    description_paragraphs: (parsed.description_paragraphs || []).map((p) => String(p || '').trim()).filter(Boolean)
  }
  if (!template.summary_template || template.description_paragraphs.length < 2) {
    return { error: 'invalid_family_copy', message: 'Mistral returned an incomplete family template.', duration_ms: Date.now() - started }
  }

  const usedIndices = new Set()
  const siblingImages = []
  const outLines = []
  for (const input of inputLines) {
    const variantRow = matchFamilyVariantToInput(input, parsed.variants, usedIndices)
    if (!variantRow) {
      outLines.push({
        ean: input.ean,
        name: input.name,
        error: 'no_variant_match'
      })
      continue
    }
    const variantLabel = String(variantRow.variant_label || '').trim()
    const applied = applyFamilyTemplate(template, variantLabel, template.product_line_name)
    const displayName = applied.display_name

    let imageMeta = await validateEnrichmentImage({ image_url: variantRow.image_url })
    const refUrl = siblingImages.find(Boolean)
    if (!imageMeta.image_url && refUrl) {
      imageMeta = await resolveEnrichmentImage(
        { image_url: null },
        { referenceListing: { image_url: refUrl }, variantLabel: variantLabel || displayName }
      )
    }
    if (imageMeta.image_url) siblingImages.push(imageMeta.image_url)

    outLines.push({
      ean: input.ean,
      name: input.name,
      display_name: displayName,
      summary: applied.summary,
      description: applied.description,
      image_url: imageMeta.image_url,
      image_rejected: imageMeta.image_rejected || undefined,
      variant_image_from_reference: imageMeta.variant_from_reference || undefined,
      confidence: Number.isFinite(Number(variantRow.confidence)) ? Number(variantRow.confidence) : undefined,
      product_verified: variantRow.product_verified === true,
      reason: variantRow.reason ? String(variantRow.reason).trim().slice(0, 500) : undefined,
      variant_label: variantLabel
    })
  }

  const durationMs = Date.now() - started
  console.log(`[invoice-import/enrich-family] done ms=${durationMs} lines=${outLines.length}`)
  return {
    success: true,
    product_line_name: template.product_line_name,
    lines: outLines,
    duration_ms: durationMs,
    web_search_ms: webMs
  }
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

function parseChatJsonContent(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : text
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
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

function collectConversationContent(outputs) {
  const texts = []
  for (const entry of outputs || []) {
    if (!entry || typeof entry !== 'object') continue
    const chunks = entry.content
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (!chunk || typeof chunk !== 'object') continue
        if (chunk.type === 'text' && chunk.text) texts.push(String(chunk.text))
      }
    } else if (typeof chunks === 'string') {
      texts.push(chunks)
    }
  }
  return { texts }
}

async function callMistralChatJson(apiKey, { system, user, schemaName, schema, model = SPLIT_EXPAND_MODEL }) {
  const res = await fetch(MISTRAL_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema
        }
      }
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      error: 'mistral_chat_failed',
      message: String(data.message || data.detail || res.statusText).slice(0, 400)
    }
  }

  const content = data.choices?.[0]?.message?.content
  const parsed = parseChatJsonContent(content)
  if (!parsed) {
    return { error: 'invalid_mistral_response', message: 'Mistral did not return valid JSON.' }
  }
  return { parsed }
}

function buildListingCopyUserPrompt({ name, ean, category, reference_listing: referenceListing }) {
  const title = String(name || '').trim()
  const eanNorm = ean ? String(ean).replace(/\D/g, '') : ''
  const ref = sanitizeReferenceListing(referenceListing)
  const lines = [`Product: ${title}`]
  if (eanNorm) lines.push(`EAN: ${eanNorm}`)
  else lines.push('EAN: none')
  const cat = category ? String(category).trim() : ''
  if (cat) lines.push(`Categories: ${cat}`)

  if (ref) {
    lines.push(
      '',
      'Variant sibling (already enriched in this invoice batch). Match reference structure; change only colour/edition wording.',
      `Reference EAN: ${ref.ean || 'none'}`,
      `Reference summary: ${ref.summary}`,
      `Reference description (same paragraphs, variant wording only):\n${ref.description}`,
      ref.image_url ? `Reference image URL (same manufacturer path for this variant): ${ref.image_url}` : '',
      '',
      `Web search: confirm EAN ${eanNorm || title} and find this variant official packshot. Reuse reference copy layout; do not rewrite specs.`
    )
  } else {
    lines.push('', 'Web search once, then return listing_enrichment JSON for this product.')
  }

  return lines.filter(Boolean).join('\n')
}

async function callMistralWebSearchListingCopy(apiKey, { name, ean, category, reference_listing }) {
  const userPrompt = buildListingCopyUserPrompt({ name, ean, category, reference_listing })
  const hasRef = !!sanitizeReferenceListing(reference_listing)

  const res = await fetch(MISTRAL_CONVERSATIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: LISTING_COPY_MODEL,
      store: true,
      tools: [{ type: 'web_search' }],
      instructions: LISTING_ENRICHMENT_INSTRUCTIONS,
      inputs: userPrompt,
      completion_args: {
        temperature: hasRef ? 0.25 : 0.35,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'listing_enrichment',
            strict: true,
            schema: LISTING_ENRICHMENT_SCHEMA
          }
        }
      }
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      error: 'mistral_search_failed',
      message: String(data.message || data.detail || res.statusText).slice(0, 400)
    }
  }

  const { texts } = collectConversationContent(data.outputs)
  for (const t of texts) {
    const parsed = parseChatJsonContent(t)
    if (parsed && parsed.summary) return { parsed }
  }
  return { error: 'invalid_mistral_response', message: 'Mistral did not return listing copy JSON.' }
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

export function normalizeGtin(ean) {
  const d = String(ean || '').replace(/\D/g, '')
  if (d.length < 8 || d.length > 14) return null
  return d
}

function logCopyLabel(name) {
  return String(name || '').trim().slice(0, 80)
}

/** Strip colour/edition tokens so sibling variants (e.g. Dragon Shield matte colours) share a family key. */
const VARIANT_FAMILY_STRIP_WORDS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'grey', 'gray',
  'silver', 'gold', 'brown', 'teal', 'cyan', 'magenta', 'ivory', 'crimson', 'navy', 'lime', 'amber',
  'copper', 'bronze', 'charcoal', 'cream', 'ruby', 'sapphire', 'emerald', 'pearl', 'slate', 'wine',
  'olive', 'sand', 'beige', 'tan', 'turquoise', 'coral', 'peach', 'plum', 'mustard', 'ebony', 'jet',
  'snow', 'arctic', 'smoke', 'steel', 'brass', 'clear', 'transparent', 'smoke', 'petrol', 'petroleum',
  'english', 'french', 'german', 'italian', 'spanish', 'japanese', 'polish', 'dutch',
  'apple', 'blood', 'amazonite', 'mint', 'jade', 'graphite', 'violet', 'indigo', 'azure', 'umber',
  'burgundy', 'melon', 'pumpkin', 'grass', 'sky', 'ocean', 'forest', 'midnight', 'rose',
  'boros', 'dimir', 'golgari', 'azorius', 'simic', 'rakdos', 'gruul', 'izzet', 'selesnya', 'orzhov'
]

export function normalizeVariantFamilyKey(name) {
  let s = String(name || '').toLowerCase()
  s = s.replace(/^\s*ds\b\s*[-:]\s*/i, 'dragon shield ')
  s = s.replace(/\[[^\]]*\]/g, ' ')
  s = s.replace(/\(\s*\d+\s*sleeves?\s*\)/gi, ' ')
  s = s.replace(/\b\d+\s*sleeves?\b/gi, ' ')
  s = s.replace(/\s[-–—]\s/g, ' ').replace(/[^\w\s]/g, ' ')
  for (const word of VARIANT_FAMILY_STRIP_WORDS) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ')
  }
  s = s.replace(/\s+/g, ' ').trim()
  return s.slice(0, 160)
}

/** Whether auto-clustered rows should share one family enrichment call. */
export function isFamilyBatchEligible(familyKey, lineCount) {
  return String(familyKey || '').length >= 8 && lineCount >= 2
}

/** If Mistral misses the variant packshot, swap colour token in a verified sibling official URL. */
export function guessVariantImageUrl(referenceUrl, variantLabel) {
  const ref = String(referenceUrl || '').trim()
  const label = String(variantLabel || '').toLowerCase()
  if (!/^https:\/\//i.test(ref) || !label) return null
  let refColor = null
  for (const c of VARIANT_FAMILY_STRIP_WORDS) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(ref) || ref.toLowerCase().includes(`-${c}-`) || ref.toLowerCase().includes(`_${c}_`)) {
      refColor = c
      break
    }
  }
  if (!refColor) return null
  let newColor = null
  for (const c of VARIANT_FAMILY_STRIP_WORDS) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(label)) {
      newColor = c
      break
    }
  }
  if (!newColor || newColor === refColor) return null
  const re = new RegExp(refColor, 'gi')
  if (!re.test(ref)) return null
  return ref.replace(new RegExp(refColor, 'gi'), newColor)
}

function sanitizeReferenceListing(ref) {
  if (!ref || typeof ref !== 'object') return null
  const summary = String(ref.summary || '').trim()
  if (!summary) return null
  const imageUrl = ref.image_url != null ? String(ref.image_url).trim() : ''
  return {
    ean: ref.ean ? String(ref.ean).replace(/\D/g, '').slice(0, 20) : null,
    name: String(ref.name || '').trim().slice(0, 200),
    summary: summary.slice(0, 500),
    description: String(ref.description || '').trim().slice(0, 4000),
    image_url: imageUrl && /^https:\/\//i.test(imageUrl) ? imageUrl.slice(0, 500) : null
  }
}

async function resolveEnrichmentImage(parsed, { referenceListing, variantLabel }) {
  let imageMeta = await validateEnrichmentImage(parsed)
  if (imageMeta.image_url || !referenceListing?.image_url) return imageMeta
  const guessed = guessVariantImageUrl(referenceListing.image_url, variantLabel)
  if (!guessed || isUndesirableProductImageUrl(guessed)) return imageMeta
  const ok = await verifyImageUrl(guessed)
  if (!ok) return imageMeta
  return { image_url: guessed, image_rejected: null, variant_from_reference: true }
}

export function isUndesirableProductImageUrl(urlStr) {
  try {
    const u = new URL(urlStr)
    const path = u.pathname.toLowerCase()
    const full = urlStr.toLowerCase()
    if (/isokuva\.php/i.test(path)) return true
    if (/\.php\?.*\bimg=/i.test(full)) return true
    if (/watermark|preview-only|stockphoto|\/marketplace\/|ebay\.|ebayimg\./i.test(full)) return true
    return false
  } catch {
    return true
  }
}

const IMAGE_PROBE_HEADERS = {
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; DiceBastionShopBot/1.0; +https://dicebastion.com)'
}

/** Normalise model output to a fetchable https URL when possible. */
export function normalizeEnrichmentImageUrl(raw) {
  let s = String(raw || '').trim()
  if (!s) return null
  if (/^http:\/\//i.test(s)) s = `https://${s.slice(7)}`
  if (!/^https:\/\//i.test(s)) return null
  try {
    return new URL(s).href.slice(0, 500)
  } catch {
    return null
  }
}

function probeResponseOk(status) {
  return status === 200 || status === 206
}

/** True when Content-Type or leading bytes look like a raster image. */
export function looksLikeImageBytes(bytes) {
  if (!bytes || bytes.length < 4) return false
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  }
  return false
}

function contentTypeLooksLikeImage(contentType) {
  const ct = String(contentType || '').toLowerCase().split(';')[0].trim()
  if (!ct) return false
  if (ct.startsWith('image/')) return true
  if (ct === 'application/octet-stream' || ct === 'binary/octet-stream') return false
  return false
}

async function readLeadingBytes(res, maxLen = 8192) {
  if (!res.body) {
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf, 0, Math.min(buf.byteLength, maxLen))
  }
  const reader = res.body.getReader()
  try {
    const { value, done } = await reader.read()
    if (done || !value) return new Uint8Array(0)
    return value.subarray(0, Math.min(value.length, maxLen))
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* ignore */
    }
  }
}

async function probeImageResponse(res) {
  if (!probeResponseOk(res.status)) return false
  if (contentTypeLooksLikeImage(res.headers.get('content-type'))) return true
  const ct = String(res.headers.get('content-type') || '').toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/json')) return false
  const bytes = await readLeadingBytes(res)
  return looksLikeImageBytes(bytes)
}

export async function verifyImageUrl(url) {
  const normalized = normalizeEnrichmentImageUrl(url)
  if (!normalized) return false

  try {
    const ranged = await fetch(normalized, {
      method: 'GET',
      headers: { ...IMAGE_PROBE_HEADERS, Range: 'bytes=0-8191' },
      redirect: 'follow'
    })
    if (await probeImageResponse(ranged)) return true
  } catch {
    /* try fallbacks */
  }

  try {
    const head = await fetch(normalized, {
      method: 'HEAD',
      headers: IMAGE_PROBE_HEADERS,
      redirect: 'follow'
    })
    if (probeResponseOk(head.status) && contentTypeLooksLikeImage(head.headers.get('content-type'))) {
      return true
    }
  } catch {
    /* ignore */
  }

  try {
    const full = await fetch(normalized, {
      method: 'GET',
      headers: IMAGE_PROBE_HEADERS,
      redirect: 'follow'
    })
    return probeImageResponse(full)
  } catch {
    return false
  }
}

async function validateEnrichmentImage(parsed) {
  const raw = parsed?.image_url != null ? String(parsed.image_url).trim() : ''
  const normalized = normalizeEnrichmentImageUrl(raw)
  if (!normalized) {
    return { image_url: null, image_rejected: raw ? 'invalid_url' : 'none' }
  }
  if (isUndesirableProductImageUrl(normalized)) {
    return { image_url: null, image_rejected: 'undesirable_source' }
  }
  const ok = await verifyImageUrl(normalized)
  if (!ok) return { image_url: null, image_rejected: 'fetch_failed' }
  return { image_url: normalized, image_rejected: null }
}

/**
 * Equal per-unit cost split: parent line total divided by sum of child quantities.
 */
export function allocateSplitUnitCosts(parentUnitCostPence, parentQuantity, childQuantities) {
  const unitCost = parseInt(parentUnitCostPence, 10)
  const parentQty = parseInt(parentQuantity, 10)
  if (!Number.isFinite(unitCost) || !Number.isFinite(parentQty) || parentQty <= 0) {
    return (childQuantities || []).map(() => null)
  }
  const totalPence = unitCost * parentQty
  const qtys = (childQuantities || []).map((q) => {
    const n = parseInt(q, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  })
  const sumQty = qtys.reduce((a, b) => a + b, 0)
  if (!sumQty) return qtys.map(() => null)
  const perUnit = Math.round(totalPence / sumQty)
  return qtys.map((q) => (q > 0 ? perUnit : null))
}

export function normalizeSplitLines(rawLines, defaultQuantity) {
  const defQty = parseInt(defaultQuantity, 10) > 0 ? parseInt(defaultQuantity, 10) : 1
  const out = []
  for (const line of rawLines || []) {
    if (!line || typeof line !== 'object') continue
    const name = String(line.name || '').trim()
    if (!name) continue
    let qty = line.quantity != null ? parseInt(line.quantity, 10) : defQty
    if (!Number.isFinite(qty) || qty <= 0) qty = defQty
    const eanRaw = line.ean != null ? String(line.ean).trim() : ''
    const ean = eanRaw ? normalizeGtin(eanRaw) : null
    out.push({
      name,
      sku: line.sku != null ? String(line.sku).trim() : null,
      quantity: qty,
      ean
    })
  }
  return out
}

export async function expandSplitFromText(apiKey, { text, default_quantity }) {
  if (!apiKey) {
    return { error: 'missing_mistral_key', message: 'Mistral API key is required.' }
  }
  const blob = String(text || '').trim()
  if (!blob) return { error: 'missing_text', message: 'Paste distributor line text to expand.' }

  const chat = await callMistralChatJson(apiKey, {
    system:
      'You parse distributor invoice or pick-list text into individual sellable product lines. ' +
      'Extract SKU prefix and product title from each line. Do not invent EAN/GTIN values unless they appear in the text.',
    user:
      'Parse every product line from this text into JSON lines with name, optional sku, optional quantity, optional ean:\n\n' +
      blob,
    schemaName: 'split_lines',
    schema: SPLIT_LINES_SCHEMA,
    model: SPLIT_EXPAND_MODEL
  })
  if (chat.error) return chat

  const lines = normalizeSplitLines(chat.parsed?.lines, default_quantity)
  if (!lines.length) {
    return { error: 'no_lines', message: 'No product lines could be parsed from the text.' }
  }
  return { success: true, lines }
}

export async function generateListingCopy(apiKey, { name, ean, category, reference_listing }) {
  if (!apiKey) {
    return { error: 'missing_mistral_key', message: 'Mistral API key is required.' }
  }
  const title = String(name || '').trim()
  if (!title) return { error: 'missing_name', message: 'Product name is required.' }

  const eanNorm = ean ? String(ean).replace(/\D/g, '') : ''
  const ref = sanitizeReferenceListing(reference_listing)
  const userPromptLen = buildListingCopyUserPrompt({
    name: title,
    ean,
    category,
    reference_listing: ref
  }).length
  const started = Date.now()
  console.log(
    `[invoice-import/generate-copy] start name=${logCopyLabel(title)} ean=${eanNorm ? eanNorm.slice(0, 20) : 'none name_search'} variant_ref=${ref ? 'yes' : 'no'} prompt_user_chars=${userPromptLen}`
  )

  let parsed = null
  let copySource = 'web_search'
  const webStarted = Date.now()
  const researched = await callMistralWebSearchListingCopy(apiKey, {
    name: title,
    ean,
    category,
    reference_listing: ref
  })
  const webMs = Date.now() - webStarted

  if (researched.parsed) {
    parsed = researched.parsed
    console.log(`[invoice-import/generate-copy] web_search ok ms=${webMs} copy_source=web_search`)
  } else {
    console.log(
      `[invoice-import/generate-copy] web_search failed ms=${webMs} error=${researched.error || 'invalid_mistral_response'}`
    )
    const chatStarted = Date.now()
    const chat = await callMistralChatJson(apiKey, {
      system: LISTING_ENRICHMENT_INSTRUCTIONS,
      user: buildListingCopyUserPrompt({ name: title, ean, category, reference_listing: ref }),
      schemaName: 'listing_enrichment',
      schema: LISTING_ENRICHMENT_SCHEMA,
      model: LISTING_COPY_MODEL
    })
    const chatMs = Date.now() - chatStarted
    if (chat.error) {
      console.log(`[invoice-import/generate-copy] chat_fallback failed ms=${chatMs} error=${chat.error}`)
      if (researched.error) return { ...researched, duration_ms: Date.now() - started }
      return { ...chat, duration_ms: Date.now() - started }
    }
    parsed = chat.parsed
    copySource = 'chat'
    console.log(`[invoice-import/generate-copy] chat_fallback ok ms=${chatMs} copy_source=chat`)
  }

  const summary = String(parsed?.summary || '').trim().slice(0, 500)
  const description = String(parsed?.description || '').trim().slice(0, 4000)
  const displayName = String(parsed?.display_name || '').trim().slice(0, 200)
  const imageMeta = await resolveEnrichmentImage(parsed, {
    referenceListing: ref,
    variantLabel: displayName || title
  })
  const confidence = Number(parsed?.confidence)
  const durationMs = Date.now() - started
  if (!summary) {
    console.log(`[invoice-import/generate-copy] invalid_copy ms=${durationMs}`)
    return { error: 'invalid_copy', message: 'Mistral returned empty summary.', duration_ms: durationMs }
  }
  console.log(
    `[invoice-import/generate-copy] done ms=${durationMs} copy_source=${copySource} name=${logCopyLabel(title)} image=${imageMeta.image_url ? 'yes' : 'no'}${imageMeta.image_rejected ? ` rejected=${imageMeta.image_rejected}` : ''}${imageMeta.variant_from_reference ? ' variant_img' : ''}`
  )
  return {
    success: true,
    display_name: displayName || undefined,
    summary,
    description,
    image_url: imageMeta.image_url,
    image_rejected: imageMeta.image_rejected || undefined,
    variant_image_from_reference: imageMeta.variant_from_reference || undefined,
    confidence: Number.isFinite(confidence) ? confidence : undefined,
    reason: parsed?.reason ? String(parsed.reason).trim().slice(0, 500) : undefined,
    product_verified: parsed?.product_verified === true,
    copy_source: copySource,
    duration_ms: durationMs,
    web_search_ms: researched.parsed ? webMs : undefined
  }
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
    return c.json(
      {
        error: 'deprecated',
        message: 'Use listing enrichment on each shop line, then upload or adjust crop if no image was applied.'
      },
      410
    )
  })

  app.post('/admin/invoice-import/expand-split', requireAdmin, requireAccountsOwner, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const apiKey = getMistralApiKey(c, body)
      const result = await expandSplitFromText(apiKey, body)
      if (result.error) {
        const status =
          result.error === 'mistral_chat_failed'
            ? 502
            : result.error === 'missing_mistral_key'
              ? 401
              : 400
        return c.json(result, status)
      }
      return c.json(result)
    } catch (e) {
      console.error('[invoice-import/expand-split] ERROR:', e)
      return c.json({ error: 'internal_error' }, 500)
    }
  })

  app.post('/admin/invoice-import/generate-copy', requireAdmin, requireAccountsOwner, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const apiKey = getMistralApiKey(c, body)
      const result = await generateListingCopy(apiKey, body)
      if (result.error) {
        const status =
          result.error === 'mistral_chat_failed'
            ? 502
            : result.error === 'missing_mistral_key'
              ? 401
              : 400
        return c.json(result, status)
      }
      return c.json(result)
    } catch (e) {
      console.error('[invoice-import/generate-copy] ERROR:', e)
      return c.json({ error: 'internal_error' }, 500)
    }
  })

  app.post('/admin/invoice-import/enrich-family', requireAdmin, requireAccountsOwner, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const apiKey = getMistralApiKey(c, body)
      const result = await enrichProductFamily(apiKey, body)
      if (result.error) {
        const status =
          result.error === 'mistral_search_failed' || result.error === 'mistral_chat_failed'
            ? 502
            : result.error === 'missing_mistral_key'
              ? 401
              : 400
        return c.json(result, status)
      }
      return c.json(result)
    } catch (e) {
      console.error('[invoice-import/enrich-family] ERROR:', e)
      return c.json({ error: 'internal_error' }, 500)
    }
  })
}
