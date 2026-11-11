import { describe, expect, it } from 'vitest'
import {
  normalizeGtin,
  allocateSplitUnitCosts,
  normalizeSplitLines,
  isUndesirableProductImageUrl,
  normalizeVariantFamilyKey,
  applyFamilyTemplate,
  isFamilyBatchEligible,
  normalizeEnrichmentImageUrl,
  looksLikeImageBytes,
  buildFamilyResearchSchema,
  buildFamilyCopyUserPrompt,
  familyImagePattern,
  orderImageCandidates,
  applyConversationEvent,
  extractPageImageCandidates,
  isSiteChromeImageUrl,
  isIsbn13,
  openLibraryCoverUrl,
  citedPageMatchesLine,
  isRangePageForFamily,
  extractProductLinks,
  assignVariantLinks,
  dropSharedImageCandidates,
  normalizeBundle,
  buildFamilyResearchUserPrompt,
  extractPaginationLinks,
  buildPatternLookupSchema,
  buildPatternLookupUserPrompt,
  parseSearchResults,
  matchSearchResults,
  upsizeThumbnailUrl,
  isProductLikeUrl,
  matchCatalogueProducts,
  shopifyCatalogueUrl,
  isShopifyHtml,
  streamMistralConversation,
  labelWordsCovered,
  officialSiteImagePattern,
  familyCommonWords,
  withCommonWords,
  firstJsonObject,
  parseChatJsonContent,
  answerRepeats,
  isMistralBusy,
  readChatCompletionStream,
  normalizeItemCode,
  leadingItemCode,
  textHasItemCode,
  pageShowsItemCode,
  isValidGtin,
  ocrLineCodes,
  identifiedBy,
  brandAppears,
  textShowsGtin,
  buildCodeLookupUserPrompt,
  buildCodeLookupSchema,
  identifiedByCodeLines,
  dedupeFamilyLines,
  relatesToLines,
  isRangePageForFamily
} from './invoice-import.js'

describe('relatesToLines', () => {
  const lines = [
    { name: 'Matte Sleeves Purple 66x91 (100)', ean: '4251715419540', itemCode: null },
    { name: 'Sleeves Red 66x91 (100)', ean: '4251715419397', itemCode: null }
  ]
  it('keeps results showing a code or two invoice name words', () => {
    expect(relatesToLines({ url: 'https://a.example/x', title: 'Item', description: 'EAN 4251715419397' }, lines)).toBe(true)
    expect(relatesToLines({ url: 'https://b.example/y', title: 'Sleeves Purple 66x91', description: '' }, lines)).toBe(true)
  })
  it('drops phone directories and pages sharing one generic word', () => {
    expect(relatesToLines({ url: 'https://c.example', title: '425 Area Code - Location, Map', description: 'Prefixes 425-171' }, lines)).toBe(false)
    expect(relatesToLines({ url: 'https://d.example', title: 'Water sleeves', description: 'An article.' }, lines)).toBe(false)
  })
})

describe('isRangePageForFamily', () => {
  it('counts a barcode listed twice in the family once', () => {
    expect(isRangePageForFamily('<p>4251715419502</p>', ['4251715419502', '4251715419502'])).toBe(false)
    expect(isRangePageForFamily('<p>4251715419502 4251715419540</p>', ['4251715419502', '4251715419540'])).toBe(true)
  })
})

describe('dedupeFamilyLines', () => {
  it('treats lines with the same barcode or item no. as one product', () => {
    const { unique, sourceOf } = dedupeFamilyLines([
      { name: 'Sleeves Red', ean: '4251715419502', itemCode: null },
      { name: 'Sleeves Blue', ean: '4251715419540', itemCode: null },
      { name: 'Sleeves Red', ean: '4251715419502', itemCode: null },
      { name: 'Box A', ean: null, itemCode: 'GG1001' },
      { name: 'Box A again', ean: null, itemCode: 'gg1001' },
      { name: 'No code', ean: null, itemCode: null },
      { name: 'No code', ean: null, itemCode: null }
    ])
    expect(unique.map((l) => l.name)).toEqual(['Sleeves Red', 'Sleeves Blue', 'Box A', 'No code', 'No code'])
    expect(sourceOf).toEqual([0, 1, 0, 2, 2, 3, 4])
  })
})

describe('family code lookup', () => {
  it('asks for one search per line with the code on its own', () => {
    const prompt = buildCodeLookupUserPrompt('ean', [
      { key: 'L1', code: '4251715419540' },
      { key: 'L2', code: '4251715419502' }
    ])
    expect(prompt).toContain('one search per line')
    expect(prompt).toContain('- L1 · barcode "4251715419540"')
    expect(buildCodeLookupUserPrompt('sku', [{ key: 'L3', code: 'GGS10120' }])).toContain('- L3 · item no. "GGS10120"')
    expect(buildCodeLookupSchema(['L1', 'L2']).properties.lines.required).toEqual(['L1', 'L2'])
  })

  it('matches a barcode only as a whole number, including the EAN-13 form of a UPC', () => {
    expect(textShowsGtin('EAN: 0195166336343', '195166336343')).toBe(true)
    expect(textShowsGtin('ref 42517154195401', '4251715419540')).toBe(false)
  })

  it('lists the lines found by code for the research step', () => {
    const lines = identifiedByCodeLines([
      { by: 'ean', title: 'Matte Prime Sleeves Purple', url: 'https://shop.example/p/purple' },
      null,
      { by: 'sku', title: 'Prime Sleeves Red', url: 'https://shop.example/p/red' }
    ])
    expect(lines).toEqual([
      '- L1 · by EAN · Matte Prime Sleeves Purple · https://shop.example/p/purple',
      '- L3 · by item no. · Prime Sleeves Red · https://shop.example/p/red'
    ])
  })
})

