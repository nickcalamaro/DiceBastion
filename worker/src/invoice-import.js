/**
 * Supplier invoice import via Mistral OCR (admin proxy; API key from client only).
 */

import { AsyncLocalStorage } from 'node:async_hooks'

const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr'
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions'
const MISTRAL_CONVERSATIONS_URL = 'https://api.mistral.ai/v1/conversations'

/** Outbound fetches made by the current enrichment request; Cloudflare caps them per request (50 on Workers Free). */
const fetchCounter = new AsyncLocalStorage()

export function isSubrequestLimitError(e) {
  return /too many subrequests/i.test(String((e && e.message) || e || ''))
}

async function countedFetch(url, options) {
  const run = fetchCounter.getStore()
  if (run) run.fetches += 1
  try {
    return await fetch(url, options)
  } catch (e) {
    if (run && !run.limitHitAt && isSubrequestLimitError(e)) run.limitHitAt = run.fetches
    throw e
  }
}

function withFetchCount(fn) {
  return fetchCounter.run({ fetches: 0, limitHitAt: 0 }, fn)
}

function fetchLimitHit() {
  const run = fetchCounter.getStore()
  return Boolean(run && run.limitHitAt)
}

function fetchLimitNote() {
  const run = fetchCounter.getStore()
  if (!run || !run.limitHitAt) return ''
  return `Cloudflare fetch limit reached after ${run.limitHitAt - 1} outbound requests (50 per request on Workers Free, 10,000 on Paid)`
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await countedFetch(url, { ...options, signal: controller.signal })
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
      const err = new Error(`No response within ${Math.round(timeoutMs / 1000)} seconds.`)
      err.code = 'timeout'
      throw err
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

const SPLIT_EXPAND_MODEL = 'mistral-medium-latest'
/** Chat completions with no tools. Large 4 rejects web_search, so it only writes copy from research. */
const FAMILY_COPY_MODEL = 'mistral-large-4'
const MISTRAL_COPY_TIMEOUT_MS = 300000
/** While a streamed chat answer is pending, a waiting line goes to the log this often. */
const MISTRAL_HEARTBEAT_MS = 15000
const MISTRAL_PROGRESS_CHARS_STEP = 2000
/** Conversations web search. Small 4 is the model that still accepts web_search. reasoning_effort none keeps it on one search, same shape as the remote large call. */
const LISTING_SEARCH_MODEL = 'mistral-small-2603'
/** Streamed requests fail when Mistral sends nothing for this long, however long the whole answer takes. */
const MISTRAL_STREAM_IDLE_MS = 120000
const MISTRAL_FAMILY_MAX_MS = 300000
const MISTRAL_SINGLE_MAX_MS = 180000
/** Stops a request that keeps searching without answering. Singles are asked for one search, families for at most three. */
const MISTRAL_MAX_SINGLE_WEB_SEARCHES = 3
const MISTRAL_MAX_FAMILY_WEB_SEARCHES = 3
const MISTRAL_MAX_PATTERN_WEB_SEARCHES = 3
const RANGE_PAGE_MAX_PAGES = 5
const MISTRAL_MAX_ANSWER_CHARS = 60000
const ANSWER_REPEAT_PROBE_CHARS = 80
/** Waits before retrying when Mistral reports it is over capacity. */
const MISTRAL_BUSY_RETRY_MS = [5000, 15000]
/** Collections read per family before the whole-store catalogue; shops rate-limit quick JSON requests. */
const SHOPIFY_CATALOGUE_MAX_SOURCES = 3
const SHOPIFY_JS_CONCURRENCY = 2
const LINE_LOOKUP_BATCH = 8
const LINE_LOOKUP_RETRY_BATCH = 4
/** Below this many labels, words shared by every label are as likely to be colours as the product line. */
const FAMILY_COMMON_WORDS_MIN_LABELS = 3
const LINE_LOOKUP_BATCH_CONCURRENCY = 2
/**
 * Mistral starts searches in parallel. Past the cap, searches already running still return their results;
 * more than cap times this many starts stops the stream regardless.
 */
const MISTRAL_SEARCH_CAP_CEILING = 3
const PAGE_FETCH_TIMEOUT_MS = 10000
const IMAGE_PROBE_TIMEOUT_MS = 10000
const IMAGE_LOOKUP_CONCURRENCY = 5
const PAGE_HTML_MAX_CHARS = 800000

const SHOP_CONTEXT =
  'Dice Bastion is a Gibraltar online shop for board games, trading card games (TCGs), and tabletop RPGs.\n\n'

const COPY_TONE =
  'Tone of voice (Dice Bastion site guidelines):\n' +
 
  '- Write like someone at the club counter talking to another player: friendly, plain and specific. British spelling.\n' +
  '- Say what the product is, what is in the pack, and how people use it, using facts from the sources. Do not invent praise or selling points.\n' +
  '- Numbers and specs support the description; they do not replace it.\n' +
  '- No emojis. No arrow characters. No decorative Unicode symbols. No em dashes (use a full stop, comma, or "and").\n' +
  '- Avoid marketing and AI filler: no "elevate your game", "must-have", "perfect for every player", "premium quality", or keyword stuffing.\n' +
  '- Short card summary; longer modal description in clear paragraphs.\n\n'

const SOURCE_COPY_GUIDE =
  'Stay close to the source copy:\n' +
  '- Base the summary and description on the product descriptions in the sources, the publisher or manufacturer first. Keep their descriptive detail and much of their wording, lightly edited into British English and this tone.\n' +
  '- Leave out other shops\' details: prices, stock, delivery, store names, ratings and calls to action.\n' +
  '- Do not add claims the sources do not make. When the sources say little, write less rather than filling the gap.\n\n'

const PRODUCT_TYPE_GUIDE =
  'Product-type guidance:\n' +
  '- Gaming dice (Chessex blocks, polyhedral RPG sets, speckled or gemini d6, and similar): name the brand and line, what is in the box (die types, count, colours), and typical use when sources say it (RPG, board game, wargame). Stay factual; do not call dice "essential" or "premium".\n' +
  '- Card sleeves (Ultra Pro, Dragon Shield, and similar): lead with brand, line, finish, and pack count from sources. When sources say standard size or list compatible card games, you may mention Magic: The Gathering, Riftbound and other standard TCGs once in plain language. Never claim a fit the source does not state.\n' +
  '- Other deck boxes, binders, playmats: state size or fit when a source states it. A size word alone does not authorise naming games.\n' +
  '- Name a game, card size or product as compatible only when a source says this exact product fits it. Sources often also list what a product does not fit, or compare sizes; never turn those into a fit claim. When unsure, name no games.\n' +
  '- TCG sealed product (boosters, decks, tins): use official set or product name from the EAN; do not invent card lists or pull rates.\n' +
  '- Board games and standalone card games: player count, play time, or age rating only when stated in publisher sources; never invent stats. Each title/edition is usually a distinct product — write copy for that EAN only.\n' +
  '- RPG books, adventure modules, dice sets, paints, terrain, miniatures: practical use for tabletop and RPG players; match format (hardcover, softcover, layer, scale) when sources specify.\n' +
  '- Expansions: name the base game required when publisher listings do.\n\n'

const IDENTIFY_GUIDE =
  'When an EAN/GTIN is provided, search by barcode first to identify the exact product, brand, and range.\n' +
  'Use that identification to expand distributor abbreviations and acronyms in the invoice line into full names customers recognise (e.g. invoice text "DS Matte Std" with EAN for Dragon Shield becomes "Dragon Shield"). ' +
  'Only expand abbreviations when the EAN or authoritative listings confirm the match; if unsure, keep the invoice wording and do not guess.\n\n'

const SUMMARY_GUIDE =
  'Summary (SEO-aware, same field as manual product add; max 500 characters, aim 140–160, shown as the shop card blurb and Google meta description):\n' +
  '- One or two sentences: brand and product line, plus the detail shoppers choose by (finish, pack count, die types, size). Draw wording from sources; include game names only when sources support compatibility.\n' +
  '- Natural British English keywords (e.g. Chessex, Ultra Pro, MTG, Riftbound) where they describe this product; no hype, no stuffing, no emojis.\n' +
  '- Description: 2-4 short plain-text paragraphs for the product page body, no HTML. Open with what the product is; practical specs and compatibility after.\n\n'

const SOURCES_GUIDE =
  'Sources and images:\n' +
  'Web search returns pages (title, URL, text). It does not show you images. The shop fetches the product photo from the page you cite.\n' +
  '- source_urls: up to 3 product pages from your search results for this exact EAN and edition, best first, each on a different site. Prefer the publisher or manufacturer, then major retailers. Copy each URL exactly as it appeared in the results. Empty when no result is the exact product.\n' +
  '- image_url: a direct image file URL only when that exact URL appeared in the search results text. Never construct or guess an image URL. Otherwise null.\n' +
  '- Set confidence 0-1, product_verified true only when the EAN or exact name matched a result, and reason briefly names the source.\n\n'

/** Single product: one web search, then the listing JSON. */
const LISTING_ENRICHMENT_INSTRUCTIONS =
  'You write shop listing copy. ' + SHOP_CONTEXT +
  COPY_TONE +
  'Always use web search before writing. ' + IDENTIFY_GUIDE +
  SOURCE_COPY_GUIDE +
  PRODUCT_TYPE_GUIDE +
  'Return JSON with display_name (shop product title with expanded brand/name, max 200 characters), summary, and description.\n\n' +
  SUMMARY_GUIDE +
  SOURCES_GUIDE +
  'Always use the web_search tool once per request. Respond with JSON matching the listing_enrichment schema only.'

/** Family step 1: web search for facts and pages only. Copy is written afterwards from this research. */
const FAMILY_RESEARCH_INSTRUCTIONS =
  'You research one product family for a shop listing. ' + SHOP_CONTEXT +
  'You collect facts and source pages. You do not write marketing copy.\n\n' +
  IDENTIFY_GUIDE +
  'Search budget:\n' +
  `- At most ${MISTRAL_MAX_FAMILY_WEB_SEARCHES} web searches in total. First search the product line (or the bundle EAN when one is given). Search again only to find the official range page when the first results lack it.\n` +
  '- Never search individual barcodes or individual variants. The shop finds each variant page itself from range_pages.\n' +
  '- After your searches, stop and return family_research JSON.\n\n' +
  'Research rules:\n' +
  '- The barcodes decide the manufacturer. Do not substitute a similar product from another brand.\n' +
  '- brand: the brand name printed on the product (for example Dragon Shield, even when the publisher is Arcane Tinmen).\n' +
  '- product_line_name: the official line name including the brand, as sources name it.\n' +
  '- product_type: a short noun phrase (for example "card sleeves", "d6 dice block").\n' +
  '- line_facts: every spec the sources state that applies to all lines: size, count, dimensions, material, finish, contents, compatibility. One short factual phrase each, copied from sources. Include every one you found; do not infer or generalise. ' +
  'Keep fit and compatibility exactly as stated, including "does not fit" and size comparisons, and only when the source is about this product line.\n' +
  '- source_descriptions: up to 6 passages from the product descriptions in your results that describe the whole line (what it is, theme, setting, characters, contents, what it is for, legality), the publisher or manufacturer first. ' +
  'Copy the wording as it appears, each prefixed with its site, for example "wizards.com: ...". Leave out passages about only one variant and other shops\' prices, stock or delivery. Empty when none appeared.\n' +
  '- lines has one entry per input key (L1, L2, ...). Answer each key for the product listed under that key.\n' +
  '- variant_label: the part of the title that differs between lines (e.g. "Apple Green", or "Translucent Red/White" when finishes also differ).\n' +
  '- range_pages: up to 3 official manufacturer or publisher pages that list the variants of this line (a collection, category or range page), copied exactly from your results. Empty when none appeared.\n' +
  '- source_urls per line: only pages already in your results that are that line\'s own product page. Usually empty. Do not reuse one variant\'s page for another and do not search to fill it.\n' +
  '- image_url per line: a direct image file URL only when that exact URL appeared in the results text. Never construct or guess one. Otherwise null.\n' +
  '- confidence 0-1, product_verified true only when the barcode or exact name matched a result, reason briefly names the source.\n\n' +
  'Respond with JSON matching the family_research schema only.'

/** Family step 2: no tools. Writes one shared template from the research JSON. */
const FAMILY_COPY_INSTRUCTIONS =
  'You write shop listing copy. ' + SHOP_CONTEXT +
  COPY_TONE +
  PRODUCT_TYPE_GUIDE +
  'You receive research JSON for one product family: brand, product line, product type, line_facts, source_descriptions, search result snippets, and the variant labels.\n' +
  SOURCE_COPY_GUIDE +
  '- source_descriptions are the source copy to follow. Search result snippets back them up; use a snippet only when it describes this product line, not a single variant or another product.\n' +
  '- Write from that research only. Every spec you state must appear in line_facts or the source descriptions. Use the specs customers care about after the descriptive copy.\n' +
  '- All variants share the same summary_template and description_paragraphs. Use the {variant} placeholder where the variant label belongs.\n' +
  '- naming_pattern uses {product_line_name} and {variant} only (e.g. "{product_line_name} — {variant}").\n' +
  '- product_line_name: the research product_line_name, tidied for a shop title.\n\n' +
  SUMMARY_GUIDE +
  'Respond with JSON matching the family_copy schema only.'

const PATTERN_LOOKUP_INSTRUCTIONS =
  'You find the product page for each variant of a product line. ' +
  'When a website is given, the shop already has images for sibling variants from that site and needs the same kind of page for the rest.\n' +
  `- At most ${MISTRAL_MAX_PATTERN_WEB_SEARCHES} web searches in total. With a website, search site:{website} with the product line name; ` +
  'without one, search the brand and product line name, preferring the manufacturer\'s own site. One search usually lists several variants. Never search one barcode at a time.\n' +
  '- When your results lack some lines, use your remaining searches on those lines (their variant names together) before answering. ' +
  'An item no. is the supplier\'s code and is often the manufacturer\'s own part number: search the brand with the missing lines\' item numbers when their names find nothing.\n' +
  '- A page whose URL, title or product code shows the line\'s item no. is that line\'s page, even when its colour or variant wording differs from the line name.\n' +
  '- page_url per line: this exact variant\'s own product page (on the website when one is given), copied exactly from your results. ' +
  'Follow the URL style of any example pages. Never construct, guess or reuse a sibling\'s page. null when your results lack it.\n' +
  '- After your searches, stop and return pattern_lookup JSON only.'

export function buildPatternLookupSchema(keys) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      lines: {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(
          keys.map((k) => [
            k,
            {
              type: 'object',
              additionalProperties: false,
              properties: { page_url: { type: ['string', 'null'] } },
              required: ['page_url']
            }
          ])
        ),
        required: keys
      }
    },
    required: ['lines']
  }
}

