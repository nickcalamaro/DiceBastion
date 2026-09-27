/**
 * Store credit helpers: balance reads, split calculation, idempotent ledger writes.
 * Amounts are integer pence. Guests never use these paths.
 */

export const STORE_CREDIT_MIN_CARD_PENCE = 100

/**
 * Safe split: apply credit only when remainder is 0 or >= £1.
 * If applying max available credit would leave 1–99p due on card, apply none
 * and charge the full amount on card.
 *
 * @param {number} amountDuePence
 * @param {number} balancePence
 * @param {boolean} applyCreditRequested
 * @returns {{ creditAppliedPence: number, cardDuePence: number }}
 */
export function computeCreditSplit(amountDuePence, balancePence, applyCreditRequested = true) {
  const due = Math.max(0, Math.floor(Number(amountDuePence) || 0))
  const bal = Math.max(0, Math.floor(Number(balancePence) || 0))
  if (!applyCreditRequested || bal <= 0 || due <= 0) {
    return { creditAppliedPence: 0, cardDuePence: due }
  }

  const maxCredit = Math.min(bal, due)
  const remainder = due - maxCredit

  if (remainder === 0) {
    return { creditAppliedPence: maxCredit, cardDuePence: 0 }
  }
  if (remainder >= STORE_CREDIT_MIN_CARD_PENCE) {
    return { creditAppliedPence: maxCredit, cardDuePence: remainder }
  }
  // 1–99p leftover: do not apply credit (avoid sub-£1 SumUp charge)
  return { creditAppliedPence: 0, cardDuePence: due }
}

/**
 * @param {D1Database} db
 * @param {number} userId
 * @returns {Promise<number>}
 */
export async function getStoreCreditBalance(db, userId) {
  const row = await db.prepare(
    'SELECT store_credit_pence FROM users WHERE user_id = ?'
  ).bind(userId).first()
  return Math.max(0, Number(row?.store_credit_pence) || 0)
}

/**
 * Append a ledger row and update users.store_credit_pence.
 * Idempotent on idempotency_key. Uses a conditional balance UPDATE to reduce overdraft races.
 *
 * @param {D1Database} db
 * @param {object} opts
 * @returns {Promise<{ ok: boolean, reused?: boolean, entry?: object, error?: string, balanceAfter?: number }>}
 */
export async function appendStoreCreditLedger(db, {
  userId,
  deltaPence,
  entryType,
  referenceType = null,
  referenceId = null,
  idempotencyKey,
  note = null,
  createdBy = 'system',
  nowIso = null
}) {
  const uid = Number(userId)
  const delta = Math.trunc(Number(deltaPence))
  const key = String(idempotencyKey || '').trim()
  if (!uid || !Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: 'invalid_ledger_args' }
  }
  if (!key) return { ok: false, error: 'idempotency_key_required' }
  const allowed = new Set(['buyback_credit', 'shop_spend', 'event_spend', 'adjustment', 'void'])
  if (!allowed.has(entryType)) return { ok: false, error: 'invalid_entry_type' }

  const existing = await db.prepare(
    'SELECT * FROM store_credit_ledger WHERE idempotency_key = ?'
  ).bind(key).first()
  if (existing) {
    return {
      ok: true,
      reused: true,
      entry: existing,
      balanceAfter: Number(existing.balance_after_pence)
    }
  }

  const now = nowIso || new Date().toISOString()

  // Conditional update prevents concurrent overdraft for spends (negative delta).
  const upd = await db.prepare(`
    UPDATE users
    SET store_credit_pence = store_credit_pence + ?,
        updated_at = ?
    WHERE user_id = ?
      AND store_credit_pence + ? >= 0
  `).bind(delta, now, uid, delta).run()

  if (Number(upd.meta?.changes ?? 0) === 0) {
    const current = await getStoreCreditBalance(db, uid)
    return { ok: false, error: 'insufficient_credit', balanceAfter: current }
  }

  const balanceRow = await db.prepare(
    'SELECT store_credit_pence FROM users WHERE user_id = ?'
  ).bind(uid).first()
  const next = Math.max(0, Number(balanceRow?.store_credit_pence) || 0)

  try {
    await db.prepare(`
      INSERT INTO store_credit_ledger (
        user_id, delta_pence, balance_after_pence, entry_type,
        reference_type, reference_id, idempotency_key, note, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uid,
      delta,
      next,
      entryType,
      referenceType,
      referenceId != null ? String(referenceId) : null,
      key,
      note,
      String(createdBy || 'system'),
      now
    ).run()
  } catch (e) {
    // Unique key race: roll balance back if we won the UPDATE but lost the INSERT.
    const again = await db.prepare(
      'SELECT * FROM store_credit_ledger WHERE idempotency_key = ?'
    ).bind(key).first()
    if (again) {
      await db.prepare(`
        UPDATE users SET store_credit_pence = store_credit_pence - ?, updated_at = ?
        WHERE user_id = ?
      `).bind(delta, now, uid).run()
      return {
        ok: true,
        reused: true,
        entry: again,
        balanceAfter: Number(again.balance_after_pence)
      }
    }
    // Best-effort rollback of balance bump
    try {
      await db.prepare(`
        UPDATE users SET store_credit_pence = store_credit_pence - ?, updated_at = ?
        WHERE user_id = ?
      `).bind(delta, now, uid).run()
    } catch (_) {}
    throw e
  }

  const entry = await db.prepare(
    'SELECT * FROM store_credit_ledger WHERE idempotency_key = ?'
  ).bind(key).first()

  return { ok: true, reused: false, entry, balanceAfter: next }
}

/**
 * Debit store credit for a shop or event purchase. No-op if creditAppliedPence is 0.
 */
export async function debitStoreCreditForPurchase(db, {
  userId,
  creditAppliedPence,
  entryType,
  referenceType,
  referenceId,
  idempotencyKey,
  note = null,
  nowIso = null
}) {
  const amount = Math.floor(Number(creditAppliedPence) || 0)
  if (amount <= 0) {
    return { ok: true, skipped: true, balanceAfter: await getStoreCreditBalance(db, userId) }
  }
  return appendStoreCreditLedger(db, {
    userId,
    deltaPence: -amount,
    entryType,
    referenceType,
    referenceId,
    idempotencyKey,
    note,
    createdBy: 'system',
    nowIso
  })
}

/**
 * Restore previously spent credit (failed card payment / cancelled order).
 */
export async function restoreStoreCredit(db, {
  userId,
  creditPence,
  referenceType,
  referenceId,
  idempotencyKey,
  note = null,
  nowIso = null
}) {
  const amount = Math.floor(Number(creditPence) || 0)
  if (amount <= 0) return { ok: true, skipped: true }
  return appendStoreCreditLedger(db, {
    userId,
    deltaPence: amount,
    entryType: 'void',
    referenceType,
    referenceId,
    idempotencyKey,
    note,
    createdBy: 'system',
    nowIso
  })
}

/**
 * Recent ledger rows for account UI.
 */
export async function listStoreCreditLedger(db, userId, limit = 20) {
  const lim = Math.min(50, Math.max(1, Number(limit) || 20))
  const { results } = await db.prepare(`
    SELECT id, delta_pence, balance_after_pence, entry_type, reference_type, reference_id, note, created_at
    FROM store_credit_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).bind(userId, lim).all()
  return results || []
}