describe('invoice barcodes', () => {
  it('checks the check digit of UPC-A and EAN-13 barcodes', () => {
    expect(isValidGtin('195166336343')).toBe(true)
    expect(isValidGtin('4251715419540')).toBe(true)
    expect(isValidGtin('4251715419541')).toBe(false)
    expect(isValidGtin('12345')).toBe(false)
  })

  it('moves a barcode printed in the reference column into ean', () => {
    expect(ocrLineCodes({ name: 'Matte Prime Sleeves Purple 66x91 (100)', ean: null, sku: '4251715419540' })).toEqual({
      name: 'Matte Prime Sleeves Purple 66x91 (100)',
      ean: '4251715419540',
      sku: null
    })
    expect(ocrLineCodes({ name: '195166336343 Magic The Gathering TCG Star Trek Pack de Presentacion', ean: null, sku: null })).toEqual({
      name: 'Magic The Gathering TCG Star Trek Pack de Presentacion',
      ean: '195166336343',
      sku: null
    })
  })

  it('keeps a supplier code that is not a barcode as the item code', () => {
    expect(ocrLineCodes({ name: 'Dice block', ean: null, sku: 'D07800009' })).toEqual({ name: 'Dice block', ean: null, sku: 'D07800009' })
  })
})

describe('identifiedBy', () => {
  const ref = (title, description = '', url = 'https://shop.example/p/1') => ({ url, title, description })

  it('prefers the barcode, then the item code, then the name', () => {
    expect(identifiedBy([ref('Prime Sleeves', 'EAN 4251715419540')], { ean: '4251715419540', itemCode: 'GGS10120', name: 'x' })).toBe('ean')
    expect(identifiedBy([ref('Sleeves GGS10120')], { ean: '4251715419540', itemCode: 'GGS10120', name: 'x' })).toBe('sku')
    expect(identifiedBy([ref('Matte Prime Sleeves Purple 100 pack')], { ean: null, itemCode: null, name: 'Matte Prime Sleeves Purple 66x91 (100)' })).toBe('name')
  })

  it('finds a 12-digit UPC written as a 13-digit EAN', () => {
    expect(identifiedBy([ref('Pack', 'EAN 0195166336343')], { ean: '195166336343', itemCode: null, name: 'x' })).toBe('ean')
  })

  it('does not count a similar product from another range as a match', () => {
    expect(
      identifiedBy([ref('Purple - Matte Sleeves', '', 'https://www.example.com/products/purple-matte-sleeves')], {
        ean: '4251715419540',
        itemCode: null,
        name: 'Matte Prime Sleeves Purple 66x91 (100)'
      })
    ).toBe(null)
  })
})

describe('brandAppears', () => {
  it('only accepts a brand that a search result or the invoice shows', () => {
    const refs = [{ url: 'https://shop.example/p', title: 'Matte Prime Sleeves Purple', description: 'Gamegenic sleeves' }]
    expect(brandAppears('Gamegenic', refs, [])).toBe(true)
    expect(brandAppears('Other Brand', refs, [{ name: 'Matte Prime Sleeves Purple' }])).toBe(false)
  })
})

describe('item numbers', () => {
  it('keeps codes that are distinctive enough to match on', () => {
    expect(normalizeItemCode('27830')).toBe('27830')
    expect(normalizeItemCode(' AT-11021 ')).toBe('AT-11021')
    expect(normalizeItemCode('d6')).toBe(null)
    expect(normalizeItemCode('ABCDE')).toBe(null)
    expect(normalizeItemCode('two words 123')).toBe(null)
  })

  it('reads a code written before the name', () => {
    expect(leadingItemCode('1x 27830 Vortex® 12 mm d6 Light Green/Black Dice Block™ (36 dice)')).toBe('27830')
    expect(leadingItemCode('27830 Vortex Dice')).toBe('27830')
    expect(leadingItemCode('2026 Calendar')).toBe(null)
    expect(leadingItemCode('12mm d6 Dice')).toBe(null)
    expect(leadingItemCode('Dragon Shield Matte Black')).toBe(null)
  })

  it('matches whole tokens only', () => {
    expect(textHasItemCode('https://shop.example/images/0000798_27830.jpeg', '27830')).toBe(true)
    expect(textHasItemCode('https://shop.example/p/278301-red', '27830')).toBe(false)
    expect(textHasItemCode('Item 27830, Vortex', '27830')).toBe(true)
  })

  it('accepts a page by its URL, product data or own image, not by a code elsewhere', () => {
    const own = '<html><head><meta property="og:image" content="https://cdn.example/0000798_27830.jpeg"></head></html>'
    expect(pageShowsItemCode({ html: own, title: 'Vortex Bright Green/black', pageUrl: 'https://maker.example/vortex', itemCode: '27830' })).toBe(true)
    const ld = '<script type="application/ld+json">{"@type":"Product","sku":"27830"}</script>'
    expect(pageShowsItemCode({ html: ld, title: 'Vortex', pageUrl: 'https://maker.example/v', itemCode: '27830' })).toBe(true)
    const sibling = '<html><body><a href="/other">Related: 27830</a></body></html>'
    expect(pageShowsItemCode({ html: sibling, title: 'Vortex Red', pageUrl: 'https://maker.example/red', itemCode: '27830' })).toBe(false)
  })

  it('matches a search result by item number when the name wording differs', () => {
    const out = matchSearchResults(
      [{ url: 'https://www.chessex.com/vortex-bright-greenblack', title: 'Vortex 12mm d6 Bright Green/black', thumbnail: 'https://www.chessex.com/images/thumbs/0000798_27830.jpeg' }],
      [{ gtin: null, itemCode: '27830', variantLabel: 'Light Green/Black' }]
    )
    expect(out[0].map((r) => r.by)).toEqual(['item number'])
  })

  it('lets the item number confirm a page whose colour wording differs', () => {
    const html = '<meta property="og:image" content="https://cdn.example/0000798_27830.jpeg">'
    expect(
      citedPageMatchesLine({ title: 'Vortex Bright Green/black', html, gtin: null, variantLabel: 'Light Green/Black', itemCode: '27830', pageUrl: 'https://maker.example/vortex' })
    ).toBe(true)
    expect(
      citedPageMatchesLine({ title: 'Vortex Bright Green/black', html, gtin: null, variantLabel: 'Light Green/Black', itemCode: null, pageUrl: 'https://maker.example/vortex' })
    ).toBe(false)
  })
})