export function buildPatternLookupUserPrompt({ host, brand, productLineName, examples, missing }) {
  return [
    host ? `Website: ${host}` : 'Website: none given',
    brand ? `Brand: ${brand}` : '',
    `Product line: ${productLineName}`,
    examples.length ? 'Example pages on that site for sibling variants:' : '',
    ...examples.map((u) => `- ${u}`),
    '',
    `Find the product page${host ? ' on that site' : ''} for each line (answer each key in lines{}):`,
    ...missing.map(
      (m) => `- ${m.key} · EAN ${m.ean || 'none'}${m.itemCode ? ` · item no. ${m.itemCode}` : ''} · ${m.variantLabel || m.name}`
    )
  ]
    .filter((s) => s !== '')
    .join('\n')
}

async function callMistralPatternLookup(apiKey, { host, brand, productLineName, examples, missing, onProgress }) {
  const keys = missing.map((m) => m.key)
  const out = await streamMistralConversation(
    apiKey,
    {
      model: LISTING_SEARCH_MODEL,
      store: false,
      tools: [{ type: 'web_search' }],
      instructions: PATTERN_LOOKUP_INSTRUCTIONS,
      inputs: buildPatternLookupUserPrompt({ host, brand, productLineName, examples, missing }),
      completion_args: {
        temperature: 0.1,
        reasoning_effort: 'none',
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'pattern_lookup', strict: true, schema: buildPatternLookupSchema(keys) }
        }
      }
    },
    { onProgress, maxMs: MISTRAL_SINGLE_MAX_MS, maxSearches: MISTRAL_MAX_PATTERN_WEB_SEARCHES }
  )
  if (out.error) return out
  if (out.capped) return { lines: null, references: out.references, searches: out.searches, capped: true }
  const parsed = parseChatJsonContent(out.text)
  if (out.runaway && !(parsed?.lines && typeof parsed.lines === 'object')) {
    return { lines: null, references: out.references, searches: out.searches, runaway: out.runaway }
  }
  if (parsed?.lines && typeof parsed.lines === 'object') {
    return { lines: parsed.lines, references: out.references, searches: out.searches }
  }
  return { lines: null, references: out.references, searches: out.searches }
}

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

const SOURCE_URLS_SCHEMA = { type: 'array', items: { type: 'string' }, maxItems: 3 }

const LISTING_ENRICHMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    display_name: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    source_urls: SOURCE_URLS_SCHEMA,
    image_url: { type: ['string', 'null'] },
    confidence: { type: 'number' },
    reason: { type: 'string' },
    product_verified: { type: 'boolean' }
  },
  required: ['display_name', 'summary', 'description', 'source_urls', 'image_url', 'confidence', 'reason', 'product_verified']
}

const FAMILY_ENRICHMENT_MAX_LINES = 48

const LISTING_FAMILY_LINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    variant_label: { type: 'string' },
    source_urls: SOURCE_URLS_SCHEMA,
    image_url: { type: ['string', 'null'] },
    confidence: { type: 'number' },
    product_verified: { type: 'boolean' },
    reason: { type: 'string' }
  },
  required: ['variant_label', 'source_urls', 'image_url', 'confidence', 'product_verified', 'reason']
}

export function familyLineKey(index) {
  return `L${index + 1}`
}

/** One required key per input line, so the model answers every line and never retypes barcodes. */
export function buildFamilyResearchSchema(lineCount) {
  const keys = Array.from({ length: lineCount }, (_, i) => familyLineKey(i))
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      brand: { type: 'string' },
      product_line_name: { type: 'string' },
      product_type: { type: 'string' },
      line_facts: { type: 'array', items: { type: 'string' }, maxItems: 15 },
      source_descriptions: { type: 'array', items: { type: 'string' }, maxItems: 6 },
      range_pages: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      lines: {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(keys.map((k) => [k, LISTING_FAMILY_LINE_SCHEMA])),
        required: keys
      }
    },
    required: ['brand', 'product_line_name', 'product_type', 'line_facts', 'source_descriptions', 'range_pages', 'lines']
  }
}

const FAMILY_COPY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    product_line_name: { type: 'string' },
    naming_pattern: { type: 'string' },
    summary_template: { type: 'string' },
    description_paragraphs: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 }
  },
  required: ['product_line_name', 'naming_pattern', 'summary_template', 'description_paragraphs']
}

export function applyFamilyTemplate(template, variantLabel, productLineName) {
  const variant = String(variantLabel || '').trim()
  const line = String(productLineName || '').trim()
  const replace = (s) =>
    String(s || '')
      .replace(/\{variant\}/gi, variant)
      .replace(/\{product_line_name\}/gi, line)
      .replace(/\{[a-z0-9_]+\}/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  return {
    summary: replace(template.summary_template).slice(0, 500),
    description: (template.description_paragraphs || []).map(replace).filter(Boolean).join('\n\n').slice(0, 4000),
    display_name: replace(template.naming_pattern).slice(0, 200)
  }
}

function normalizeFamilyInputLines(rawLines) {
  const out = []
  for (const line of rawLines || []) {
    if (!line || typeof line !== 'object') continue
    const name = String(line.name || '').trim()
    if (!name) continue
    const ean = line.ean != null ? normalizeGtin(String(line.ean)) : null
    out.push({ name, ean, itemCode: normalizeItemCode(line.sku) || leadingItemCode(name) })
  }
  return out
}

/**
 * A code written before the product name, as split bundle lines often are ("1x 27830 Vortex ...").
 * At least 5 characters, so a leading year or size is not taken for a code.
 */
export function leadingItemCode(name) {
  const m = String(name || '').match(/^\s*(?:\d+\s*x\s+)?([A-Za-z0-9][A-Za-z0-9._/-]*)\s+\S/i)
  if (!m || m[1].length < 5) return null
  return normalizeItemCode(m[1])
}

export function normalizeBundle(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = String(raw.name || '').trim().slice(0, 300)
  const ean = normalizeGtin(raw.ean)
  const sku = String(raw.sku || '').trim().slice(0, 80)
  if (!name && !ean) return null
  return { name, ean, sku }
}

export function buildFamilyResearchUserPrompt(inputLines, familyHint, productFamily, bundle) {
  const hint = String(familyHint || '').trim()
  const fam =
    productFamily != null && Number.isFinite(Number(productFamily)) && Number(productFamily) > 0
      ? Number(productFamily)
      : null
  const bullets = inputLines.map(
    (l, i) => `- ${familyLineKey(i)} · EAN ${l.ean || 'none'}${l.itemCode ? ` · item no. ${l.itemCode}` : ''} · ${l.name}`
  )
  const bundleLine = bundle
    ? `These lines were split from distributor bundle: ${bundle.name || 'unnamed'}, EAN ${bundle.ean || 'none'}${bundle.sku ? `, SKU ${bundle.sku}` : ''}. Search that EAN first to identify the product line; the lines below are its individual items.`
    : ''
  return [
    'Research this product family. Every line is a variant of one product line.',
    fam != null ? `User-assigned Family #: ${fam}. Every line belongs to this one set.` : '',
    hint ? `Product line hint: ${hint}` : '',
    bundleLine,
    `Search the product line, at most ${MISTRAL_MAX_FAMILY_WEB_SEARCHES} searches in total. Collect every spec the sources state, their product descriptions of the line, and the official range page.`,
    '',
    'Lines (answer each key in lines{}):',
    ...bullets
  ]
    .filter(Boolean)
    .join('\n')
}

async function callMistralFamilyResearch(apiKey, { inputLines, familyHint, productFamily, bundle, onProgress }) {
  const userPrompt = buildFamilyResearchUserPrompt(inputLines, familyHint, productFamily, bundle)
  const out = await streamMistralConversation(
    apiKey,
    {
      model: LISTING_SEARCH_MODEL,
      store: false,
      tools: [{ type: 'web_search' }],
      instructions: FAMILY_RESEARCH_INSTRUCTIONS,
      inputs: userPrompt,
      completion_args: {
        temperature: 0.1,
        reasoning_effort: 'none',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'family_research',
            strict: true,
            schema: buildFamilyResearchSchema(inputLines.length)
          }
        }
      }
    },
    { onProgress, maxMs: MISTRAL_FAMILY_MAX_MS, maxSearches: MISTRAL_MAX_FAMILY_WEB_SEARCHES }
  )
  if (out.error) return out
  const isResearch = (p) => p?.product_line_name && p?.lines && typeof p.lines === 'object'
  if (!out.capped) {
    const parsed = parseChatJsonContent(out.text)
    if (isResearch(parsed)) {
      if (out.runaway && typeof onProgress === 'function') await onProgress('Using the first complete answer Mistral wrote')
      return { parsed, references: out.references, searches: out.searches }
    }
    if (!out.runaway) {
      return {
        error: 'invalid_mistral_response',
        message: `Mistral did not return family research JSON (${out.text.length} characters, ${out.searches} web searches).`
      }
    }
  }
  const fin = await finishFromGatheredResults(apiKey, {
    instructions: FAMILY_RESEARCH_INSTRUCTIONS,
    userPrompt,
    references: out.references,
    searches: out.searches,
    reason: out.runaway ? 'No complete answer' : null,
    schemaName: 'family_research',
    schema: buildFamilyResearchSchema(inputLines.length),
    onProgress
  })
  if (fin.error) return fin
  if (isResearch(fin.parsed)) return { parsed: fin.parsed, references: out.references, searches: out.searches }
  return { error: 'invalid_mistral_response', message: 'Mistral did not return family research JSON from the gathered results.' }
}

/** Search result snippets with text, for the copy step to draw descriptive wording from. */
export function copySnippets(references, max = 12) {
  const seen = new Set()
  const out = []
  for (const r of references || []) {
    const text = String(r?.description || '').replace(/\s+/g, ' ').trim()
    if (text.length < 40 || seen.has(text)) continue
    seen.add(text)
    out.push(`${hostOf(r.url) || 'source'}: ${String(r.title || '').trim()} · ${text.slice(0, 600)}`)
    if (out.length >= max) break
  }
  return out
}

export function buildFamilyCopyUserPrompt(research, inputLines, references = []) {
  const variants = inputLines.map((_, i) => {
    const row = research.lines[familyLineKey(i)]
    return row && row.variant_label ? String(row.variant_label).trim() : null
  })
  return [
    'Write one shared listing template for this product family from the research below.',
    '',
    JSON.stringify(
      {
        brand: research.brand,
        product_line_name: research.product_line_name,
        product_type: research.product_type,
        line_facts: research.line_facts || [],
        source_descriptions: research.source_descriptions || [],
        search_result_snippets: copySnippets(references),
        variant_labels: variants.filter(Boolean)
      },
      null,
      2
    )
  ].join('\n')
}

async function callMistralFamilyCopy(apiKey, research, inputLines, references, onProgress) {
  return callMistralChatJson(apiKey, {
    system: FAMILY_COPY_INSTRUCTIONS,
    user: buildFamilyCopyUserPrompt(research, inputLines, references),
    schemaName: 'family_copy',
    schema: FAMILY_COPY_SCHEMA,
    model: FAMILY_COPY_MODEL,
    timeoutMs: MISTRAL_COPY_TIMEOUT_MS,
    onProgress,
    progressLabel: 'Copy'
  })
}

export function enrichProductFamily(apiKey, body, onProgress) {
  return withFetchCount(() => runProductFamily(apiKey, body, onProgress))
}

