import { describe, expect, it } from 'vitest'
import {
  allocateSettlementToLines,
  cleanReceiptKey,
  normalizeInvoiceCurrency,
  isForeignInvoiceCurrency,
  importLineProblem
} from './shop-ledger.js'
import { unzipStore, zipStore } from './zip-store.js'

describe('importLineProblem', () => {
  it('flags a foreign line without a unit cost', () => {
    expect(importLineProblem({ quantity: 2, name: 'Dice' }, true, 'EUR')).toEqual({ error: 'missing_foreign_cost', message: 'missing EUR unit cost' })
  })

  it('accepts complete lines', () => {
    expect(importLineProblem({ quantity: 2, name: 'Dice', unit_foreign_minor: 450 }, true)).toBe(null)
    expect(importLineProblem({ quantity: 1, product_id: 7, unit_cost_pence: 0 }, false)).toBe(null)
  })

  it('flags an image that is not a link', () => {
    expect(importLineProblem({ quantity: 1, name: 'Dice', unit_cost_pence: 10, image_url: 'data:image/jpeg;base64,xx' }, false).error).toBe('invalid_image')
  })
})

describe('allocateSettlementToLines missing cost', () => {
  it('rejects a line without a foreign cost instead of failing the split', () => {
    expect(allocateSettlementToLines({ settlementGbpPence: 1000, lines: [{ quantity: 1, foreignMinorPerUnit: 500 }, { quantity: 1 }] })).toEqual({ error: 'invalid_line' })
  })
})

describe('normalizeInvoiceCurrency', () => {
  it('defaults invalid to GBP', () => {
    expect(normalizeInvoiceCurrency('')).toBe('GBP')
    expect(normalizeInvoiceCurrency('xx')).toBe('GBP')
  })

  it('accepts EUR', () => {
    expect(normalizeInvoiceCurrency('eur')).toBe('EUR')
    expect(isForeignInvoiceCurrency('EUR')).toBe(true)
    expect(isForeignInvoiceCurrency('GBP')).toBe(false)
  })
})

describe('allocateSettlementToLines', () => {
  it('allocates GBP exactly to settlement across lines', () => {
    const result = allocateSettlementToLines({
      settlementGbpPence: 10000,
      lines: [
        { quantity: 2, foreignMinorPerUnit: 1000 },
        { quantity: 1, foreignMinorPerUnit: 2000 }
      ]
    })
    expect(result.error).toBeUndefined()
    expect(result.unit_cost_pence).toHaveLength(2)
    const total = 2 * result.unit_cost_pence[0] + 1 * result.unit_cost_pence[1]
    expect(total).toBe(10000)
    expect(result.foreign_goods_total_minor).toBe(4000)
  })

  it('handles remainder on last line share', () => {
    const result = allocateSettlementToLines({
      settlementGbpPence: 101,
      lines: [
        { quantity: 1, foreignMinorPerUnit: 100 },
        { quantity: 1, foreignMinorPerUnit: 100 },
        { quantity: 1, foreignMinorPerUnit: 100 }
      ]
    })
    const total = result.unit_cost_pence.reduce((s, u, i) => s + [1, 1, 1][i] * u, 0)
    expect(total).toBe(101)
  })
})

describe('cleanReceiptKey', () => {
  it('keeps a receipt object key and rejects anything else', () => {
    expect(cleanReceiptKey('receipts/1710000000-invoice.pdf')).toBe('receipts/1710000000-invoice.pdf')
    expect(cleanReceiptKey('')).toBe(null)
    expect(cleanReceiptKey('https://cdn.example/receipts/a.pdf')).toBe(undefined)
    expect(cleanReceiptKey('../secrets')).toBe(undefined)
  })
})

describe('zipStore', () => {
  it('round-trips a statement and a receipt', () => {
    const packed = zipStore([
      { name: 'profit-and-loss.csv', data: new TextEncoder().encode('Line,GBP\n') },
      { name: 'receipts/import-4.pdf', data: new Uint8Array([1, 2, 3, 4]) }
    ])
    const files = unzipStore(packed)
    expect(files.map(file => file.name)).toEqual(['profit-and-loss.csv', 'receipts/import-4.pdf'])
    expect(new TextDecoder().decode(files[0].data)).toBe('Line,GBP\n')
    expect(Array.from(files[1].data)).toEqual([1, 2, 3, 4])
  })
})