describe('normalizeGtin', () => {
  it('accepts 13-digit EAN', () => {
    expect(normalizeGtin('5706569110024')).toBe('5706569110024')
  })

  it('strips formatting', () => {
    expect(normalizeGtin('5706 5691 10024')).toBe('5706569110024')
  })

  it('rejects too-short values', () => {
    expect(normalizeGtin('123')).toBeNull()
  })
})

describe('allocateSplitUnitCosts', () => {
  it('splits parent line total equally per unit across children', () => {
    expect(allocateSplitUnitCosts(1000, 2, [1, 1, 1, 1])).toEqual([500, 500, 500, 500])
  })

  it('uses sum of child quantities as divisor', () => {
    expect(allocateSplitUnitCosts(1000, 1, [2, 2])).toEqual([250, 250])
  })

  it('returns nulls when quantities are invalid', () => {
    expect(allocateSplitUnitCosts(1000, 1, [0, 0])).toEqual([null, null])
  })
})

describe('normalizeSplitLines', () => {
  it('applies default quantity and normalizes EAN', () => {
    const lines = normalizeSplitLines(
      [{ name: 'Dice Set', ean: '5706 5691 10024', quantity: null }],
      3
    )
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(3)
    expect(lines[0].ean).toBe('5706569110024')
  })
})

describe('isUndesirableProductImageUrl', () => {
  it('rejects marketplace-style URLs', () => {
    expect(isUndesirableProductImageUrl('https://cdn.example.com/watermark-preview.jpg')).toBe(true)
  })

  it('accepts plain CDN product paths', () => {
    expect(isUndesirableProductImageUrl('https://cdn.example.com/products/sleeves.png')).toBe(false)
  })
})