async function runProductFamily(apiKey, { lines, family_hint, product_family, bundle: rawBundle }, onProgress) {
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

  const progress = async (message) => {
    if (typeof onProgress === 'function') await onProgress(message)
  }

  const bundle = normalizeBundle(rawBundle)
  const webStarted = Date.now()
  await progress(
    `Step 1 research · Family #${product_family || '?'} · ${inputLines.length} lines · up to ${MISTRAL_MAX_FAMILY_WEB_SEARCHES} web searches` +
      (bundle ? ` · from bundle ${bundle.name || ''} EAN ${bundle.ean || 'none'}` : '')
  )
  const researched = await callMistralFamilyResearch(apiKey, {
    inputLines,
    familyHint: family_hint,
    productFamily: product_family,
    bundle,
    onProgress
  })
  const webMs = Date.now() - webStarted

  const research = researched.parsed
  if (!research) {
    console.log(`[invoice-import/enrich-family] research failed ms=${webMs} error=${researched.error}`)
    return { ...researched, duration_ms: Date.now() - started }
  }
  const lineFacts = (research.line_facts || []).map((f) => String(f || '').trim()).filter(Boolean)
  console.log(`[invoice-import/enrich-family] research ok ms=${webMs} searches=${researched.searches} facts=${lineFacts.length}`)
  await progress(
    `Research returned in ${Math.round(webMs / 1000)}s · ${String(research.brand || '').trim() || 'brand unknown'} · ${String(research.product_line_name).trim()} · ${String(research.product_type || '').trim()} · ${researched.references.length} search results`
  )
  await progress(`Facts for the whole line (${lineFacts.length}): ${lineFacts.join(' | ') || 'none stated by sources'}`)
  const sourceDescriptions = (research.source_descriptions || []).map((s) => String(s || '').trim()).filter(Boolean)
  await progress(
    `Source descriptions (${sourceDescriptions.length}): ${sourceDescriptions.map((s) => s.slice(0, 160)).join(' | ') || 'none found, copy will lean on search snippets'}`
  )

  const copyStarted = Date.now()
  await progress(`Step 2 copy · writing one template from the research · ${FAMILY_COPY_MODEL}`)
  const copy = await callMistralFamilyCopy(apiKey, research, inputLines, researched.references, onProgress)
  const copyMs = Date.now() - copyStarted
  if (copy.error) {
    console.log(`[invoice-import/enrich-family] copy failed ms=${copyMs} error=${copy.error}`)
    return { ...copy, duration_ms: Date.now() - started }
  }
  const parsed = copy.parsed
  await progress(
    `Copy returned in ${Math.round(copyMs / 1000)}s · ${String(parsed.product_line_name || '').trim()} · pattern ${String(parsed.naming_pattern || '').trim()}`
  )

  const template = {
    product_line_name: String(parsed.product_line_name || research.product_line_name || '').trim().slice(0, 200),
    naming_pattern: String(parsed.naming_pattern || '{product_line_name} — {variant}').slice(0, 200),
    summary_template: String(parsed.summary_template || '').trim().slice(0, 500),
    description_paragraphs: (parsed.description_paragraphs || []).map((p) => String(p || '').trim()).filter(Boolean)
  }
  if (!template.summary_template || template.description_paragraphs.length < 2) {
    return { error: 'invalid_family_copy', message: 'Mistral returned an incomplete family template.', duration_ms: Date.now() - started }
  }

  const pageCache = new Map()
  const imagesStarted = Date.now()
  await progress('Step 3 images · reading range pages and each variant page before choosing')
  const variantLabels = inputLines.map((_, i) => {
    const row = research.lines[familyLineKey(i)]
    return row && typeof row === 'object' ? String(row.variant_label || '').trim() : ''
  })
  const familyGtins = inputLines.map((l) => normalizeGtin(l.ean)).filter(Boolean)
  const linked = await linkFamilyVariants({
    research,
    references: researched.references,
    inputLines,
    variantLabels,
    pageCache
  })
  const linkedCount = linked.assigned.filter(Boolean).length
  if (linked.rangeUrls.length) {
    const hosts = linked.rangeHosts.length ? linked.rangeHosts.join(', ') : 'none readable'
    await progress(
      `Range pages · ${hosts} (${linked.rangeUrls.length}) · ${linkedCount} of ${inputLines.length} lines linked` +
        (linked.notes.length ? ` · ${linked.notes.join('; ')}` : '')
    )
  } else {
    await progress('Range pages · none found')
  }
  for (let i = 0; i < inputLines.length; i++) {
    const a = linked.assigned[i]
    if (a) await progress(`${familyLineKey(i)} · EAN ${inputLines[i].ean || 'none'} · linked by ${a.by} · ${hostOf(a.url)}`)
  }

  const matchLines = withCommonWords(
    inputLines.map((l, i) => ({ gtin: normalizeGtin(l.ean), itemCode: l.itemCode, variantLabel: variantLabels[i] }))
  )
  const commonWords = matchLines[0].commonWords
  const searchMatches = matchSearchResults(researched.references, matchLines)
  const resultsMatched = searchMatches.filter((m) => m.length).length
  await progress(`Search results · ${researched.references.length} gathered · ${resultsMatched} of ${inputLines.length} lines matched`)
  for (let i = 0; i < inputLines.length; i++) {
    const m = searchMatches[i][0]
    if (m) {
      await progress(
        `${familyLineKey(i)} · EAN ${inputLines[i].ean || 'none'} · matched by ${m.by} · search result · ${hostOf(m.url)}` +
          (searchMatches[i].length > 1 ? ` (+${searchMatches[i].length - 1})` : '')
      )
    }
  }

  const catalogueSources = [...linked.rangeUrls]
  for (const list of searchMatches) {
    for (const m of list) {
      if (!catalogueSources.some((u) => sameSite(hostOf(u), hostOf(m.url)))) catalogueSources.push(m.url)
    }
  }
  const catalogue = await lookupShopifyCatalogue({ sourceUrls: catalogueSources, lines: matchLines, pageCache })
  const catalogueCount = catalogue.perLine.filter(Boolean).length
  if (catalogue.hosts.length) {
    await progress(
      `Shop catalogue · ${catalogue.hosts.join(', ')} · ${catalogueCount} of ${inputLines.length} lines matched` +
        (catalogue.notes.length ? ` · ${catalogue.notes.join('; ')}` : '')
    )
    for (let i = 0; i < inputLines.length; i++) {
      const c = catalogue.perLine[i]
      if (c) await progress(`${familyLineKey(i)} · EAN ${inputLines[i].ean || 'none'} · matched by ${c.by} · shop catalogue · ${hostOf(c.url)}`)
    }
  }

  const collected = await mapWithConcurrency(inputLines, IMAGE_LOOKUP_CONCURRENCY, async (input, i) => {
    const row = research.lines[familyLineKey(i)]
    if (!row || typeof row !== 'object') return null
    return collectImageCandidates({
      ean: input.ean,
      imageUrl: row.image_url,
      sourceUrls: row.source_urls,
      citedRefs: researched.references,
      variantLabel: variantLabels[i],
      pageCache,
      linkedUrl: linked.assigned[i] ? linked.assigned[i].url : null,
      rangeUrls: linked.rangeUrls,
      familyGtins,
      catalogue: catalogue.perLine[i],
      searchMatches: searchMatches[i],
      commonWords,
      itemCode: input.itemCode
    })
  })
  const sharedDropped = dropSharedImageCandidates(collected)
  if (sharedDropped) await progress(`Shared images · ${sharedDropped} image(s) offered for several lines dropped`)
  let pattern = familyImagePattern(collected.filter(Boolean).map((c) => c.candidates))
  if (!pattern) pattern = officialSiteImagePattern(collected, linked.rangeHosts)
  if (pattern) {
    await progress(
      `Family image pattern · ${pattern.host} · ${IMAGE_SLOT_LABELS[pattern.slot] || pattern.slot} · ${pattern.lines} of ${inputLines.length} lines` +
        (pattern.lines < 2 ? ' · official range site' : '')
    )
  } else {
    await progress('Family image pattern · none shared by two or more lines')
  }

  const patternLookup = await lookupLinePages(apiKey, {
    pattern,
    officialHost: linked.rangeHosts[0] || null,
    collected,
    research,
    references: researched.references,
    inputLines,
    variantLabels,
    commonWords,
    pageCache,
    onProgress,
    progress
  })
  if (patternLookup.found) {
    const again = dropSharedImageCandidates(collected)
    if (again) await progress(`Shared images · ${again} image(s) from looked-up pages offered for several lines dropped`)
    if (!pattern) {
      pattern = familyImagePattern(collected.filter(Boolean).map((c) => c.candidates))
      if (pattern) {
        await progress(
          `Family image pattern · ${pattern.host} · ${IMAGE_SLOT_LABELS[pattern.slot] || pattern.slot} · ${pattern.lines} of ${inputLines.length} lines after line lookup`
        )
      }
    }
  }

  const usedImageUrls = new Set()
  const outLines = []
  for (let i = 0; i < inputLines.length; i++) {
    const input = inputLines[i]
    const key = familyLineKey(i)
    const row = research.lines[key]
    if (!row || typeof row !== 'object') {
      await progress(`${key} · EAN ${input.ean || 'none'} · missing from Mistral JSON`)
      outLines.push({ ean: input.ean, name: input.name, error: `Mistral returned no entry for ${key}` })
      continue
    }
    const variantLabel = variantLabels[i]
    const applied = applyFamilyTemplate(template, variantLabel, template.product_line_name)
    const image = await pickListingImage(collected[i], pattern, usedImageUrls)
    await progress(imageProgressLine(key, input.ean, applied.display_name, image))
    outLines.push({
      ean: input.ean,
      name: input.name,
      display_name: applied.display_name,
      summary: applied.summary,
      description: applied.description,
      image_url: image.image_url,
      image_source: image.image_source,
      image_rejected: image.image_rejected || undefined,
      source_url: image.image_page || undefined,
      confidence: Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : undefined,
      product_verified: row.product_verified === true,
      reason: row.reason ? String(row.reason).trim().slice(0, 500) : undefined,
      variant_label: variantLabel
    })
  }
  const imagesMs = Date.now() - imagesStarted
  const fetchRun = fetchCounter.getStore()
  await progress(`Outbound requests · ${fetchRun.fetches}${fetchRun.limitHitAt ? ` · ${fetchLimitNote()}` : ''}`)

  const durationMs = Date.now() - started
  const imagesOk = outLines.filter((l) => l.image_url).length
  console.log(
    `[invoice-import/enrich-family] done ms=${durationMs} lines=${outLines.length} images=${imagesOk} fetches=${fetchRun.fetches} limit_hit_at=${fetchRun.limitHitAt}`
  )
  return {
    success: true,
    product_line_name: template.product_line_name,
    lines: outLines,
    duration_ms: durationMs,
    web_search_ms: webMs,
    debug: {
      web_searches: researched.searches,
      cited_pages: researched.references.length,
      line_facts: lineFacts.length,
      copy_ms: copyMs,
      image_pattern: pattern ? `${pattern.host} ${pattern.slot}` : null,
      range_pages: linked.rangeUrls,
      lines_linked: linkedCount,
      lines_search_matched: resultsMatched,
      lines_catalogue: catalogueCount,
      shared_images_dropped: sharedDropped,
      pattern_lookup: patternLookup,
      images_ok: imagesOk,
      images_ms: imagesMs,
      outbound_requests: fetchRun.fetches,
      fetch_limit_hit_at: fetchRun.limitHitAt || undefined,
      lines: outLines.map((l) => ({
        name: l.display_name || l.name,
        ean: l.ean,
        has_image: !!l.image_url,
        image_source: l.image_source,
        image_rejected: l.image_rejected,
        source_url: l.source_url,
        error: l.error
      }))
    }
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

/** The first balanced {...} in the text, skipping braces inside strings; null when none closes. */
export function firstJsonObject(text) {
  const s = String(text || '')
  const start = s.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (ch === '\\') i += 1
      else if (ch === '"') inString = false
    } else if (ch === '"') inString = true
    else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

export function parseChatJsonContent(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : text
  try {
    return JSON.parse(candidate)
  } catch {
    const first = firstJsonObject(text)
    if (!first) return null
    try {
      return JSON.parse(first)
    } catch {
      return null
    }
  }
}

/** The answer's opening reappears later: the model is writing the same JSON again. */
export function answerRepeats(text) {
  const t = String(text || '')
  const start = t.indexOf('{')
  if (start < 0 || t.length - start < ANSWER_REPEAT_PROBE_CHARS * 2) return false
  const head = t.slice(start, start + ANSWER_REPEAT_PROBE_CHARS)
  return t.indexOf(head, start + ANSWER_REPEAT_PROBE_CHARS) > 0
}

export function isMistralBusy(status, message) {
  return status === 429 || status === 503 || /capacity|rate limit|overloaded/i.test(String(message || ''))
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

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

/**
 * With strict JSON output Mistral sends no citation chunks; each web search's results arrive in
 * tool.execution.done as info.result, a JSON string of {id: {url, title, description, metadata: {thumbnail}}}.
 */
export function parseSearchResults(info) {
  let raw = info && info.result
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (!raw || typeof raw !== 'object') return []
  const out = []
  for (const r of Array.isArray(raw) ? raw : Object.values(raw)) {
    if (!r || typeof r !== 'object' || !r.url) continue
    const url = String(r.url)
    if (!/^https?:\/\//i.test(url)) continue
    out.push({
      url,
      title: stripTags(r.title).slice(0, 200),
      description: stripTags(r.description).slice(0, 400),
      thumbnail: r.metadata && r.metadata.thumbnail ? String(r.metadata.thumbnail) : null
    })
  }
  return out
}

function addSearchResults(state, event) {
  if (event.name && event.name !== 'web_search') return []
  const added = []
  for (const r of parseSearchResults(event.info)) {
    if (state.references.some((x) => x.url === r.url)) continue
    state.references.push(r)
    added.push(r)
  }
  return added
}

/** Applies one conversations stream event to the accumulated state. Returns a progress message or null. */
export function applyConversationEvent(state, event) {
  if (!event || typeof event !== 'object') return null
  switch (event.type) {
    case 'tool.execution.started': {
      state.searches += 1
      if (!state.searchIds) state.searchIds = {}
      if (event.id) state.searchIds[event.id] = state.searches
      return `Web search ${state.searches} running`
    }
    case 'tool.execution.done': {
      state.searchesDone = (state.searchesDone || 0) + 1
      const n = (state.searchIds && event.id && state.searchIds[event.id]) || state.searches
      const added = addSearchResults(state, event)
      const doneLine = `Web search ${n} done`
      if (!added.length) return doneLine
      return [
        `${doneLine} · ${added.length} result(s)`,
        ...added.map((r) => `Source · ${r.title.slice(0, 80) || 'page'} · ${hostOf(r.url)}`)
      ]
    }
    case 'message.output.delta': {
      const chunks = Array.isArray(event.content) ? event.content : [event.content]
      let message = null
      for (const chunk of chunks) {
        if (typeof chunk === 'string') {
          state.text += chunk
        } else if (chunk && chunk.type === 'text' && chunk.text) {
          state.text += String(chunk.text)
        } else if (chunk && chunk.type === 'tool_reference' && chunk.url) {
          const url = String(chunk.url)
          if (!state.references.some((r) => r.url === url)) {
            state.references.push({ url, title: String(chunk.title || '').slice(0, 200), description: '', thumbnail: null })
            message = `Source · ${String(chunk.title || '').trim().slice(0, 80) || 'page'} · ${hostOf(url)}`
          }
        }
      }
      if (!message && state.text.length - state.reportedChars >= 2000) {
        state.reportedChars = state.text.length
        message = `Receiving answer · ${state.text.length} characters`
      }
      return message
    }
    case 'conversation.response.error':
      state.error = String(event.message || event.error || event.detail || 'Mistral reported an error.').slice(0, 400)
      return null
    case 'conversation.response.done':
      state.done = true
      return null
    default:
      return null
  }
}

/**
 * POST /v1/conversations with stream: true. Reports each web search, cited page and copy progress as it happens.
 * Fails when Mistral goes quiet for MISTRAL_STREAM_IDLE_MS or the whole answer passes maxMs.
 */
export async function streamMistralConversation(apiKey, body, { onProgress, maxMs, maxSearches }) {
  const controller = new AbortController()
  const started = Date.now()
  let abortReason = null
  let capped = false
  let runaway = null
  let idleTimer = null
  let lastEventAt = Date.now()
  const quietTimer = setInterval(() => {
    const quiet = Date.now() - lastEventAt
    if (quiet < MISTRAL_HEARTBEAT_MS || typeof onProgress !== 'function') return
    Promise.resolve(
      onProgress(`Waiting for Mistral · ${Math.round(quiet / 1000)}s since its last update · ${Math.round((Date.now() - started) / 1000)}s in total`)
    ).catch(() => {})
  }, MISTRAL_HEARTBEAT_MS)
  const resetIdle = () => {
    lastEventAt = Date.now()
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      abortReason = `Mistral sent nothing for ${Math.round(MISTRAL_STREAM_IDLE_MS / 1000)} seconds.`
      controller.abort()
    }, MISTRAL_STREAM_IDLE_MS)
  }
  const maxTimer = setTimeout(() => {
    abortReason = `Mistral did not finish within ${Math.round(maxMs / 1000)} seconds.`
    controller.abort()
  }, maxMs)
  const state = { text: '', references: [], searches: 0, searchIds: {}, reportedChars: 0, error: null, done: false }
  const report = async (message) => {
    if (typeof onProgress !== 'function') return
    for (const m of [].concat(message || [])) if (m) await onProgress(m)
  }

  try {
    resetIdle()
    let res
    for (let attempt = 0; ; attempt++) {
      res = await countedFetch(MISTRAL_CONVERSATIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ ...body, stream: true }),
        signal: controller.signal
      })
      if (res.ok) break
      const data = await res.json().catch(() => ({}))
      const message = String(data.message || data.detail || res.statusText).slice(0, 400)
      if (attempt < MISTRAL_BUSY_RETRY_MS.length && isMistralBusy(res.status, message)) {
        const wait = MISTRAL_BUSY_RETRY_MS[attempt]
        await report(`Mistral is busy (${message}) · retrying in ${Math.round(wait / 1000)}s`)
        await new Promise((r) => setTimeout(r, wait))
        resetIdle()
        continue
      }
      return { error: 'mistral_search_failed', message }
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let dataLines = []
    while (!state.done && !state.error) {
      const { value, done } = await reader.read()
      if (done) break
      resetIdle()
      buf += decoder.decode(value, { stream: true })
      let nl = buf.indexOf('\n')
      while (nl >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, '')
        buf = buf.slice(nl + 1)
        nl = buf.indexOf('\n')
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart())
          continue
        }
        if (line !== '' || !dataLines.length) continue
        const payload = dataLines.join('\n')
        dataLines = []
        let event
        try {
          event = JSON.parse(payload)
        } catch {
          continue
        }
        await report(applyConversationEvent(state, event))
        if (state.searches > maxSearches) capped = true
        const inFlight = state.searches - (state.searchesDone || 0)
        if (capped && (inFlight <= 0 || state.searches > maxSearches * MISTRAL_SEARCH_CAP_CEILING)) {
          controller.abort()
          break
        }
        if (state.text.length > MISTRAL_MAX_ANSWER_CHARS) {
          runaway = `passed ${MISTRAL_MAX_ANSWER_CHARS} characters without finishing`
        } else if (answerRepeats(state.text)) {
          runaway = 'started repeating itself'
        }
        if (runaway) {
          controller.abort()
          break
        }
      }
    }
    try {
      await reader.cancel()
    } catch {
      /* Stream already finished. */
    }
  } catch (e) {
    if (!abortReason && !capped && !runaway) {
      return { error: 'mistral_search_failed', message: (e && e.message) || 'Mistral search request failed.' }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
    clearTimeout(maxTimer)
    clearInterval(quietTimer)
  }

  if (runaway && !abortReason) {
    console.log(
      `[invoice-import/mistral] runaway ms=${Date.now() - started} searches=${state.searches} refs=${state.references.length} chars=${state.text.length} reason=${runaway}`
    )
    await report(`Mistral's answer ${runaway} after ${state.text.length} characters · stopped`)
    return { runaway, text: state.text, references: state.references, searches: state.searches }
  }

  if (capped && !abortReason) {
    console.log(
      `[invoice-import/mistral] search cap ms=${Date.now() - started} searches=${state.searches} refs=${state.references.length}`
    )
    return { capped: true, text: state.text, references: state.references, searches: state.searches }
  }

  if (abortReason) {
    return {
      error: 'mistral_search_failed',
      message: `${abortReason} ${state.searches} web searches, ${state.text.length} characters received.`
    }
  }
  if (state.error) return { error: 'mistral_search_failed', message: state.error }
  console.log(
    `[invoice-import/mistral] stream ok ms=${Date.now() - started} searches=${state.searches} refs=${state.references.length} chars=${state.text.length}`
  )
  return { text: state.text, references: state.references, searches: state.searches }
}

