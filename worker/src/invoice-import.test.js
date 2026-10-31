import { describe, expect, it } from 'vitest'
import {
  normalizeGtin,
  allocateSplitUnitCosts,
  normalizeSplitLines,
  isUndesirableProductImageUrl,
  normalizeVariantFamilyKey,
  guessVariantImageUrl,
  applyFamilyTemplate,
  matchFamilyVariantToInput,
  isFamilyBatchEligible,
  normalizeEnrichmentImageUrl,
  looksLikeImageBytes
} from './invoice-import.js'

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
    // Parent: 2 × £10.00 = £20.00 → 2000 pence total; 4 children qty 1 each → 500 pence each
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

  it('does not block generic publisher CDN paths', () => {
    expect(isUndesirableProductImageUrl('https://cdn.example.com/images/product/12345.jpg')).toBe(false)
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

  it('detects PNG magic', () => {
    expect(looksLikeImageBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true)
  })
})

describe('normalizeVariantFamilyKey', () => {
  it('groups Dragon Shield matte colour variants', () => {
    const black = normalizeVariantFamilyKey('Dragon Shield Matte Standard Sleeves Black')
    const blue = normalizeVariantFamilyKey('Dragon Shield Matte Standard Sleeves Blue')
    expect(black).toBe(blue)
    expect(black.length).toBeGreaterThan(10)
  })

  it('groups distributor DS matte sleeve colour lines', () => {
    const a = normalizeVariantFamilyKey('DS - Standard Sleeves: Apple Green [Matte] (100 Sleeves)')
    const b = normalizeVariantFamilyKey('DS - Standard Sleeves: Blood Red [Matte] (100 Sleeves)')
    expect(a).toBe(b)
    expect(a).toContain('dragon shield')
  })

  it('keeps licensed dual art separate from plain matte sleeves', () => {
    const matte = normalizeVariantFamilyKey('DS - Standard Sleeves: Apple Green [Matte] (100 Sleeves)')
    const dual = normalizeVariantFamilyKey(
      'DS - Standard Licensed Dual Art Sleeves: MtG: The Guildpact series - Boros Legion [Matte] (100 Sleeves)'
    )
    expect(matte).not.toBe(dual)
  })
})

describe('guessVariantImageUrl', () => {
  it('swaps colour token in manufacturer CDN path', () => {
    const ref =
      'https://cdn.example.com/products/at-11002-ds100-matte-black-box_right-1200x900.jpg'
    const guessed = guessVariantImageUrl(ref, 'Dragon Shield Matte Standard Blue')
    expect(guessed).toContain('blue')
    expect(guessed).not.toContain('black')
  })
})

describe('applyFamilyTemplate', () => {
  it('substitutes variant and product line placeholders', () => {
    const template = {
      naming_pattern: '{product_line_name} — {variant}',
      summary_template: 'Premium {variant} sleeves for standard cards.',
      description_paragraphs: ['Colour: {variant}.', 'Line: {product_line_name}.']
    }
    const out = applyFamilyTemplate(template, 'Blue', 'Dragon Shield Matte Standard Sleeves')
    expect(out.display_name).toBe('Dragon Shield Matte Standard Sleeves — Blue')
    expect(out.summary).toBe('Premium Blue sleeves for standard cards.')
    expect(out.description).toContain('Colour: Blue.')
    expect(out.description).toContain('Line: Dragon Shield Matte Standard Sleeves.')
  })
})

describe('matchFamilyVariantToInput', () => {
  it('matches by normalized EAN first', () => {
    const variants = [
      { ean: '5706569110024', variant_label: 'Black' },
      { ean: '5706569110025', variant_label: 'Blue' }
    ]
    const used = new Set()
    const match = matchFamilyVariantToInput({ name: 'Sleeves Blue', ean: '5706569110025' }, variants, used)
    expect(match.variant_label).toBe('Blue')
    expect(used.has(1)).toBe(true)
  })
})

describe('isFamilyBatchEligible', () => {
  it('requires long family key and at least two lines', () => {
    const key = normalizeVariantFamilyKey('Dragon Shield Matte Standard Sleeves Black')
    expect(isFamilyBatchEligible(key, 2)).toBe(true)
    expect(isFamilyBatchEligible(key, 1)).toBe(false)
    expect(isFamilyBatchEligible('short', 3)).toBe(false)
  })
})