describe('normalizeEnrichmentImageUrl', () => {
  it('upgrades http to https', () => {
    expect(normalizeEnrichmentImageUrl('http://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
  })
})

describe('looksLikeImageBytes', () => {
  it('detects JPEG magic', () => {
    expect(looksLikeImageBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe(true)
  })
})

describe('normalizeVariantFamilyKey', () => {
  it('strips bracket and parenthetical segments for grouping hints', () => {
    const a = normalizeVariantFamilyKey('Widget Pro [Matte] (100 pack)')
    const b = normalizeVariantFamilyKey('Widget Pro [Gloss] (100 pack)')
    expect(a).toBe(b)
    expect(a.length).toBeGreaterThan(5)
  })

  it('does not merge unrelated product titles', () => {
    const a = normalizeVariantFamilyKey('Dragon Shield Standard Sleeves')
    const b = normalizeVariantFamilyKey('Chessex Opaque Dice Block')
    expect(a).not.toBe(b)
  })
})

describe('applyFamilyTemplate', () => {
  it('substitutes variant and product line placeholders', () => {
    const template = {
      naming_pattern: '{product_line_name} — {variant}',
      summary_template: 'Premium {variant} accessory.',
      description_paragraphs: ['Variant: {variant}.', 'Line: {product_line_name}.']
    }
    const out = applyFamilyTemplate(template, 'Blue', 'Example Product Line')
    expect(out.display_name).toBe('Example Product Line — Blue')
    expect(out.summary).toBe('Premium Blue accessory.')
  })

  it('drops unknown brace tokens from the shop title', () => {
    const template = {
      naming_pattern: '{brand} {line} {variant}',
      summary_template: '{brand} dice in {variant}.',
      description_paragraphs: ['Pack: {variant}.']
    }
    const out = applyFamilyTemplate(template, 'Red/White (36 dice)', 'Chessex Gemini')
    expect(out.display_name).toBe('Red/White (36 dice)')
    expect(out.display_name).not.toMatch(/\{/)
    expect(out.summary).not.toMatch(/\{/)
  })
})

describe('buildFamilyResearchSchema', () => {
  it('requires one keyed entry per input line plus the shared facts', () => {
    const schema = buildFamilyResearchSchema(3)
    expect(schema.properties.lines.required).toEqual(['L1', 'L2', 'L3'])
    expect(schema.properties.lines.additionalProperties).toBe(false)
    expect(schema.properties.lines.properties.L2.required).toContain('source_urls')
    expect(schema.required).toEqual(['brand', 'product_line_name', 'product_type', 'line_facts', 'source_descriptions', 'range_pages', 'lines'])
    expect(schema.properties.range_pages.maxItems).toBe(3)
  })
})

describe('buildFamilyCopyUserPrompt', () => {
  it('passes the source descriptions and descriptive search snippets to the copy step', () => {
    const research = {
      brand: 'Magic: The Gathering',
      product_line_name: 'Magic: The Gathering Star Trek Play Booster Display',
      product_type: 'booster display',
      line_facts: ['30 Play Boosters'],
      source_descriptions: ['wizards.com: A Universes Beyond set dedicated to the Star Trek universe, legal in all formats.'],
      lines: { L1: { variant_label: 'English' }, L2: { variant_label: 'German' } }
    }
    const refs = [
      { url: 'https://shop.example/st', title: 'Star Trek Display', description: 'Captains such as James T. Kirk, Spock and Jean-Luc Picard face the Borg Queen and Q.' },
      { url: 'https://other.example/st', title: 'Short', description: 'Buy now' }
    ]
    const json = JSON.parse(buildFamilyCopyUserPrompt(research, [{}, {}], refs).split('\n').slice(2).join('\n'))
    expect(json.source_descriptions[0]).toContain('Universes Beyond')
    expect(json.search_result_snippets).toEqual([
      'shop.example: Star Trek Display · Captains such as James T. Kirk, Spock and Jean-Luc Picard face the Borg Queen and Q.'
    ])
    expect(json.variant_labels).toEqual(['English', 'German'])
  })
})

describe('familyImagePattern', () => {
  const c = (host, slot) => ({ url: `https://${host}/${slot}.jpg`, slot, host, page: `https://${host}/p`, origin: 'source_page' })

  it('picks the site and page position shared by the most lines', () => {
    const lists = [
      [c('dragonshield.com', 'jsonld'), c('amazon.co.uk', 'og')],
      [c('dragonshield.com', 'jsonld')],
      [c('amazon.co.uk', 'og'), c('dragonshield.com', 'jsonld')]
    ]
    expect(familyImagePattern(lists)).toEqual({ host: 'dragonshield.com', slot: 'jsonld', lines: 3 })
  })

  it('returns null when no two lines share a source', () => {
    expect(familyImagePattern([[c('a.com', 'og')], [c('b.com', 'og')]])).toBeNull()
  })

  it('orders a line so the family pattern is tried first', () => {
    const pattern = { host: 'dragonshield.com', slot: 'jsonld', lines: 2 }
    const ordered = orderImageCandidates([c('amazon.co.uk', 'og'), c('dragonshield.com', 'og'), c('dragonshield.com', 'jsonld')], pattern)
    expect(ordered.map((x) => `${x.host} ${x.slot}`)).toEqual(['dragonshield.com jsonld', 'dragonshield.com og', 'amazon.co.uk og'])
  })
})

describe('citedPageMatchesLine', () => {
  it('accepts any cited page for a single product', () => {
    expect(citedPageMatchesLine({ title: 'Anything', html: '', gtin: '9780786969517', variantLabel: '' })).toBe(true)
  })

  it('accepts a family page that shows this barcode or names this variant', () => {
    expect(citedPageMatchesLine({ title: 'Sleeves', html: '<p>5706569110024</p>', gtin: '5706569110024', variantLabel: 'Matte Black' })).toBe(true)
    expect(citedPageMatchesLine({ title: 'Dragon Shield Matte Black Sleeves', html: '', gtin: '5706569110024', variantLabel: 'Matte Black' })).toBe(true)
  })

  it('rejects a sibling variant page', () => {
    expect(citedPageMatchesLine({ title: 'Dragon Shield Matte Blue Sleeves', html: '<p>5706569110031</p>', gtin: '5706569110024', variantLabel: 'Matte Black' })).toBe(false)
  })
})

describe('isRangePageForFamily', () => {
  const gtins = ['5706569110024', '5706569110031', '5706569110598']
  it('treats a page listing two or more family barcodes as a range page', () => {
    expect(isRangePageForFamily('<p>5706569110024</p><p>5706569110031</p>', gtins)).toBe(true)
  })
  it('keeps a page that shows only one family barcode', () => {
    expect(isRangePageForFamily('<p>5706569110024</p>', gtins)).toBe(false)
    expect(isRangePageForFamily('<p>5706569110024</p>', [])).toBe(false)
  })
})

describe('extractProductLinks', () => {
  const page = 'https://www.dragonshield.com/collections/matte-sleeves'
  it('collects same-site product links with text, title and image alt, once each', () => {
    const html =
      '<a href="/products/matte-black"><img alt="Matte Black sleeves" src="x.jpg"></a>' +
      '<a href="/products/matte-black#reviews">Matte Black</a>' +
      '<a href="https://dragonshield.com/products/matte-blue" title="Matte Blue">Shop</a>' +
      '<a href="https://other.com/products/matte-red">Matte Red</a>'
    const links = extractProductLinks(html, page)
    expect(links.map((l) => l.url)).toEqual([
      'https://www.dragonshield.com/products/matte-black',
      'https://dragonshield.com/products/matte-blue'
    ])
    expect(links[0].text).toContain('Matte Black sleeves')
    expect(links[1].text).toContain('Matte Blue')
  })
  it('skips cart, account, filter and pagination links', () => {
    const html =
      '<a href="/cart">Cart</a><a href="/account/login">Login</a>' +
      '<a href="/collections/matte-sleeves?page=2">2</a><a href="/collections/matte-sleeves?sort_by=price">Sort</a>' +
      '<a href="/page/3">3</a><a href="#top">Top</a><a href="mailto:a@b.com">Mail</a>'
    expect(extractProductLinks(html, page)).toEqual([])
  })
})

describe('assignVariantLinks', () => {
  const links = [
    { url: 'https://s.com/products/matte-black-100', text: 'Matte Black' },
    { url: 'https://s.com/products/matte-blue-100', text: 'Matte Blue' },
    { url: 'https://s.com/products/sleeve-5706569110598', text: 'Sleeves' }
  ]
  it('links by barcode first, then by every variant word', () => {
    const out = assignVariantLinks(links, [
      { gtin: '5706569110024', variantLabel: 'Matte Black' },
      { gtin: '5706569110598', variantLabel: 'Petrol' },
      { gtin: '5706569110031', variantLabel: 'Matte Blue' }
    ])
    expect(out[0]).toEqual({ url: 'https://s.com/products/matte-black-100', by: 'name' })
    expect(out[1]).toEqual({ url: 'https://s.com/products/sleeve-5706569110598', by: 'barcode' })
    expect(out[2]).toEqual({ url: 'https://s.com/products/matte-blue-100', by: 'name' })
  })
  it('gives a link to one line only and leaves equal ties unassigned', () => {
    const tied = [
      { url: 'https://s.com/products/black-a', text: 'Black' },
      { url: 'https://s.com/products/black-b', text: 'Black' }
    ]
    expect(assignVariantLinks(tied, [{ gtin: '', variantLabel: 'Black' }])).toEqual([null])
    const one = [{ url: 'https://s.com/products/red', text: 'Red' }]
    expect(assignVariantLinks(one, [{ gtin: '', variantLabel: 'Red' }, { gtin: '', variantLabel: 'Red' }])).toEqual([null, null])
  })
  it('prefers the tighter slug when one label is a subset of another', () => {
    const out = assignVariantLinks(
      [
        { url: 'https://s.com/products/blood-red', text: 'Blood Red' },
        { url: 'https://s.com/products/red', text: 'Red' }
      ],
      [{ gtin: '', variantLabel: 'Red' }, { gtin: '', variantLabel: 'Blood Red' }]
    )
    expect(out[0].url).toBe('https://s.com/products/red')
    expect(out[1].url).toBe('https://s.com/products/blood-red')
  })
})

describe('dropSharedImageCandidates', () => {
  it('removes an image offered for two or more lines from every line', () => {
    const c = (url) => ({ url, slot: 'og', host: 's.com', page: 'https://s.com/p', origin: 'cited_page' })
    const list = [
      { gtin: '1', candidates: [c('https://s.com/range.jpg'), c('https://s.com/black.jpg')], tried: [] },
      { gtin: '2', candidates: [c('https://s.com/range.jpg'), c('https://s.com/blue.jpg')], tried: [] },
      null
    ]
    expect(dropSharedImageCandidates(list)).toBe(1)
    expect(list[0].candidates.map((x) => x.url)).toEqual(['https://s.com/black.jpg'])
    expect(list[1].candidates.map((x) => x.url)).toEqual(['https://s.com/blue.jpg'])
    expect(list[0].tried[0]).toMatch(/shared with other lines/)
  })
})

describe('extractPaginationLinks', () => {
  it('finds further pages of the same listing in page order', () => {
    const html =
      '<link rel="next" href="/collections/dice?page=2">' +
      '<a href="/collections/dice?page=3">3</a><a href="/collections/dice?page=2">2</a>' +
      '<a href="/collections/other?page=2">Other</a><a href="/collections/dice?page=1">1</a>'
    expect(extractPaginationLinks(html, 'https://shop.com/collections/dice')).toEqual([
      'https://shop.com/collections/dice?page=2',
      'https://shop.com/collections/dice?page=3'
    ])
  })
  it('understands /page/N paths', () => {
    const html = '<a href="https://www.shop.com/range/page/2/">2</a>'
    expect(extractPaginationLinks(html, 'https://shop.com/range/')).toEqual(['https://www.shop.com/range/page/2/'])
  })
})

describe('pattern lookup', () => {
  it('asks for one page per missing line on the pattern site', () => {
    const schema = buildPatternLookupSchema(['L2', 'L5'])
    expect(schema.properties.lines.required).toEqual(['L2', 'L5'])
    expect(schema.properties.lines.properties.L5.required).toEqual(['page_url'])
    const prompt = buildPatternLookupUserPrompt({
      host: 'www.chessex.com',
      productLineName: 'Chessex Gemini Dice',
      examples: ['https://www.chessex.com/p/gemini-red-white'],
      missing: [{ key: 'L2', ean: '601982000123', name: 'Gemini Blue/Gold', variantLabel: 'Blue/Gold' }]
    })
    expect(prompt).toContain('Website: www.chessex.com')
    expect(prompt).toContain('- https://www.chessex.com/p/gemini-red-white')
    expect(prompt).toContain('- L2 · EAN 601982000123 · Blue/Gold')
  })
})

const dsResult = (handle, title, thumb) => ({
  url: `https://www.dragonshield.com/products/${handle}`,
  title,
  description: '',
  metadata: { thumbnail: thumb }
})

describe('parseSearchResults', () => {
  it('reads url, title, description and thumbnail from tool.execution.done info.result', () => {
    const info = {
      result: JSON.stringify({
        a: dsResult('black-matte-sleeves', 'Black - Matte Sleeves – Dragon Shield', 'http://www.dragonshield.com/cdn/shop/files/s.png?crop=center&height=480&width=480'),
        b: { url: 'javascript:void(0)', title: 'bad' }
      })
    }
    expect(parseSearchResults(info)).toEqual([
      {
        url: 'https://www.dragonshield.com/products/black-matte-sleeves',
        title: 'Black - Matte Sleeves – Dragon Shield',
        description: '',
        thumbnail: 'http://www.dragonshield.com/cdn/shop/files/s.png?crop=center&height=480&width=480'
      }
    ])
    expect(parseSearchResults({ result: 'not json' })).toEqual([])
  })

  it('stores results and numbers parallel searches by execution id', () => {
    const state = { text: '', references: [], searches: 0, searchIds: {}, reportedChars: 0, error: null, done: false }
    applyConversationEvent(state, { type: 'tool.execution.started', name: 'web_search', id: 'x1' })
    applyConversationEvent(state, { type: 'tool.execution.started', name: 'web_search', id: 'x2' })
    const msgs = applyConversationEvent(state, {
      type: 'tool.execution.done',
      name: 'web_search',
      id: 'x1',
      info: { result: JSON.stringify({ a: dsResult('blue-matte-sleeves', 'Blue - Matte Sleeves', null) }) }
    })
    expect(msgs[0]).toBe('Web search 1 done · 1 result(s)')
    expect(msgs[1]).toMatch(/^Source · Blue - Matte Sleeves · www\.dragonshield\.com/)
    expect(state.references).toHaveLength(1)
  })
})

describe('upsizeThumbnailUrl', () => {
  it('drops Shopify crop and size parameters and forces https', () => {
    expect(upsizeThumbnailUrl('http://www.dragonshield.com/cdn/shop/files/s.png?crop=center&height=480&v=17&width=480')).toBe(
      'https://www.dragonshield.com/cdn/shop/files/s.png?v=17'
    )
    expect(upsizeThumbnailUrl('https://cdn.example.com/p.jpg?width=480')).toBe('https://cdn.example.com/p.jpg?width=480')
  })
})

describe('isProductLikeUrl', () => {
  it('keeps product pages and drops menu and category links', () => {
    expect(isProductLikeUrl('https://www.dragonshield.com/products/black-matte-sleeves')).toBe(true)
    expect(isProductLikeUrl('https://www.dragonshield.com/collections/black-sleeves')).toBe(false)
    expect(isProductLikeUrl('https://www.dragonshield.com/collections/matte/products/black-matte-sleeves')).toBe(true)
    expect(isProductLikeUrl('https://shop.com/about')).toBe(false)
    expect(isProductLikeUrl('https://shop.com/item-5706569110024.html', ['5706569110024'])).toBe(true)
  })

  it('removes collection links from range pages', () => {
    const html =
      '<a href="/collections/black-sleeves">Black Sleeves</a><a href="/products/black-matte-sleeves">Black - Matte Sleeves</a>'
    expect(extractProductLinks(html, 'https://www.dragonshield.com/collections/matte-sleeves').map((l) => l.url)).toEqual([
      'https://www.dragonshield.com/products/black-matte-sleeves'
    ])
  })
})

describe('matchSearchResults', () => {
  const results = [
    { url: 'https://www.dragonshield.com/products/blue-matte-sleeves', title: 'Blue - Matte Sleeves', description: '', thumbnail: 't1' },
    { url: 'https://www.dragonshield.com/products/midnight-blue-matte-sleeves', title: 'Midnight Blue - Matte Sleeves', description: '', thumbnail: 't2' },
    { url: 'https://shop.com/p/ds-ivory', title: 'Dragon Shield sleeves', description: 'EAN 5706569110178', thumbnail: 't3' },
    { url: 'https://www.dragonshield.com/collections/blue-sleeves', title: 'Blue Sleeves', description: '', thumbnail: 't4' }
  ]
  it('matches by barcode first, then the tightest name, ignoring category pages', () => {
    const out = matchSearchResults(results, [
      { gtin: '5706569110031', variantLabel: 'Blue' },
      { gtin: '5706569110178', variantLabel: 'Ivory' }
    ])
    expect(out[0].map((r) => [r.url, r.by])).toEqual([['https://www.dragonshield.com/products/blue-matte-sleeves', 'name']])
    expect(out[1].map((r) => [r.url, r.by])).toEqual([['https://shop.com/p/ds-ivory', 'barcode']])
  })
})

describe('name matching with slug-style words', () => {
  it('matches joined slug words and ignores trademark signs and filler words', () => {
    const links = [
      { url: 'https://www.chessex.com/opaque-blackwhite-12mm-d6-dice-block-36-dice', text: '' },
      { url: 'https://www.chessex.com/opaque-blackgold-12mm-d6-dice-block-36-dice', text: '' }
    ]
    const out = assignVariantLinks(links, [
      { gtin: '', variantLabel: 'Opaque 12 mm d6 Black/White Dice Block™' },
      { gtin: '', variantLabel: 'Opaque 12 mm d6 Black/Gold Dice Block™ in' }
    ])
    expect(out[0].url).toBe(links[0].url)
    expect(out[1].url).toBe(links[1].url)
    expect(labelWordsCovered(['black', 'white'], new Set(['blackwhite']))).toBe(true)
    expect(labelWordsCovered(['black', 'white'], new Set(['black']))).toBe(false)
  })

  it('treats root-level product slugs as product pages', () => {
    expect(isProductLikeUrl('https://www.chessex.com/opaque-blackwhite-12mm-d6-dice-block-36-dice')).toBe(true)
    expect(isProductLikeUrl('https://www.chessex.com/about-us')).toBe(false)
  })

  it('takes the official range site as the pattern when only one line found an image there', () => {
    const list = [
      { candidates: [{ url: 'https://www.ebay.com/i.jpg', slot: 'og', host: 'www.ebay.com', page: 'https://www.ebay.com/itm/1' }] },
      { candidates: [{ url: 'https://www.chessex.com/x.jpeg', slot: 'jsonld', host: 'www.chessex.com', page: 'https://www.chessex.com/p' }] }
    ]
    expect(officialSiteImagePattern(list, ['chessex.com'])).toEqual({ host: 'www.chessex.com', slot: 'jsonld', lines: 1 })
    expect(officialSiteImagePattern(list, [])).toBeNull()
  })
})

describe('family shared words', () => {
  it('finds the words every label shares', () => {
    const common = familyCommonWords([
      'Opaque 12 mm d6 Black/White Dice Block™',
      'Gemini® 12 mm d6 Blue-Purple/Gold Dice Block',
      'Speckled 12 mm d6 Space Dice Block'
    ])
    expect([...common].sort()).toEqual(['12', 'block', 'd6', 'dice', 'mm'])
    expect(familyCommonWords(['Red/White', 'Blue/White']).size).toBe(0)
  })

  it('matches a product whose title lacks the shared words', () => {
    const lines = withCommonWords([
      { gtin: '', variantLabel: 'Boros Legion Matte Dual Art Sleeves' },
      { gtin: '', variantLabel: 'Izzet League Matte Dual Art Sleeves' },
      { gtin: '', variantLabel: 'Golgari Swarm Matte Dual Art Sleeves' }
    ])
    const out = matchCatalogueProducts(
      [
        { handle: 'guildpact-series-boros-legion-matte-dual-art-sleeves', title: 'Guildpact Series - Boros Legion - Matte Dual Art Sleeves', images: [] },
        { handle: 'guildpact-series-izzet-league', title: 'Guildpact Series - Izzet League', images: [] }
      ],
      lines,
      'https://www.dragonshield.com'
    )
    expect(out[0].url).toBe('https://www.dragonshield.com/products/guildpact-series-boros-legion-matte-dual-art-sleeves')
    expect(out[1].url).toBe('https://www.dragonshield.com/products/guildpact-series-izzet-league')
  })

  it('uses shared words to prefer the right size', () => {
    const lines = withCommonWords([
      { gtin: '', variantLabel: 'Opaque 12 mm d6 Red/White Dice Block' },
      { gtin: '', variantLabel: 'Opaque 12 mm d6 Blue/White Dice Block' },
      { gtin: '', variantLabel: 'Speckled 12 mm d6 Space Dice Block' }
    ])
    const out = assignVariantLinks(
      [
        { url: 'https://www.chessex.com/opaque-redwhite-16mm-d6-dice-block-12-dice', text: '' },
        { url: 'https://www.chessex.com/opaque-redwhite-12mm-d6-dice-block-36-dice', text: '' }
      ],
      lines
    )
    expect(out[0].url).toBe('https://www.chessex.com/opaque-redwhite-12mm-d6-dice-block-36-dice')
  })

  it('rejects a named page for a different colour', () => {
    const commonWords = familyCommonWords([
      'Opaque 12 mm d6 Green/White Dice Block',
      'Opaque 12 mm d6 Red/White Dice Block',
      'Opaque 12 mm d6 Black/Gold Dice Block'
    ])
    expect(commonWords.has('white')).toBe(false)
    expect(
      citedPageMatchesLine({ title: 'Opaque Black-Green 12mm d6 Dice Block (36 dice)', html: '', gtin: null, variantLabel: 'Opaque 12 mm d6 Green/White Dice Block', commonWords })
    ).toBe(false)
    expect(
      citedPageMatchesLine({ title: 'Opaque Green/White 12mm d6 Dice Block (36 dice)', html: '', gtin: null, variantLabel: 'Opaque 12 mm d6 Green/White Dice Block', commonWords })
    ).toBe(true)
  })
})

describe('Shopify catalogue', () => {
  it('builds products.json for a collection or the store', () => {
    expect(shopifyCatalogueUrl('https://www.dragonshield.com/collections/matte-sleeves?page=2', 2)).toBe(
      'https://www.dragonshield.com/collections/matte-sleeves/products.json?limit=250&page=2'
    )
    expect(shopifyCatalogueUrl('https://www.dragonshield.com/products/black-matte-sleeves')).toBe(
      'https://www.dragonshield.com/products.json?limit=250&page=1'
    )
    expect(isShopifyHtml('<link href="//cdn.shopify.com/s/files/x.css">')).toBe(true)
    expect(isShopifyHtml('<html></html>')).toBe(false)
  })

  it('matches products by title with the tightest handle winning', () => {
    const products = [
      { handle: 'midnight-blue-matte-sleeves', title: 'Midnight Blue - Matte Sleeves', images: [] },
      { handle: 'blue-matte-sleeves', title: 'Blue - Matte Sleeves', images: [] },
      { handle: 'amber-matte-sleeves-1', title: 'Amber - Matte Sleeves', images: [] }
    ]
    const out = matchCatalogueProducts(
      products,
      [{ gtin: '', variantLabel: 'Blue' }, { gtin: '', variantLabel: 'Amber' }, { gtin: '', variantLabel: 'Ivory' }],
      'https://www.dragonshield.com'
    )
    expect(out[0].product.handle).toBe('blue-matte-sleeves')
    expect(out[1].url).toBe('https://www.dragonshield.com/products/amber-matte-sleeves-1')
    expect(out[2]).toBeNull()
  })
})

describe('streamMistralConversation search cap', () => {
  it('returns the gathered results instead of failing when the cap is passed', async () => {
    const events = [
      { type: 'tool.execution.started', name: 'web_search', id: 'a' },
      { type: 'tool.execution.done', name: 'web_search', id: 'a', info: { result: JSON.stringify({ r: dsResult('black-matte-sleeves', 'Black', null) }) } },
      { type: 'tool.execution.started', name: 'web_search', id: 'b' },
      { type: 'tool.execution.started', name: 'web_search', id: 'c' },
      { type: 'tool.execution.done', name: 'web_search', id: 'b', info: { result: JSON.stringify({ r: dsResult('blue-matte-sleeves', 'Blue', null) }) } },
      { type: 'tool.execution.done', name: 'web_search', id: 'c', info: { result: '{}' } }
    ]
    const sse = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
    const realFetch = globalThis.fetch
    globalThis.fetch = async (_url, init) =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode(sse))
            init.signal.addEventListener('abort', () => c.error(new Error('aborted')))
          }
        }),
        { status: 200 }
      )
    try {
      const out = await streamMistralConversation('k', {}, { maxMs: 5000, maxSearches: 2 })
      expect(out.capped).toBe(true)
      expect(out.searches).toBe(3)
      expect(out.references.map((r) => r.url)).toEqual([
        'https://www.dragonshield.com/products/black-matte-sleeves',
        'https://www.dragonshield.com/products/blue-matte-sleeves'
      ])
    } finally {
      globalThis.fetch = realFetch
    }
  })
})

