import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  appendStoreCreditLedger,
  computeCreditSplit,
  debitStoreCreditForPurchase,
  getStoreCreditBalance,
  listStoreCreditLedger,
  settleStoreCredit
} from './store-credit.js'

async function setup() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      store_credit_pence INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS store_credit_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      delta_pence INTEGER NOT NULL,
      balance_after_pence INTEGER NOT NULL,
      entry_type TEXT NOT NULL CHECK(entry_type IN (
        'buyback_credit', 'shop_spend', 'event_spend', 'adjustment', 'void'
      )),
      reference_type TEXT,
      reference_id TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      note TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `).run()
}

async function makeUser(email) {
  const inserted = await env.DB.prepare(
    'INSERT INTO users (email, store_credit_pence) VALUES (?, 0)'
  ).bind(email).run()
  return inserted.meta.last_row_id
}

beforeAll(setup)

describe('store credit split (what a checkout is allowed to spend)', () => {
  test('covers an order in full when the balance is enough', () => {
    expect(computeCreditSplit(1500, 2000, true)).toEqual({
      creditAppliedPence: 1500,
      cardDuePence: 0
    })
  })

  test('uses part of the balance when at least £1 remains on the card', () => {
    expect(computeCreditSplit(2500, 1000, true)).toEqual({
      creditAppliedPence: 1000,
      cardDuePence: 1500
    })
  })

  test('does not apply credit when the card would be charged under £1', () => {
    expect(computeCreditSplit(150, 100, true)).toEqual({
      creditAppliedPence: 0,
      cardDuePence: 150
    })
  })

  test('does not apply credit when the customer opts out or has none', () => {
    expect(computeCreditSplit(2000, 2000, false)).toEqual({
      creditAppliedPence: 0,
      cardDuePence: 2000
    })
    expect(computeCreditSplit(2000, 0, true)).toEqual({
      creditAppliedPence: 0,
      cardDuePence: 2000
    })
  })
})

describe('issue, see, and spend store credit', () => {
  test('issuing credit updates the balance and the ledger the account page reads', async () => {
    const userId = await makeUser('credit-see@example.com')
    const issued = await appendStoreCreditLedger(env.DB, {
      userId,
      deltaPence: 2500,
      entryType: 'buyback_credit',
      referenceType: 'buyback_case',
      referenceId: 'case-1',
      idempotencyKey: 'buyback:case-1',
      note: 'Buyback case 1',
      createdBy: 'staff'
    })
    expect(issued.ok).toBe(true)
    expect(issued.balanceAfter).toBe(2500)
    expect(await getStoreCreditBalance(env.DB, userId)).toBe(2500)

    const again = await appendStoreCreditLedger(env.DB, {
      userId,
      deltaPence: 2500,
      entryType: 'buyback_credit',
      referenceType: 'buyback_case',
      referenceId: 'case-1',
      idempotencyKey: 'buyback:case-1',
      createdBy: 'staff'
    })
    expect(again.reused).toBe(true)
    expect(await getStoreCreditBalance(env.DB, userId)).toBe(2500)

    const ledger = await listStoreCreditLedger(env.DB, userId)
    expect(ledger).toHaveLength(1)
    expect(ledger[0].entry_type).toBe('buyback_credit')
    expect(ledger[0].delta_pence).toBe(2500)
    expect(ledger[0].balance_after_pence).toBe(2500)
  })

  test('a shop spend reduces the balance and refuses an overdraft', async () => {
    const userId = await makeUser('credit-spend@example.com')
    await appendStoreCreditLedger(env.DB, {
      userId,
      deltaPence: 2000,
      entryType: 'buyback_credit',
      idempotencyKey: 'buyback:spend-user',
      createdBy: 'staff'
    })

    const reserved = await settleStoreCredit(env.DB, {
      userId,
      targetPence: 800,
      spendType: 'shop_spend',
      referenceType: 'order',
      referenceId: 'DB-1001',
      keyPrefix: 'shop_spend',
      note: 'Shop order DB-1001'
    })
    expect(reserved.ok).toBe(true)
    expect(reserved.netSpentPence).toBe(800)
    expect(await getStoreCreditBalance(env.DB, userId)).toBe(1200)

    const overdraft = await debitStoreCreditForPurchase(env.DB, {
      userId,
      creditAppliedPence: 5000,
      entryType: 'shop_spend',
      referenceType: 'order',
      referenceId: 'DB-too-much',
      idempotencyKey: 'shop_spend:DB-too-much'
    })
    expect(overdraft.ok).toBe(false)
    expect(overdraft.error).toBe('insufficient_credit')
    expect(await getStoreCreditBalance(env.DB, userId)).toBe(1200)

    const ledger = await listStoreCreditLedger(env.DB, userId)
    expect(ledger[0].entry_type).toBe('shop_spend')
    expect(ledger[0].delta_pence).toBe(-800)
    expect(ledger[0].balance_after_pence).toBe(1200)
  })

  test('releasing a reserved shop spend puts the credit back', async () => {
    const userId = await makeUser('credit-release@example.com')
    await appendStoreCreditLedger(env.DB, {
      userId,
      deltaPence: 2000,
      entryType: 'buyback_credit',
      idempotencyKey: 'buyback:release-user',
      createdBy: 'staff'
    })
    await settleStoreCredit(env.DB, {
      userId,
      targetPence: 800,
      spendType: 'shop_spend',
      referenceType: 'order',
      referenceId: 'DB-1002',
      keyPrefix: 'shop_spend'
    })
    const released = await settleStoreCredit(env.DB, {
      userId,
      targetPence: 0,
      spendType: 'shop_spend',
      referenceType: 'order',
      referenceId: 'DB-1002',
      keyPrefix: 'shop_spend'
    })
    expect(released.ok).toBe(true)
    expect(released.netSpentPence).toBe(0)
    expect(await getStoreCreditBalance(env.DB, userId)).toBe(2000)

    const ledger = await listStoreCreditLedger(env.DB, userId)
    expect(ledger[0].entry_type).toBe('void')
    expect(ledger[0].delta_pence).toBe(800)
  })

  test('event entry can spend the same balance', async () => {
    const userId = await makeUser('credit-event@example.com')
    await appendStoreCreditLedger(env.DB, {
      userId,
      deltaPence: 3000,
      entryType: 'adjustment',
      idempotencyKey: 'adjust:event-user',
      createdBy: 'staff'
    })
    const spent = await debitStoreCreditForPurchase(env.DB, {
      userId,
      creditAppliedPence: 1200,
      entryType: 'event_spend',
      referenceType: 'ticket',
      referenceId: 'ticket-9',
      idempotencyKey: 'event_spend:ticket-9'
    })
    expect(spent.ok).toBe(true)
    expect(await getStoreCreditBalance(env.DB, userId)).toBe(1800)
  })
})