function chatContentText(raw) {
  if (Array.isArray(raw)) return raw.filter((c) => c && c.type === 'text').map((c) => c.text).join('')
  return typeof raw === 'string' ? raw : ''
}

/** Reads a streamed chat completion; onChars gets the running length after each piece. */
export async function readChatCompletionStream(res, onChars) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let text = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let nl = buf.indexOf('\n')
    while (nl >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '')
      buf = buf.slice(nl + 1)
      nl = buf.indexOf('\n')
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return text
      try {
        const piece = chatContentText(JSON.parse(payload).choices?.[0]?.delta?.content)
        if (piece) {
          text += piece
          if (onChars) onChars(text.length)
        }
      } catch {
        /* Not a JSON event. */
      }
    }
  }
  return text
}

/**
 * Chat completion returning schema JSON. With onProgress the answer is streamed: the log shows characters
 * as they arrive and a waiting line every MISTRAL_HEARTBEAT_MS, so a slow model can take up to timeoutMs.
 */
async function callMistralChatJson(
  apiKey,
  {
    system,
    user,
    schemaName,
    schema,
    model = SPLIT_EXPAND_MODEL,
    timeoutMs = MISTRAL_COPY_TIMEOUT_MS,
    reasoningEffort = null,
    onProgress = null,
    progressLabel = 'Copy'
  }
) {
  const streaming = typeof onProgress === 'function'
  const controller = new AbortController()
  const started = Date.now()
  let chars = 0
  let reportedChars = 0
  const say = (m) => {
    Promise.resolve(onProgress(m)).catch(() => {})
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const heartbeat = streaming
    ? setInterval(() => {
        const secs = Math.round((Date.now() - started) / 1000)
        say(`${progressLabel} · waiting for Mistral · ${secs}s${chars ? ` · ${chars} characters received` : ''}`)
      }, MISTRAL_HEARTBEAT_MS)
    : null
  const timedOut = () => ({
    error: 'mistral_chat_failed',
    message: `Mistral did not finish within ${Math.round(timeoutMs / 1000)} seconds${chars ? ` (${chars} characters received)` : ''}.`
  })

  try {
    let res
    let content
    for (let attempt = 0; ; attempt++) {
      try {
        res = await countedFetch(MISTRAL_CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
            ...(streaming ? { stream: true } : {}),
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
          }),
          signal: controller.signal
        })
      } catch (e) {
        if (controller.signal.aborted) return timedOut()
        return { error: 'mistral_chat_failed', message: (e && e.message) || 'Mistral chat request failed.' }
      }
      if (res.ok) {
        try {
          if (streaming) {
            content = await readChatCompletionStream(res, (n) => {
              chars = n
              if (n - reportedChars >= MISTRAL_PROGRESS_CHARS_STEP) {
                reportedChars = n
                say(`${progressLabel} · receiving answer · ${n} characters`)
              }
            })
          } else {
            const data = await res.json().catch(() => ({}))
            content = chatContentText(data.choices?.[0]?.message?.content)
          }
        } catch (e) {
          if (controller.signal.aborted) return timedOut()
          return { error: 'mistral_chat_failed', message: (e && e.message) || 'Mistral chat response failed.' }
        }
        break
      }
      const data = await res.json().catch(() => ({}))
      const message = String(data.message || data.detail || res.statusText).slice(0, 400)
      if (attempt < MISTRAL_BUSY_RETRY_MS.length && isMistralBusy(res.status, message)) {
        console.log(`[invoice-import/mistral] chat busy status=${res.status} retry=${attempt + 1} message=${message}`)
        if (streaming) say(`Mistral is busy (${message}) · retrying in ${Math.round(MISTRAL_BUSY_RETRY_MS[attempt] / 1000)}s`)
        await new Promise((r) => setTimeout(r, MISTRAL_BUSY_RETRY_MS[attempt]))
        continue
      }
      return { error: 'mistral_chat_failed', message }
    }
    return finishChatJson(content)
  } finally {
    clearTimeout(timer)
    if (heartbeat) clearInterval(heartbeat)
  }
}

function finishChatJson(content) {
  const parsed = parseChatJsonContent(content)
  if (!parsed) {
    return { error: 'invalid_mistral_response', message: 'Mistral did not return valid JSON.' }
  }
  return { parsed }
}

export function formatGatheredResults(references, max = 40) {
  return (references || [])
    .slice(0, max)
    .map((r, i) => `${i + 1}. ${r.title || 'page'} · ${r.url}${r.description ? ` · ${r.description}` : ''}`)
    .join('\n')
}

/**
 * The search cap was reached while Mistral was still searching. Its results are kept, and the same
 * model writes the JSON from them with no tools, so the run continues on what was already found.
 */