describe('runaway answers', () => {
  const answer = JSON.stringify({ brand: 'Dragon Shield', product_line_name: 'Dragon Shield Guildpact Series', lines: { L1: { variant_label: 'Boros "Legion" {x}' } } })

  it('parses the first complete JSON object when the model repeats it', () => {
    const repeated = `${answer}\n\nhelp.md \`\`\`json ${answer}\`\`\` \`\`\`json {"brand": "Dra`
    expect(firstJsonObject(repeated)).toBe(answer)
    expect(parseChatJsonContent(repeated).lines.L1.variant_label).toBe('Boros "Legion" {x}')
    expect(firstJsonObject('{"a": {"b": 1}')).toBeNull()
  })

  it('spots an answer whose opening appears again', () => {
    expect(answerRepeats(answer)).toBe(false)
    expect(answerRepeats(`${answer} more ${answer.slice(0, 120)}`)).toBe(true)
    expect(answerRepeats('```json\n' + answer + '\n```')).toBe(false)
  })

  it('treats capacity and rate-limit replies as busy', () => {
    expect(isMistralBusy(429, '')).toBe(true)
    expect(isMistralBusy(400, 'Service tier capacity exceeded for this model.')).toBe(true)
    expect(isMistralBusy(422, 'Invalid schema')).toBe(false)
  })

  it('stops a repeating stream and keeps the gathered results', async () => {
    const events = [
      { type: 'tool.execution.started', name: 'web_search', id: 'a' },
      { type: 'tool.execution.done', name: 'web_search', id: 'a', info: { result: JSON.stringify({ r: dsResult('black-matte-sleeves', 'Black', null) }) } },
      { type: 'message.output.delta', content: answer },
      { type: 'message.output.delta', content: ' help.md ```json ' },
      { type: 'message.output.delta', content: answer }
    ]
    const sse = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
    const realFetch = globalThis.fetch
    globalThis.fetch = async (_url, init) =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode(sse))
            init.signal.addEventListener('abort', () => c.error(new Error('aborted')))
          }
        }),
        { status: 200 }
      )
    try {
      const out = await streamMistralConversation('k', {}, { maxMs: 5000, maxSearches: 3 })
      expect(out.error).toBeUndefined()
      expect(out.runaway).toBe('started repeating itself')
      expect(out.references).toHaveLength(1)
      expect(parseChatJsonContent(out.text).product_line_name).toBe('Dragon Shield Guildpact Series')
    } finally {
      globalThis.fetch = realFetch
    }
  })
})

