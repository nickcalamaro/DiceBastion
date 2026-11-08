import { describe, expect, it } from 'vitest'
import {
  allocateSettlementToLines,
  cleanReceiptKey,
  receiptKeyFromStoredUrl,
  normalizeInvoiceCurrency,
  isForeignInvoiceCurrency,
  importLineProblem
} from './shop-ledger.js'
import { unzipStore, zipStore } from './zip-store.js'
import { accountsPdfLines, buildAccountsPdf, classifyProductCategory, summariseEvents } from './accounts-summary.js'

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

describe('receiptKeyFromStoredUrl', () => {
  it('copies the storage path out of a public receipt link', () => {
    expect(receiptKeyFromStoredUrl(
      'https://pub-631ca6f207ca4661ac9cb2ba9371ba31.r2.dev/receipts/1793546515512-Dice-Bastion-Invoice.pdf.pdf'
    )).toBe('receipts/1793546515512-Dice-Bastion-Invoice.pdf.pdf')
    expect(receiptKeyFromStoredUrl('https://example.com/other/file.pdf')).toBe(null)
  })
})

describe('sale categories and event attendance', () => {
  it('counts board games and TCG packs, and leaves accessories out', () => {
    expect(classifyProductCategory('Board Games, Allplay')).toBe('game')
    expect(classifyProductCategory('Board Game Accessories, Level 99 Games')).toBe('other')
    expect(classifyProductCategory('Card Games, Magic: The Gathering')).toBe('tcg')
    expect(classifyProductCategory('Riftbound, Card Games')).toBe('tcg')
    expect(classifyProductCategory('Accessories, Card Sleeves, Magic: The Gathering')).toBe('other')
    expect(classifyProductCategory('Rpg, Free League Publishing')).toBe('other')
    expect(classifyProductCategory('Dice, Chessex')).toBe('other')
  })

  it('lists an event under half the average attendance', () => {
    const summary = summariseEvents([
      { name: 'Full house', tickets: 10, people: 10, profit_pence: 5000 },
      { name: 'Quiet night', tickets: 2, people: 2, profit_pence: 0 }
    ])
    expect(summary.averageAttendance).toBe(6)
    expect(summary.low.map(event => event.name)).toEqual(['Quiet night'])
    expect(summary.best.name).toBe('Full house')
  })

  it('names no unsuccessful event when attendance is similar', () => {
    const summary = summariseEvents([
      { name: 'Friday', tickets: 8, people: 8, profit_pence: 100 },
      { name: 'Saturday', tickets: 6, people: 6, profit_pence: 50 }
    ])
    expect(summary.low).toEqual([])
  })
})

describe('accounts summary PDF', () => {
  const model = {
    pnl: {
      from: '2026-11-01',
      to: '2026-11-30',
      revenue: { product_sales_pence: 10000, shipping_pence: 500, event_tickets_pence: 2000, total_pence: 12500 },
      cost_of_goods_sold_pence: 4000,
      gross_profit_pence: 8500,
      expenses: { total_pence: 1500, card_buyback_credit_pence: 300, stock_write_offs_pence: 400, event_goods_pence: 400 },
      net_profit_pence: 7000,
      excluded_untracked: { lines: 2, pence: 800 }
    },
    sheet: {
      as_of: '2026-11-30',
      assets: { stock_at_cost_pence: 20000, bank_and_sumup_pence: 9000, cash_pence: 1000 },
      liabilities: {
        store_credit_owed_pence: 400,
        store_credit_customer_balances_pence: 450,
        unpaid_supplier_bills_pence: 0,
        unpaid_expenses_pence: 0,
        total_pence: 400
      },
      net_assets_pence: 23600
    },
    activity: {
      games: 4,
      tcgPacks: 9,
      untrackedUnits: 1,
      people: 7,
      events: summariseEvents([
        { name: 'Star Trek prerelease', date: '2026-11-08', tickets: 12, people: 12, profit_pence: 2400 }
      ])
    },
    notes: { finances: '', events: '', sales: 'Restocked sleeves.' },
    reinvestment_pence: 6000,
    receipts: [{ date: '2026-11-01', label: 'CubeGolem DE', amount_pence: 6000, file: 'import-4.pdf' }],
    stock: {
      opening_pence: 16000,
      closing_pence: 20000,
      amount_pence: 6000,
      paid_from_owner_pence: 6000,
      invoices: [{ date: '2026-11-01', supplier: 'CubeGolem DE', amount_pence: 6000, paid_from: 'owner' }]
    }
  }

  it('includes the statements and the internal breakdown, without an owed-to-owners line', () => {
    const text = accountsPdfLines(model).map(line => line.text).join('\n')
    expect(text).toContain('Profit and loss account')
    expect(text).toContain('Purchases of goods')
    expect(text).toContain('CubeGolem DE')
    expect(text).toContain('Goods for events')
    expect(text).toContain('Net assets')
    expect(text).not.toContain("Owner's bank")
    expect(text).not.toContain('Capital')
    expect(text).not.toContain('Drawings')
    expect(text).not.toContain('equity')
    expect(text).toContain('Balance sheet')
    expect(text).toContain('Internal breakdown')
    expect(text).toContain('Reinvestment')
    expect(text).toContain('Most successful event: Star Trek prerelease')
    expect(text).toContain('Games sold')
    expect(text).toContain('TCG packs sold')
    expect(text).not.toContain('Owed to')
    expect(text).not.toContain('Paid personally')
    const pdf = buildAccountsPdf(model)
    expect(new TextDecoder().decode(pdf.slice(0, 8))).toBe('%PDF-1.4')
    const pages = new TextDecoder().decode(pdf).match(/\/Type \/Page /g) || []
    expect(pages.length).toBeGreaterThanOrEqual(3)
  })
})