async function finishFromGatheredResults(apiKey, { instructions, userPrompt, references, searches, reason = null, schemaName, schema, onProgress }) {
  if (typeof onProgress === 'function') {
    await onProgress(`${reason || `Search cap reached after ${searches} searches`} · writing research from ${references.length} gathered results`)
  }
  if (!references.length) {
    return { error: 'invalid_mistral_response', message: `Mistral ran ${searches} web searches and gathered no results.` }
  }
  const user =
    `${userPrompt}\n\nWeb search is finished. Answer from these gathered results only, copying URLs exactly:\n` +
    formatGatheredResults(references)
  return callMistralChatJson(apiKey, {
    system: instructions,
    user,
    schemaName,
    schema,
    model: LISTING_SEARCH_MODEL,
    reasoningEffort: 'none',
    onProgress: typeof onProgress === 'function' ? onProgress : null,
    progressLabel: 'Writing from gathered results'
  })
}

function buildListingCopyUserPrompt({ name, ean, category, sku }) {
  const title = String(name || '').trim()
  const eanNorm = ean ? String(ean).replace(/\D/g, '') : ''
  const lines = [`Product: ${title}`]
  if (eanNorm) lines.push(`EAN: ${eanNorm}`)
  else lines.push('EAN: none')
  const itemCode = normalizeItemCode(sku)
  if (itemCode) lines.push(`Supplier item no.: ${itemCode} (often the manufacturer's part number; search it with the brand when the EAN finds nothing)`)
  const cat = category ? String(category).trim() : ''
  if (cat) lines.push(`Categories: ${cat}`)
  lines.push('', 'Web search once, then return listing_enrichment JSON for this product.')
  return lines.join('\n')
}

async function callMistralWebSearchListingCopy(apiKey, { name, ean, category, sku, onProgress }) {
  const userPrompt = buildListingCopyUserPrompt({ name, ean, category, sku })
  const out = await streamMistralConversation(
    apiKey,
    {
      model: LISTING_SEARCH_MODEL,
      store: false,
      tools: [{ type: 'web_search' }],
      instructions: LISTING_ENRICHMENT_INSTRUCTIONS,
      inputs: userPrompt,
      completion_args: {
        temperature: 0.35,
        reasoning_effort: 'none',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'listing_enrichment',
            strict: true,
            schema: LISTING_ENRICHMENT_SCHEMA
          }
        }
      }
    },
    { onProgress, maxMs: MISTRAL_SINGLE_MAX_MS, maxSearches: MISTRAL_MAX_SINGLE_WEB_SEARCHES }
  )
  if (out.error) return out
  if (!out.capped) {
    const parsed = parseChatJsonContent(out.text)
    if (parsed && parsed.summary) return { parsed, references: out.references, searches: out.searches }
    if (!out.runaway) {
      return {
        error: 'invalid_mistral_response',
        message: `Mistral did not return listing copy JSON (${out.text.length} characters, ${out.searches} web searches).`
      }
    }
  }
  const fin = await finishFromGatheredResults(apiKey, {
    instructions: LISTING_ENRICHMENT_INSTRUCTIONS,
    userPrompt,
    references: out.references,
    searches: out.searches,
    reason: out.runaway ? 'No complete answer' : null,
    schemaName: 'listing_enrichment',
    schema: LISTING_ENRICHMENT_SCHEMA,
    onProgress
  })
  if (fin.error) return fin
  if (fin.parsed && fin.parsed.summary) return { parsed: fin.parsed, references: out.references, searches: out.searches }
  return { error: 'invalid_mistral_response', message: 'Mistral did not return listing copy JSON from the gathered results.' }
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

export function isIsbn13(ean) {
  const d = normalizeGtin(ean)
  return !!d && d.length === 13 && /^97[89]/.test(d)
}

/** Open Library serves covers keyed by ISBN; default=false makes a missing cover a 404. */
export function openLibraryCoverUrl(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
}

function decodeHtmlAttr(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .trim()
}

function absoluteUrl(raw, base) {
  try {
    return new URL(decodeHtmlAttr(raw), base).href
  } catch {
    return null
  }
}

function metaContent(html, attr, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const key = tag.match(new RegExp(`\\b${attr}\\s*=\\s*["']([^"']+)["']`, 'i'))
    if (!key || key[1].toLowerCase() !== name) continue
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)
    if (content) return content[1]
  }
  return null
}

function jsonLdProductImages(html) {
  const out = []
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    const types = [].concat(node['@type'] || [])
    if (types.some((t) => /product|book/i.test(String(t))) && node.image) {
      for (const img of [].concat(node.image)) {
        const url = typeof img === 'string' ? img : img && (img.url || img.contentUrl)
        if (url) out.push(String(url))
      }
    }
    if (node['@graph']) visit(node['@graph'])
  }
  for (const block of blocks) {
    const json = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
    try {
      visit(JSON.parse(json))
    } catch {
      /* Malformed JSON-LD on the page. */
    }
  }
  return out
}

const IMAGE_SLOT_LABELS = {
  jsonld: 'JSON-LD product image',
  og: 'og:image',
  twitter: 'twitter:image',
  direct: 'URL from search results',
  thumbnail: 'search result thumbnail',
  catalogue: 'shop catalogue image'
}

/**
 * Product photo candidates a page declares about itself, tagged with where on the page they sit:
 * JSON-LD Product image, then og:image, then twitter:image.
 */
export function extractPageImageSlots(html, pageUrl) {
  const raw = [
    ...jsonLdProductImages(html).map((url) => ({ url, slot: 'jsonld' })),
    { url: metaContent(html, 'property', 'og:image:secure_url'), slot: 'og' },
    { url: metaContent(html, 'property', 'og:image'), slot: 'og' },
    { url: metaContent(html, 'name', 'twitter:image'), slot: 'twitter' },
    { url: metaContent(html, 'property', 'twitter:image'), slot: 'twitter' }
  ].filter((c) => c.url)
  const seen = new Set()
  const out = []
  for (const c of raw) {
    const abs = absoluteUrl(c.url, pageUrl)
    const url = abs && normalizeEnrichmentImageUrl(abs)
    if (!url || seen.has(url) || isUndesirableProductImageUrl(url) || isSiteChromeImageUrl(url)) continue
    seen.add(url)
    out.push({ url, slot: c.slot })
  }
  return out
}

export function extractPageImageCandidates(html, pageUrl) {
  return extractPageImageSlots(html, pageUrl).map((c) => c.url)
}

/** Site logos and share icons that pages use as og:image when a product has no photo. */
export function isSiteChromeImageUrl(url) {
  return /share-icons|\/logo[s]?[\/._-]|favicon|placeholder|no[-_]?image|default[-_]?image|social[-_]?share/i.test(url)
}

async function fetchPageHtml(url, pageCache) {
  if (pageCache.has(url)) return pageCache.get(url)
  const pending = (async () => {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': IMAGE_PROBE_HEADERS['User-Agent']
          },
          redirect: 'follow'
        },
        PAGE_FETCH_TIMEOUT_MS
      )
      if (!res.ok) return { error: `page_${res.status}` }
      const ct = String(res.headers.get('content-type') || '').toLowerCase()
      if (ct && !ct.includes('html')) return { error: 'page_not_html' }
      const html = (await res.text()).slice(0, PAGE_HTML_MAX_CHARS)
      return { html, url: res.url || url }
    } catch (e) {
      if (isSubrequestLimitError(e)) return { error: 'fetch_limit' }
      return { error: e && e.code === 'timeout' ? 'page_timeout' : 'page_fetch_failed' }
    }
  })()
  pageCache.set(url, pending)
  return pending
}

/**
 * A cited page belongs to this family line when it shows the line's barcode or its title names the variant.
 * Single products have no siblings in the search, so every cited page is about that product.
 */
export function citedPageMatchesLine({ title, html, gtin, variantLabel, commonWords = null, itemCode = null, pageUrl = '' }) {
  if (!variantLabel) return true
  if (gtin && html.includes(gtin)) return true
  if (itemCode && pageShowsItemCode({ html, title, pageUrl, itemCode })) return true
  return variantWordsCovered(variantLabel, commonWords, new Set(wordTokens(title))).ok
}

/**
 * A supplier item number (often the maker's part number) used for matching. Short or letter-only codes
 * would match unrelated text, so it needs at least 4 characters including a digit.
 */
export function normalizeItemCode(raw) {
  const s = String(raw || '').trim()
  if (s.length < 4 || s.length > 32 || !/\d/.test(s) || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(s)) return null
  return s
}

/** The code appears as a whole token (not inside a longer number or word). */
export function textHasItemCode(text, code) {
  if (!code || !text) return false
  const escaped = code.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, 'i').test(String(text))
}

/**
 * The page is this item's own page: its code is in the page URL, title, product data (sku/mpn), or the
 * page's own product image file. Codes elsewhere in the body may belong to related products.
 */
export function pageShowsItemCode({ html, title, pageUrl, itemCode }) {
  if (!itemCode) return false
  if (textHasItemCode(pageUrl, itemCode) || textHasItemCode(title, itemCode)) return true
  const escaped = itemCode.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  const data = new RegExp(
    `"(?:sku|mpn|productID)"\\s*:\\s*"${escaped}"|itemprop=["']?(?:sku|mpn)["']?[^>]*content=["']${escaped}["']`,
    'i'
  )
  if (data.test(String(html || ''))) return true
  return extractPageImageSlots(String(html || ''), pageUrl || 'https://invalid.local/').some((s) => textHasItemCode(s.url, itemCode))
}

/** A page listing two or more of the family's barcodes describes the range, so its own photo fits no single variant. */
export function isRangePageForFamily(html, familyGtins) {
  let found = 0
  for (const g of familyGtins || []) {
    if (g && html.includes(g)) found += 1
    if (found >= 2) return true
  }
  return false
}