describe('streamed chat completions', () => {
  it('joins the content pieces and reports the running length', async () => {
    const events = [
      { choices: [{ delta: { role: 'assistant', content: '' } }] },
      { choices: [{ delta: { content: '{"product_line_name": ' } }] },
      { choices: [{ delta: { content: [{ type: 'text', text: '"Chessex"}' }] } }] }
    ]
    const sse = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('') + 'data: [DONE]\n\n'
    const lengths = []
    const text = await readChatCompletionStream(new Response(sse), (n) => lengths.push(n))
    expect(JSON.parse(text).product_line_name).toBe('Chessex')
    expect(lengths).toEqual([22, 32])
  })
})

describe('bundle research prompt', () => {
  it('asks Mistral to search the bundle EAN first', () => {
    const bundle = normalizeBundle({ name: 'Chessex Dice Bundle', ean: '601982000000', sku: 'CHX-B' })
    const prompt = buildFamilyResearchUserPrompt([{ ean: '', name: 'Red d6' }], '', 3, bundle)
    expect(prompt).toContain('split from distributor bundle: Chessex Dice Bundle')
    expect(prompt).toContain('Search that EAN first')
    expect(prompt).not.toMatch(/pages for each line/)
    expect(normalizeBundle({ name: '', ean: '' })).toBeNull()
  })
})

