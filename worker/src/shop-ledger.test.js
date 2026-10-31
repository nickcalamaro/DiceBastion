import { describe, expect, it } from 'vitest'
import {
  allocateSettlementToLines,
  normalizeInvoiceCurrency,
  isForeignInvoiceCurrency
} from './shop-ledger.js'

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