function stripTags(s) {
  return decodeHtmlAttr(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function sameSite(a, b) {
  return a.replace(/^www\./, '') === b.replace(/^www\./, '')
}

const NON_PRODUCT_LINK =
  /\/(cart|basket|checkout|account|login|register|wishlist|compare|search|blog|contact|pages?)(\/|$)|[?&](page|sort[^=]*|order[^=]*|filter[^=]*|q)=|\/page\/\d+/i

const PRODUCT_PATH = /\/(products?|p|item|items|dp|shop\/[^/]+)\/[^/?#]+/i
const CATEGORY_PATH = /\/(collections|category|categories|c)\/[^/?#]+\/?$/i

/**
 * A URL that points at one product: Shopify /products/x, /product/x, /p/x, Amazon /dp/x, a root-level
 * product slug (/opaque-blackwhite-12mm-d6-dice-block), or any URL carrying a family barcode.
 */
export function isProductLikeUrl(url, familyGtins = []) {
  let path
  try {
    path = new URL(url).pathname
  } catch {
    return false
  }
  if ((familyGtins || []).some((g) => g && url.includes(g))) return true
  if (CATEGORY_PATH.test(path) && !/\/products?\//i.test(path)) return false
  if (PRODUCT_PATH.test(path)) return true
  const segments = path.split('/').filter(Boolean)
  return segments.length === 1 && segments[0].split(/[-_]+/).filter(Boolean).length >= 3
}

/** Same-site product links on a range page, with the anchor text, title and image alt as their label. Menu and category links are dropped. */
export function extractProductLinks(html, pageUrl, familyGtins = []) {
  const base = hostOf(pageUrl)
  const byUrl = new Map()
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html))) {
    const attrs = m[1]
    const href = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href[1].trim())) continue
    const abs = absoluteUrl(href[1], pageUrl)
    if (!abs) continue
    let u
    try {
      u = new URL(abs)
    } catch {
      continue
    }
    u.hash = ''
    const url = u.href
    if (!/^https?:$/.test(u.protocol) || !sameSite(u.host, base) || NON_PRODUCT_LINK.test(url)) continue
    if (!isProductLikeUrl(url, familyGtins)) continue
    if (url.replace(/\/$/, '') === String(pageUrl).replace(/#.*$/, '').replace(/\/$/, '')) continue
    const title = attrs.match(/\btitle\s*=\s*["']([^"']+)["']/i)
    const alts = [...m[2].matchAll(/\balt\s*=\s*["']([^"']+)["']/gi)].map((a) => a[1])
    const text = [stripTags(m[2]), title ? decodeHtmlAttr(title[1]) : '', ...alts.map(decodeHtmlAttr)].filter(Boolean).join(' ')
    const prev = byUrl.get(url)
    byUrl.set(url, { url, text: prev ? `${prev.text} ${text}`.trim() : text })
  }
  return [...byUrl.values()]
}

/** Further pages of the same listing: rel="next" and same-path links with a page number, in page order. */
export function extractPaginationLinks(html, pageUrl) {
  let base
  try {
    base = new URL(pageUrl)
  } catch {
    return []
  }
  const basePath = base.pathname.replace(/\/page\/\d+\/?$/, '').replace(/\/$/, '')
  const found = new Map()
  const consider = (href) => {
    const abs = absoluteUrl(decodeHtmlAttr(href), pageUrl)
    if (!abs) return
    let u
    try {
      u = new URL(abs)
    } catch {
      return
    }
    if (!sameSite(u.host, base.host)) return
    const pathMatch = u.pathname.match(/^(.*?)\/page\/(\d+)\/?$/)
    const path = (pathMatch ? pathMatch[1] : u.pathname).replace(/\/$/, '')
    if (path !== basePath) return
    const n = Number(pathMatch ? pathMatch[2] : u.searchParams.get('page') || u.searchParams.get('p'))
    if (!Number.isInteger(n) || n < 2) return
    u.hash = ''
    if (!found.has(n)) found.set(n, u.href)
  }
  for (const m of html.matchAll(/<link\b[^>]*rel\s*=\s*["']next["'][^>]*>/gi)) {
    const href = m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)
    if (href) consider(href[1])
  }
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) consider(m[1])
  const current = Number(base.searchParams.get('page') || (base.pathname.match(/\/page\/(\d+)/) || [])[1] || 1)
  return [...found.entries()]
    .filter(([n]) => n !== current)
    .sort((a, b) => a[0] - b[0])
    .map(([, url]) => url)
}

/** The page's own title: og:title, else the <title> element. */
function pageTitle(html) {
  const og = metaContent(html, 'property', 'og:title')
  if (og) return decodeHtmlAttr(og)
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return t ? stripTags(t[1]) : ''
}

/**
 * Lines still missing an image source get their own page looked up. With a family pattern, on the pattern
 * site (read at the pattern slot); without one, on the official range site, or anywhere for the brand.
 * Lines go in batches so a large set (bundle items, for example) stays inside each call's search cap.
 * Added candidates go first; other sources stay as the fallback.
 */
async function lookupLinePages(
  apiKey,
  { pattern, officialHost, collected, research, references = [], inputLines, variantLabels, commonWords, pageCache, onProgress, progress }
) {
  const host = pattern ? pattern.host : officialHost || null
  const slot = pattern ? pattern.slot : null
  const gaps = []
  const examples = []
  inputLines.forEach((input, i) => {
    const c = collected[i]
    if (!c) return
    const hit = host
      ? c.candidates.find((x) => x.page && sameSite(x.host, host) && (!slot || x.slot === slot))
      : c.candidates.find((x) => x.page)
    if (hit) {
      if (host && examples.length < 3 && !examples.includes(hit.page)) examples.push(hit.page)
    } else {
      gaps.push({ i, key: familyLineKey(i), ean: input.ean, itemCode: input.itemCode, name: input.name, variantLabel: variantLabels[i] })
    }
  })
  if (!gaps.length) return { asked: 0, found: 0 }
  const where = host || `the web (${String(research.brand || '').trim() || 'brand unknown'})`
  const batches = []
  for (let b = 0; b < gaps.length; b += LINE_LOOKUP_BATCH) batches.push(gaps.slice(b, b + LINE_LOOKUP_BATCH))
  await progress(
    `Line lookup · ${where} · ${gaps.length} line(s) without an image ${host ? 'there' : 'source'} · asking Mistral for their pages` +
      (batches.length > 1 ? ` in ${batches.length} batches` : '')
  )
  const familyPages = new Set(examples)
  let found = 0
  const errors = []
  const onHost = (r) => r && r.url && (!host || sameSite(hostOf(r.url), host))
  /** Every on-site result from the research and from all lookup batches; one batch's search often lists another batch's variants. */
  const sharedPool = []
  const addToPool = (refs) => {
    for (const r of refs || []) if (onHost(r) && !sharedPool.some((p) => p.url === r.url)) sharedPool.push(r)
  }
  addToPool(references)
  const state = new Map(gaps.map((g) => [g.key, { tried: new Set(), thumbs: new Set(), problems: [] }]))
  const matchFor = (pool, lines) =>
    matchSearchResults(
      pool,
      lines.map((g) => ({ gtin: normalizeGtin(g.ean), itemCode: g.itemCode, variantLabel: g.variantLabel || '', commonWords }))
    )

  /** Tries the model's page, then matching result pages. True when a page with this variant's image was added. */
  const tryLine = async (g, rowUrl, matches) => {
    const c = collected[g.i]
    const s = state.get(g.key)
    for (const r of matches) {
      const thumb = upsizeThumbnailUrl(r.thumbnail)
      if (thumb && !s.thumbs.has(thumb) && !isSiteChromeImageUrl(thumb) && !isUndesirableProductImageUrl(thumb)) {
        s.thumbs.add(thumb)
        c.candidates.push({ url: thumb, slot: 'thumbnail', host: hostOf(r.url), page: r.url, origin: 'search_result' })
      }
    }
    const urls = []
    for (const u of [rowUrl, ...matches.slice(0, 2).map((r) => r.url)]) {
      const n = normalizeEnrichmentImageUrl(u)
      if (n && !urls.includes(n) && !s.tried.has(n)) urls.push(n)
    }
    for (const url of urls) {
      s.tried.add(url)
      if ((host && !sameSite(hostOf(url), host)) || familyPages.has(url)) {
        s.problems.push(`page rejected ${hostOf(url)}`)
        continue
      }
      const page = await fetchPageHtml(url, pageCache)
      if (page.error) {
        s.problems.push(`${hostOf(url)} ${page.error}`)
        if (page.error === 'fetch_limit') return false
        continue
      }
      if (
        !citedPageMatchesLine({
          title: pageTitle(page.html),
          html: page.html,
          gtin: c.gtin,
          variantLabel: g.variantLabel,
          commonWords,
          itemCode: g.itemCode,
          pageUrl: page.url
        })
      ) {
        s.problems.push(`${hostOf(url)} page is another variant`)
        continue
      }
      const slots = extractPageImageSlots(page.html, page.url)
      const ordered = slot ? [...slots.filter((x) => x.slot === slot), ...slots.filter((x) => x.slot !== slot)] : slots
      if (!ordered.length) {
        s.problems.push(`${hostOf(url)} page has no image`)
        continue
      }
      c.candidates.unshift(...ordered.map((x) => ({ ...x, host: hostOf(url), page: url, origin: 'pattern_lookup' })))
      found += 1
      await progress(
        `${g.key} · EAN ${g.ean || 'none'} · line lookup · page found · ${hostOf(url)}${s.problems.length ? ` (after ${s.problems.join('; ')})` : ''}`
      )
      return true
    }
    return false
  }

  /** One Mistral lookup per batch; returns the lines still without a page. */
  const lookupRound = async (lines, batchSize, label) => {
    const roundBatches = []
    for (let b = 0; b < lines.length; b += batchSize) roundBatches.push(lines.slice(b, b + batchSize))
    const left = []
    await mapWithConcurrency(roundBatches, LINE_LOOKUP_BATCH_CONCURRENCY, async (batch, bi) => {
      const tag = roundBatches.length > 1 ? `${label} ${bi + 1}/${roundBatches.length}` : label
      const looked = await callMistralPatternLookup(apiKey, {
        host,
        brand: research.brand,
        productLineName: research.product_line_name,
        examples,
        missing: batch,
        onProgress
      })
      if (looked.error) {
        errors.push(looked.message || looked.error)
        await progress(`${tag} failed · ${looked.message || looked.error}`)
        left.push(...batch)
        return
      }
      const pool = (looked.references || []).filter(onHost)
      addToPool(pool)
      const named = looked.lines ? batch.filter((g) => looked.lines[g.key] && looked.lines[g.key].page_url).length : 0
      await progress(
        `${tag} · ${looked.searches} search(es), ${pool.length} result(s) on ${where} · pages named for ${named} of ${batch.length}` +
          (looked.capped ? ' · search cap reached' : '') +
          (!looked.capped && !looked.lines ? ` · no ${looked.runaway ? 'complete ' : ''}JSON` : '')
      )
      const resultMatches = matchFor(pool, batch)
      await mapWithConcurrency(batch, IMAGE_LOOKUP_CONCURRENCY, async (g, gi) => {
        const row = looked.lines ? looked.lines[g.key] : null
        if (!(await tryLine(g, row && row.page_url, resultMatches[gi]))) left.push(g)
      })
    })
    return left
  }

  let left = await lookupRound(gaps, LINE_LOOKUP_BATCH, 'Line lookup')
  if (left.length && sharedPool.length) {
    await progress(`Line lookup · ${left.length} line(s) still without a page · checking all ${sharedPool.length} gathered results`)
    const pooled = matchFor(sharedPool, left)
    const still = []
    await mapWithConcurrency(left, IMAGE_LOOKUP_CONCURRENCY, async (g, gi) => {
      if (!(await tryLine(g, null, pooled[gi]))) still.push(g)
    })
    left = still
  }
  if (left.length && !fetchLimitHit()) {
    await progress(`Line lookup retry · ${left.length} line(s) still without a page · asking again in smaller batches`)
    left = await lookupRound(left, LINE_LOOKUP_RETRY_BATCH, 'Line lookup retry')
    if (left.length) {
      const pooled = matchFor(sharedPool, left)
      const still = []
      await mapWithConcurrency(left, IMAGE_LOOKUP_CONCURRENCY, async (g, gi) => {
        if (!(await tryLine(g, null, pooled[gi]))) still.push(g)
      })
      left = still
    }
  }
  for (const g of left.sort((a, b) => a.i - b.i)) {
    const s = state.get(g.key)
    const why = s.problems.length ? s.problems.join('; ') : `no page on ${where}`
    collected[g.i].tried.push(`line lookup ${why}`)
    await progress(`${g.key} · EAN ${g.ean || 'none'} · line lookup · ${why}${s.thumbs.size ? ', search thumbnail kept' : ', using other sources'}`)
  }
  return { asked: gaps.length, found, missing: left.length, errors: errors.length ? errors : undefined }
}

const LABEL_STOPWORDS = new Set(['in', 'the', 'of', 'and', 'with', 'for', 'a', 'an', 'w'])

/** Adjacent label words joined, as slugs write them ("black white" as blackwhite, "12 mm" as 12mm). */
function joinedLabelWords(words) {
  const out = new Set()
  for (let i = 0; i < words.length; i++) {
    let joined = words[i]
    for (let j = i + 1; j < Math.min(words.length, i + 3); j++) {
      joined += words[j]
      out.add(joined)
    }
  }
  return out
}

function labelWords(label) {
  return [...new Set(wordTokens(label).filter((w) => (w.length > 1 || /\d/.test(w)) && !LABEL_STOPWORDS.has(w)))]
}

/**
 * Words in every label of a family say what the product line is, not which variant a line is.
 * Matching requires only the remaining words; the shared ones break ties.
 */
export function familyCommonWords(labels) {
  const sets = (labels || []).filter(Boolean).map((l) => new Set(labelWords(l)))
  if (sets.length < FAMILY_COMMON_WORDS_MIN_LABELS) return new Set()
  return new Set([...sets[0]].filter((w) => sets.every((s) => s.has(w))))
}

/** Label words found as tokens, alone or as a run of adjacent words joined into one token (red white as redwhite). */
function coveredWords(words, tokens) {
  const covered = new Set()
  for (let i = 0; i < words.length; ) {
    if (tokens.has(words[i])) {
      covered.add(words[i])
      i += 1
      continue
    }
    let joined = words[i]
    let next = -1
    for (let j = i + 1; j < Math.min(words.length, i + 3); j++) {
      joined += words[j]
      if (tokens.has(joined)) {
        next = j + 1
        break
      }
    }
    if (next < 0) {
      i += 1
      continue
    }
    for (let k = i; k < next; k++) covered.add(words[k])
    i = next
  }
  return covered
}

/** Every label word appears as a token, or a run of adjacent label words appears joined as one token. */
export function labelWordsCovered(words, tokens) {
  const covered = coveredWords(words, tokens)
  return words.every((w) => covered.has(w))
}

/** The label's distinguishing words (all words when the family shares none) are all covered by these tokens. */
function variantWordsCovered(label, commonWords, tokens) {
  const all = labelWords(label)
  if (!all.length) return { ok: false, all, words: [], shared: [], covered: new Set() }
  const distinct = commonWords ? all.filter((w) => !commonWords.has(w)) : all
  const words = distinct.length ? distinct : all
  const shared = distinct.length && commonWords ? all.filter((w) => commonWords.has(w)) : []
  const covered = coveredWords(all, tokens)
  return { ok: words.every((w) => covered.has(w)), all, words, shared, covered }
}

function wordTokens(s) {
  return String(s || '')
    .replace(/[\u2122\u00ae\u00a9]/g, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function slugTokens(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return wordTokens(parts[parts.length - 1] || '')
  } catch {
    return []
  }
}

/** How well a range-page link fits one line: its barcode, else every variant word in the link text or URL slug. */
function variantLinkScore(link, line) {
  if (line.gtin && (link.url.includes(line.gtin) || link.text.includes(line.gtin) || (link.barcodeText || '').includes(line.gtin))) {
    return { score: 1000, by: 'barcode' }
  }
  if (line.itemCode && (textHasItemCode(link.url, line.itemCode) || textHasItemCode(link.text, line.itemCode))) {
    return { score: 900, by: 'item number' }
  }
  const slug = slugTokens(link.url)
  const tokens = new Set([...wordTokens(link.text), ...slug])
  const m = variantWordsCovered(line.variantLabel, line.commonWords, tokens)
  if (!m.ok) return null
  const joined = joinedLabelWords(m.all)
  const extra = slug.filter((t) => !m.all.includes(t) && !joined.has(t)).length
  const sharedHits = m.shared.filter((w) => m.covered.has(w)).length
  return { score: 100 + m.words.length * 10 + sharedHits - extra * 0.1, by: 'name' }
}

/** Attach the family's shared label words to each line for matching. */
export function withCommonWords(lines) {
  const common = familyCommonWords(lines.map((l) => l.variantLabel))
  return lines.map((l) => ({ ...l, commonWords: l.commonWords || common }))
}

/**
 * Give each line at most one range-page link and each link to at most one line.
 * Strongest matches are assigned first; when two links fit a line equally well (or one link fits two lines), neither is used.
 */
export function assignVariantLinks(links, lines) {
  const pairs = []
  lines.forEach((line, li) => {
    links.forEach((link, k) => {
      const s = variantLinkScore(link, line)
      if (s) pairs.push({ li, k, ...s })
    })
  })
  pairs.sort((a, b) => b.score - a.score)
  const out = lines.map(() => null)
  const doneLine = new Set()
  const usedLink = new Set()
  for (const p of pairs) {
    if (doneLine.has(p.li) || usedLink.has(p.k)) continue
    const lineTie = pairs.some((q) => q.li === p.li && q.k !== p.k && !usedLink.has(q.k) && q.score === p.score)
    const linkTie = pairs.some((q) => q.k === p.k && q.li !== p.li && !doneLine.has(q.li) && q.score === p.score)
    if (lineTie) {
      doneLine.add(p.li)
      continue
    }
    if (linkTie) {
      usedLink.add(p.k)
      continue
    }
    out[p.li] = { url: links[p.k].url, by: p.by }
    doneLine.add(p.li)
    usedLink.add(p.k)
  }
  return out
}

/** Shopify thumbnails carry crop and size parameters; without them the CDN serves the full image. */
export function upsizeThumbnailUrl(url) {
  const normalized = normalizeEnrichmentImageUrl(url)
  if (!normalized) return null
  if (!/cdn\.shopify\.com|\/cdn\/shop\//i.test(normalized)) return normalized
  try {
    const u = new URL(normalized)
    for (const k of ['crop', 'width', 'height']) u.searchParams.delete(k)
    return u.href
  } catch {
    return normalized
  }
}

/**
 * Search results that belong to each line. Every result showing the line's barcode counts;
 * otherwise the single tightest name match (same rules as range-page links). Category pages are ignored.
 * Returns one array per line of {url, title, thumbnail, by}.
 */
export function matchSearchResults(results, lines) {
  const familyGtins = lines.map((l) => l.gtin).filter(Boolean)
  const usable = (results || []).filter((r) => r && r.url && isProductLikeUrl(r.url, familyGtins))
  const out = lines.map(() => [])
  lines.forEach((line, li) => {
    for (const r of usable) {
      if (line.gtin && (r.url.includes(line.gtin) || (r.title || '').includes(line.gtin) || (r.description || '').includes(line.gtin))) {
        out[li].push({ ...r, by: 'barcode' })
      } else if (
        line.itemCode &&
        (textHasItemCode(r.url, line.itemCode) || textHasItemCode(r.title, line.itemCode) || textHasItemCode(r.thumbnail, line.itemCode))
      ) {
        out[li].push({ ...r, by: 'item number' })
      }
    }
  })
  const links = usable.map((r) => ({ url: r.url, text: r.title || '', barcodeText: r.description || '' }))
  const named = assignVariantLinks(links, lines)
  named.forEach((a, li) => {
    if (!a || out[li].some((r) => r.url === a.url)) return
    const r = usable.find((x) => x.url === a.url)
    if (r) out[li].push({ ...r, by: a.by })
  })
  return out
}

export function isShopifyHtml(html) {
  return /cdn\.shopify\.com|\/cdn\/shop\/|Shopify\.shop\s*=/.test(String(html || ''))
}

/** products.json for a Shopify collection page, else the whole store. */
export function shopifyCatalogueUrl(pageUrl, page = 1) {
  try {
    const u = new URL(pageUrl)
    const m = u.pathname.match(/^(.*\/collections\/[^/]+)/)
    return `${u.origin}${m ? m[1] : ''}/products.json?limit=250&page=${page}`
  } catch {
    return null
  }
}

/** Match lines to Shopify catalogue products by title words; returns one {product, by} or null per line. */
export function matchCatalogueProducts(products, lines, origin) {
  const links = products.map((p) => ({ url: `${origin}/products/${p.handle}`, text: String(p.title || '') }))
  return assignVariantLinks(links, lines).map((a) => {
    if (!a) return null
    const product = products[links.findIndex((l) => l.url === a.url)]
    return product ? { product, url: a.url, by: a.by } : null
  })
}

async function fetchJson(url) {
  try {
    const res = await fetchWithTimeout(
      url,
      { headers: { Accept: 'application/json', 'User-Agent': IMAGE_PROBE_HEADERS['User-Agent'] }, redirect: 'follow' },
      PAGE_FETCH_TIMEOUT_MS
    )
    if (!res.ok) return { error: `json_${res.status}` }
    return { data: await res.json() }
  } catch (e) {
    if (isSubrequestLimitError(e)) return { error: 'fetch_limit' }
    return { error: e && e.code === 'timeout' ? 'json_timeout' : 'json_failed' }
  }
}

/**
 * Shopify stores publish their catalogue as JSON. Read the collection (or store) products, match each
 * line by title, and confirm with the product's variant barcodes. A contradicting barcode is rejected.
 * Returns {hosts, perLine: [{url, images, by} | null], notes}.
 */
async function lookupShopifyCatalogue({ sourceUrls, lines, pageCache }) {
  const perLine = lines.map(() => null)
  const notes = []
  const hosts = []
  const doneOrigins = new Set()
  const shopifyOrigins = []
  const queue = []
  for (const u of sourceUrls) {
    const key = shopifyCatalogueUrl(u)
    if (key && !queue.some((q) => shopifyCatalogueUrl(q) === key)) queue.push(u)
  }
  queue.splice(SHOPIFY_CATALOGUE_MAX_SOURCES)
  for (let qi = 0; qi < queue.length; qi++) {
    const sourceUrl = queue[qi]
    if (perLine.every(Boolean)) break
    let origin
    try {
      origin = new URL(sourceUrl).origin
    } catch {
      continue
    }
    const key = shopifyCatalogueUrl(sourceUrl)
    if (doneOrigins.has(key)) continue
    doneOrigins.add(key)
    if (!shopifyOrigins.includes(origin)) {
      const page = await fetchPageHtml(sourceUrl, pageCache)
      if (page.error || !isShopifyHtml(page.html)) continue
      shopifyOrigins.push(origin)
      queue.push(`${origin}/`)
    }
    const products = []
    for (let n = 1; n <= 3; n++) {
      const got = await fetchJson(shopifyCatalogueUrl(sourceUrl, n))
      if (got.error) {
        notes.push(`${hostOf(sourceUrl)} catalogue ${got.error}`)
        break
      }
      const batch = Array.isArray(got.data && got.data.products) ? got.data.products : []
      products.push(...batch)
      if (batch.length < 250) break
    }
    if (!products.length) continue
    hosts.push(`${hostOf(sourceUrl)} (${products.length} products)`)
    const open = lines.map((l, i) => (perLine[i] ? { gtin: '', variantLabel: '' } : l))
    const matched = matchCatalogueProducts(products, open, origin)
    await mapWithConcurrency(matched, SHOPIFY_JS_CONCURRENCY, async (m, i) => {
      if (!m || perLine[i]) return
      const images = (m.product.images || [])
        .map((img) => normalizeEnrichmentImageUrl(absoluteUrl(img && img.src, origin)))
        .filter(Boolean)
        .slice(0, 3)
      if (!images.length) return
      let by = m.by
      if (lines[i].gtin) {
        const js = await fetchJson(`${m.url}.js`)
        const barcodes = (js.data && Array.isArray(js.data.variants) ? js.data.variants : [])
          .map((v) => normalizeGtin(v && v.barcode))
          .filter(Boolean)
        if (barcodes.length && barcodes.includes(lines[i].gtin)) by = 'barcode'
        else if (barcodes.length) {
          notes.push(`${familyLineKey(i)} ${m.product.handle} barcode differs`)
          return
        }
      }
      perLine[i] = { url: m.url, images, by }
    })
  }
  return { hosts, perLine, notes }
}

/**
 * Range pages for a family: the ones research named, plus cited pages that list two or more family barcodes.
 * Returns the links on them assigned to lines.
 */
async function linkFamilyVariants({ research, references, inputLines, variantLabels, pageCache }) {
  const familyGtins = inputLines.map((l) => normalizeGtin(l.ean)).filter(Boolean)
  const rangeUrls = []
  for (const raw of Array.isArray(research.range_pages) ? research.range_pages : []) {
    const url = normalizeEnrichmentImageUrl(raw)
    if (url && !rangeUrls.includes(url)) rangeUrls.push(url)
  }
  const pages = []
  const notes = []
  for (const url of rangeUrls.slice(0, 3)) {
    const page = await fetchPageHtml(url, pageCache)
    if (page.error) notes.push(`${hostOf(url)} ${page.error}`)
    else pages.push({ url, page })
  }
  if (familyGtins.length >= 2) {
    for (const ref of (references || []).slice(0, 6)) {
      const url = normalizeEnrichmentImageUrl(ref.url)
      if (!url || rangeUrls.includes(url)) continue
      const page = await fetchPageHtml(url, pageCache)
      if (!page.error && isRangePageForFamily(page.html, familyGtins)) {
        rangeUrls.push(url)
        pages.push({ url, page })
      }
    }
  }
  const firstPages = [...pages]
  let extraPages = 0
  for (const { page } of firstPages) {
    for (const next of extractPaginationLinks(page.html, page.url).slice(0, RANGE_PAGE_MAX_PAGES - 1)) {
      if (rangeUrls.includes(next)) continue
      const more = await fetchPageHtml(next, pageCache)
      if (more.error) {
        notes.push(`${hostOf(next)} page ${more.error}`)
        continue
      }
      rangeUrls.push(next)
      pages.push({ url: next, page: more })
      extraPages += 1
    }
  }
  if (extraPages) notes.push(`${extraPages} further listing page(s) read`)
  const links = []
  const seen = new Set()
  for (const { page } of pages) {
    for (const link of extractProductLinks(page.html, page.url, familyGtins)) {
      if (seen.has(link.url) || rangeUrls.includes(link.url)) continue
      seen.add(link.url)
      links.push(link)
    }
  }
  const lines = withCommonWords(
    inputLines.map((l, i) => ({ gtin: normalizeGtin(l.ean), itemCode: l.itemCode, variantLabel: variantLabels[i] || '' }))
  )
  return { rangeUrls, rangeHosts: [...new Set(pages.map((p) => hostOf(p.url)))], assigned: assignVariantLinks(links, lines), notes }
}

/**
 * Pass 1 for one line: read its pages and list every image they declare, without picking one yet.
 * Sources: the variant page linked from the range page, the product pages Mistral named for this line,
 * a direct URL it copied from results, then other cited pages that belong to this line.
 * Range pages only supply links. A blocked or imageless page is noted and skipped.
 */
async function collectImageCandidates({
  ean,
  imageUrl,
  sourceUrls,
  citedRefs,
  variantLabel,
  pageCache,
  linkedUrl = null,
  rangeUrls = [],
  familyGtins = [],
  catalogue = null,
  searchMatches = [],
  commonWords = null,
  itemCode = null
}) {
  const tried = []
  const candidates = []
  const gtin = normalizeGtin(ean)

  const isRange = (url, html) => rangeUrls.includes(url) || isRangePageForFamily(html, familyGtins)

  if (catalogue) {
    for (const url of catalogue.images) {
      candidates.push({ url, slot: 'catalogue', host: hostOf(catalogue.url), page: catalogue.url, origin: 'shop_catalogue' })
    }
  }

  for (const r of searchMatches || []) {
    const thumb = upsizeThumbnailUrl(r.thumbnail)
    if (!thumb || isUndesirableProductImageUrl(thumb) || isSiteChromeImageUrl(thumb)) continue
    candidates.push({ url: thumb, slot: 'thumbnail', host: hostOf(r.url), page: r.url, origin: 'search_result' })
  }

  if (linkedUrl) {
    const page = await fetchPageHtml(linkedUrl, pageCache)
    if (page.error) {
      tried.push(`${hostOf(linkedUrl)} linked page ${page.error}`)
    } else {
      const slots = extractPageImageSlots(page.html, page.url)
      if (!slots.length) tried.push(`${hostOf(linkedUrl)} linked page no_image`)
      for (const s of slots) candidates.push({ ...s, host: hostOf(linkedUrl), page: linkedUrl, origin: 'range_link' })
    }
  }

  const direct = normalizeEnrichmentImageUrl(imageUrl)
  if (direct) {
    if (isUndesirableProductImageUrl(direct)) tried.push('mistral_url undesirable')
    else candidates.push({ url: direct, slot: 'direct', host: hostOf(direct), page: null, origin: 'mistral_url' })
  }

  const named = []
  for (const raw of Array.isArray(sourceUrls) ? sourceUrls : []) {
    const url = normalizeEnrichmentImageUrl(raw)
    if (url && url !== linkedUrl && !named.includes(url)) named.push(url)
  }
  const addPage = (page, url, origin) => {
    if (isRange(url, page.html)) {
      tried.push(`${hostOf(url)} range page, not used for images`)
      return
    }
    const slots = extractPageImageSlots(page.html, page.url)
    if (!slots.length) tried.push(`${hostOf(url)} no_image`)
    for (const s of slots) candidates.push({ ...s, host: hostOf(url), page: url, origin })
  }
  for (const url of named.slice(0, 3)) {
    const page = await fetchPageHtml(url, pageCache)
    if (page.error) tried.push(`${hostOf(url)} ${page.error}`)
    else if (
      !citedPageMatchesLine({ title: pageTitle(page.html), html: page.html, gtin, variantLabel, commonWords, itemCode, pageUrl: page.url })
    ) {
      tried.push(`${hostOf(url)} named page is another variant`)
    } else addPage(page, url, 'source_page')
  }

  let checked = 0
  for (const ref of citedRefs || []) {
    if (checked >= 6) break
    const url = normalizeEnrichmentImageUrl(ref.url)
    if (!url || url === linkedUrl || named.includes(url) || rangeUrls.includes(url)) continue
    checked += 1
    const page = await fetchPageHtml(url, pageCache)
    if (page.error) {
      tried.push(`${hostOf(url)} ${page.error}`)
      continue
    }
    if (citedPageMatchesLine({ title: ref.title, html: page.html, gtin, variantLabel, commonWords, itemCode, pageUrl: page.url })) {
      addPage(page, url, 'cited_page')
    }
  }

  return { gtin, candidates, tried }
}

/**
 * The site and page position (JSON-LD, og:image, ...) that supplies images for the most lines in a family.
 * Siblings then take their photo from the same place, so the set looks consistent.
 */
export function familyImagePattern(candidateLists) {
  const counts = new Map()
  for (const list of candidateLists) {
    const keys = new Set(list.filter((c) => c.page).map((c) => `${c.host}|${c.slot}`))
    for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1)
  }
  let best = null
  for (const [k, n] of counts) {
    if (n >= 2 && (!best || n > best.lines)) {
      const [host, slot] = k.split('|')
      best = { host, slot, lines: n }
    }
  }
  return best
}

const IMAGE_ORIGIN_RANK = {
  shop_catalogue: 0,
  range_link: 1,
  pattern_lookup: 2,
  source_page: 3,
  search_result: 4,
  mistral_url: 5,
  cited_page: 6
}

/**
 * Barcode-confirmed catalogue images first, then the family pattern (same host and slot), then the
 * rest; inside each group the origin order range link, pattern page, named page, search thumbnail, cited page.
 */
/** With fewer than two lines sharing a source, one line's image on the official range site still sets the pattern. */
export function officialSiteImagePattern(collectedList, rangeHosts) {
  for (const c of collectedList || []) {
    if (!c) continue
    const hit = c.candidates.find((x) => x.page && (rangeHosts || []).some((h) => sameSite(h, x.host)))
    if (hit) return { host: hit.host, slot: hit.slot, lines: 1 }
  }
  return null
}

export function orderImageCandidates(candidates, pattern) {
  const rank = (c) => {
    if (c.origin === 'shop_catalogue') return -1
    if (pattern && c.host === pattern.host && c.slot === pattern.slot) return 0
    if (pattern && c.host === pattern.host) return 1
    return 2
  }
  const originRank = (c) => (c.origin in IMAGE_ORIGIN_RANK ? IMAGE_ORIGIN_RANK[c.origin] : 9)
  return candidates
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c) - rank(b.c) || originRank(a.c) - originRank(b.c) || a.i - b.i)
    .map((x) => x.c)
}

/**
 * Within a family each variant needs its own photo. An image URL offered for two or more lines
 * is a range or brand shot, so it is removed from every line. Returns the number of URLs dropped.
 */
export function dropSharedImageCandidates(collectedList) {
  const linesByUrl = new Map()
  collectedList.forEach((c, i) => {
    if (!c) return
    for (const cand of c.candidates) {
      if (!linesByUrl.has(cand.url)) linesByUrl.set(cand.url, new Set())
      linesByUrl.get(cand.url).add(i)
    }
  })
  const shared = new Set([...linesByUrl].filter(([, lines]) => lines.size >= 2).map(([url]) => url))
  if (!shared.size) return 0
  for (const c of collectedList) {
    if (!c) continue
    const before = c.candidates.length
    c.candidates = c.candidates.filter((cand) => !shared.has(cand.url))
    if (c.candidates.length < before) c.tried.push(`${before - c.candidates.length} image(s) shared with other lines dropped`)
  }
  return shared.size
}

/**
 * Pass 2 for one line: book cover by EAN first (978/979 barcodes), then candidates in pattern order.
 * URLs in usedImageUrls belong to an earlier line and are skipped; the chosen URL is added.
 */
async function pickListingImage(collected, pattern, usedImageUrls = null) {
  if (!collected) return { image_url: null, image_source: null, image_rejected: 'no_entry' }
  const tried = [...collected.tried]

  if (collected.gtin && isIsbn13(collected.gtin)) {
    const cover = openLibraryCoverUrl(collected.gtin)
    if (await verifyImageUrl(cover)) {
      if (usedImageUrls) usedImageUrls.add(cover)
      return { image_url: cover, image_source: 'isbn_cover' }
    }
    tried.push('book cover none')
  }

  let failed = 0
  let taken = 0
  const ordered = orderImageCandidates(collected.candidates, pattern).filter((c) => {
    if (usedImageUrls && usedImageUrls.has(c.url)) {
      taken += 1
      return false
    }
    return true
  })
  if (taken) tried.push(`${taken} image(s) already used by another line`)
  for (const c of ordered.slice(0, 6)) {
    if (fetchLimitHit()) {
      tried.push(`${ordered.length} image(s) not checked: ${fetchLimitNote()}`)
      return { image_url: null, image_source: null, image_rejected: tried.join('; ') }
    }
    if (await verifyImageUrl(c.url)) {
      if (usedImageUrls) usedImageUrls.add(c.url)
      return {
        image_url: c.url,
        image_source: c.origin,
        image_slot: c.slot,
        image_page: c.page || undefined,
        matches_pattern: pattern ? c.host === pattern.host && c.slot === pattern.slot : undefined
      }
    }
    failed += 1
  }
  if (failed) tried.push(`${failed} image(s) failed to download${fetchLimitHit() ? ` (${fetchLimitNote()})` : ''}`)
  return { image_url: null, image_source: null, image_rejected: tried.join('; ') || 'no_source' }
}

async function findListingImage(args) {
  return pickListingImage(await collectImageCandidates(args), null)
}

function imageProgressLine(key, ean, title, image) {
  const label = `${key ? `${key} · ` : ''}EAN ${ean || 'none'} · ${String(title || '').slice(0, 60)}`
  if (image.image_url) {
    const where = image.image_slot ? ` · ${IMAGE_SLOT_LABELS[image.image_slot] || image.image_slot}` : ''
    const off = image.matches_pattern === false && image.image_page ? ' · differs from family pattern' : ''
    return `Image · ${label} · ${image.image_source} · ${hostOf(image.image_page || image.image_url)}${where}${off}`
  }
  return `Image missing · ${label} · ${image.image_rejected}`
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
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
    const ranged = await fetchWithTimeout(
      normalized,
      { method: 'GET', headers: { ...IMAGE_PROBE_HEADERS, Range: 'bytes=0-8191' }, redirect: 'follow' },
      IMAGE_PROBE_TIMEOUT_MS
    )
    const ok = await probeImageResponse(ranged)
    if (ranged.body && !ranged.bodyUsed) ranged.body.cancel().catch(() => {})
    if (ok) return true
    if (ranged.status !== 416) return false
  } catch {
    return false
  }

  try {
    const head = await fetchWithTimeout(
      normalized,
      { method: 'HEAD', headers: IMAGE_PROBE_HEADERS, redirect: 'follow' },
      IMAGE_PROBE_TIMEOUT_MS
    )
    return probeResponseOk(head.status) && contentTypeLooksLikeImage(head.headers.get('content-type'))
  } catch {
    return false
  }
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

export async function generateListingCopy(apiKey, { name, ean, category, sku }, onProgress) {
  if (!apiKey) {
    return { error: 'missing_mistral_key', message: 'Mistral API key is required.' }
  }
  const title = String(name || '').trim()
  if (!title) return { error: 'missing_name', message: 'Product name is required.' }

  const eanNorm = normalizeGtin(ean)
  const started = Date.now()
  console.log(
    `[invoice-import/generate-copy] start name=${logCopyLabel(title)} ean=${eanNorm || 'none name_search'}`
  )

  if (typeof onProgress === 'function') {
    await onProgress(`Searching EAN ${eanNorm || 'none'} · ${title}`)
  }
  const webStarted = Date.now()
  const researched = await callMistralWebSearchListingCopy(apiKey, { name: title, ean, category, sku, onProgress })
  const webMs = Date.now() - webStarted

  if (!researched.parsed) {
    console.log(
      `[invoice-import/generate-copy] web_search failed ms=${webMs} error=${researched.error || 'invalid_mistral_response'}`
    )
    return { ...researched, duration_ms: Date.now() - started }
  }
  const parsed = researched.parsed
  console.log(`[invoice-import/generate-copy] web_search ok ms=${webMs} searches=${researched.searches}`)

  const summary = String(parsed.summary || '').trim().slice(0, 500)
  const description = String(parsed.description || '').trim().slice(0, 4000)
  const displayName = String(parsed.display_name || '').trim().slice(0, 200)
  if (!summary) {
    return { error: 'invalid_copy', message: 'Mistral returned empty summary.', duration_ms: Date.now() - started }
  }
  if (typeof onProgress === 'function') {
    await onProgress(
      `Copy returned in ${Math.round(webMs / 1000)}s · ${displayName || title} · pages ${(parsed.source_urls || []).map(hostOf).filter(Boolean).join(', ') || 'none'} · ${researched.references.length} search results`
    )
  }

  const named = (parsed.source_urls || []).map(normalizeEnrichmentImageUrl).filter(Boolean)
  const singleMatches = researched.references.filter(
    (r) =>
      named.includes(normalizeEnrichmentImageUrl(r.url)) ||
      (eanNorm && (r.url.includes(eanNorm) || (r.title || '').includes(eanNorm) || (r.description || '').includes(eanNorm)))
  )
  const image = await findListingImage({
    ean: eanNorm,
    imageUrl: parsed.image_url,
    sourceUrls: parsed.source_urls,
    citedRefs: researched.references,
    pageCache: new Map(),
    searchMatches: singleMatches
  })
  if (typeof onProgress === 'function') await onProgress(imageProgressLine('', eanNorm, displayName || title, image))

  const confidence = Number(parsed.confidence)
  const durationMs = Date.now() - started
  console.log(
    `[invoice-import/generate-copy] done ms=${durationMs} name=${logCopyLabel(title)} image=${image.image_source || 'none'}${image.image_rejected ? ` rejected=${image.image_rejected}` : ''}`
  )
  return {
    success: true,
    display_name: displayName || undefined,
    summary,
    description,
    image_url: image.image_url,
    image_source: image.image_source || undefined,
    image_rejected: image.image_rejected || undefined,
    source_url: image.image_page || undefined,
    confidence: Number.isFinite(confidence) ? confidence : undefined,
    reason: parsed.reason ? String(parsed.reason).trim().slice(0, 500) : undefined,
    product_verified: parsed.product_verified === true,
    copy_source: 'web_search',
    duration_ms: durationMs,
    web_search_ms: webMs
  }
}

function streamEnrichment(work) {
  const encoder = new TextEncoder()
  const body = new ReadableStream({
    async start(controller) {
      const send = async (obj) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`))
      }
      try {
        await work(send)
      } catch (e) {
        try {
          await send({ type: 'error', message: e && e.message ? e.message : 'Enrichment failed.' })
        } catch {
          /* The browser stopped reading. */
        }
      } finally {
        try {
          controller.close()
        } catch {
          /* Already closed. */
        }
      }
    }
  })
  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no'
    }
  })
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
    const body = await c.req.json().catch(() => null)
    if (!body) return c.json({ error: 'invalid_json' }, 400)
    const apiKey = getMistralApiKey(c, body)
    return streamEnrichment(async (send) => {
      const result = await generateListingCopy(apiKey, body, (message) => send({ type: 'progress', message }))
      if (result.error) await send({ type: 'error', error: result.error, message: result.message || result.error })
      else await send({ type: 'result', data: result })
    })
  })

  app.post('/admin/invoice-import/enrich-family', requireAdmin, requireAccountsOwner, async (c) => {
    const body = await c.req.json().catch(() => null)
    if (!body) return c.json({ error: 'invalid_json' }, 400)
    const apiKey = getMistralApiKey(c, body)
    return streamEnrichment(async (send) => {
      const result = await enrichProductFamily(apiKey, body, (message) => send({ type: 'progress', message }))
      if (result.error) await send({ type: 'error', error: result.error, message: result.message || result.error })
      else await send({ type: 'result', data: result })
    })
  })
}