describe('applyConversationEvent', () => {
  const fresh = () => ({ text: '', references: [], searches: 0, reportedChars: 0, error: null, done: false })

  it('counts web searches and reports them', () => {
    const state = fresh()
    expect(applyConversationEvent(state, { type: 'tool.execution.started', name: 'web_search' })).toBe('Web search 1 running')
    expect(applyConversationEvent(state, { type: 'tool.execution.done', name: 'web_search' })).toBe('Web search 1 done')
    expect(state.searches).toBe(1)
  })

  it('joins text deltas and collects cited pages once', () => {
    const state = fresh()
    applyConversationEvent(state, { type: 'message.output.delta', content: '{"a":' })
    const ref = { type: 'tool_reference', tool: 'web_search', title: 'Dragon Shield Matte Black', url: 'https://www.dragonshield.com/p/black' }
    expect(applyConversationEvent(state, { type: 'message.output.delta', content: ref })).toMatch(/dragonshield\.com/)
    applyConversationEvent(state, { type: 'message.output.delta', content: [ref, { type: 'text', text: '1}' }] })
    expect(state.text).toBe('{"a":1}')
    expect(state.references).toHaveLength(1)
  })

  it('records stream errors and completion', () => {
    const state = fresh()
    applyConversationEvent(state, { type: 'conversation.response.error', message: 'web_search rate limit reached' })
    expect(state.error).toBe('web_search rate limit reached')
    applyConversationEvent(state, { type: 'conversation.response.done' })
    expect(state.done).toBe(true)
  })
})

describe('extractPageImageCandidates', () => {
  it('prefers the JSON-LD product image, then og:image, resolving relative URLs', () => {
    const html =
      '<head><meta property="og:image" content="/img/og.jpg">' +
      '<script type="application/ld+json">{"@type":"Product","image":["https://cdn.shop.com/phb.jpg"]}</script></head>'
    expect(extractPageImageCandidates(html, 'https://shop.com/p/phb')).toEqual([
      'https://cdn.shop.com/phb.jpg',
      'https://shop.com/img/og.jpg'
    ])
  })

  it('skips site share icons used when a page has no product photo', () => {
    const html = '<meta property="og:image" content="https://m.media-amazon.com/images/G/01/share-icons/previewdoh/amazon.png">'
    expect(extractPageImageCandidates(html, 'https://www.amazon.co.uk/dp/x')).toEqual([])
    expect(isSiteChromeImageUrl('https://cdn.example.com/products/phb-cover.jpg')).toBe(false)
  })
})

describe('isIsbn13', () => {
  it('recognises book barcodes only', () => {
    expect(isIsbn13('9780786969517')).toBe(true)
    expect(isIsbn13('5706569110024')).toBe(false)
    expect(openLibraryCoverUrl('9780786969517')).toBe('https://covers.openlibrary.org/b/isbn/9780786969517-L.jpg?default=false')
  })
})

describe('isFamilyBatchEligible', () => {
  it('requires long family key and at least two lines', () => {
    const key = normalizeVariantFamilyKey('Example long product line title here')
    expect(isFamilyBatchEligible(key, 2)).toBe(true)
    expect(isFamilyBatchEligible(key, 1)).toBe(false)
    expect(isFamilyBatchEligible('short', 3)).toBe(false)
  })
})

