/**
 * Authentication Utilities for Dice Bastion
 * Secure token generation, validation, and email preference management
 */

import { generateSessionToken } from './index.js' // Reuse existing function

/**
 * Generate a secure random token for email verification
 * @param {number} length - Token length (default: 32)
 * @returns {string} Secure random token
 */
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const crypto = globalThis.crypto || require('crypto')
  
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  
  for (let i = 0; i < length; i++) {
    token += chars[values[i] % chars.length]
  }
  
  return token
}

/**
 * Create an email verification token
 * @param {object} db - Database connection
 * @param {string} email - User email
 * @param {string} userId - User ID
 * @param {number} expiresIn - Minutes until expiration (default: 60)
 * @returns {Promise<object>} Verification token info
 */
export async function createEmailVerificationToken(db, email, userId, expiresIn = 60) {
  try {
    // Create email_verification_tokens table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        token_hash TEXT NOT NULL,
        purpose TEXT NOT NULL, -- 'email_preferences', 'password_reset', etc.
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        used_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `).run().catch(() => {})
    
    // Generate secure token
    const token = generateSecureToken(32)
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000).toISOString()
    
    // Store token hash (not plain token) for security
    const tokenHash = await hashToken(token)
    
    // Store the token
    await db.prepare(`
      INSERT INTO email_verification_tokens 
      (user_id, email, token, token_hash, purpose, expires_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, email, token, tokenHash, 'email_preferences', expiresAt).run()
    
    return {
      token,
      expiresAt,
      email
    }
  } catch (error) {
    console.error('Error creating verification token:', error)
    throw new Error('Failed to create verification token')
  }
}

/**
 * Hash a token for secure storage
 * @param {string} token - Plain token
 * @returns {Promise<string>} Hashed token
 */
async function hashToken(token) {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify an email verification token
 * @param {object} db - Database connection
 * @param {string} token - Verification token
 * @param {string} email - User email (for additional verification)
 * @returns {Promise<object>} Verification result
 */
export async function verifyEmailVerificationToken(db, token, email) {
  try {
    // Get the token from database (case-insensitive email lookup)
    const result = await db.prepare(`
      SELECT * FROM email_verification_tokens 
      WHERE token = ? AND LOWER(email) = LOWER(?)
    `).bind(token, email).first()
    
    if (!result) {
      return { valid: false, error: 'Invalid or expired token' }
    }
    
    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(result.expires_at)
    
    if (now > expiresAt) {
      return { valid: false, error: 'Token has expired' }
    }
    
    // Verify token hash
    const tokenHash = await hashToken(token)
    if (tokenHash !== result.token_hash) {
      return { valid: false, error: 'Invalid token' }
    }
    
    // Mark token as used
    await db.prepare(`
      UPDATE email_verification_tokens 
      SET used_at = ? 
      WHERE id = ?
    `).bind(new Date().toISOString(), result.id).run()
    
    return {
      valid: true,
      userId: result.user_id,
      email: result.email,
      purpose: result.purpose
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * Get user email preferences
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @returns {Promise<object>} User preferences
 */
export async function getUserEmailPreferences(db, userId) {
  try {
    // Create email_preferences table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS email_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        essential_emails BOOLEAN DEFAULT 1, -- Required operational emails
        marketing_emails BOOLEAN DEFAULT 0, -- Optional marketing emails
        consent_given BOOLEAN DEFAULT 0,    -- Explicit consent for marketing
        consent_date TEXT,                 -- When consent was given
        last_updated TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `).run().catch(() => {})
    
    // Get existing preferences or create defaults
    let preferences = await db.prepare(`
      SELECT * FROM email_preferences WHERE user_id = ?
    `).bind(userId).first()
    
    if (!preferences) {
      // Create default preferences
      await db.prepare(`
        INSERT INTO email_preferences 
        (user_id, membership_emails, event_emails, shop_emails, marketing_emails) 
        VALUES (?, 1, 1, 1, 1)
      `).bind(userId).run()
      
      preferences = {
        user_id: userId,
        membership_emails: 1,
        event_emails: 1,
        shop_emails: 1,
        marketing_emails: 1
      }
    }
    
    return {
      success: true,
      preferences: {
        essentialEmails: Boolean(preferences.essential_emails),
        marketingEmails: Boolean(preferences.marketing_emails),
        consentGiven: Boolean(preferences.consent_given),
        consentDate: preferences.consent_date || null
      }
    }
  } catch (error) {
    console.error('Error getting email preferences:', error)
    return { success: false, error: 'Failed to get preferences' }
  }
}

/**
 * Update user email preferences
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {object} preferences - Updated preferences
 * @returns {Promise<object>} Update result
 */
export async function updateUserEmailPreferences(db, userId, preferences) {
  try {
    const now = new Date().toISOString()
    
    await db.prepare(`
      INSERT OR REPLACE INTO email_preferences 
      (user_id, essential_emails, marketing_emails, consent_given, consent_date, last_updated) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      preferences.essentialEmails ? 1 : 0,
      preferences.marketingEmails ? 1 : 0,
      preferences.consentGiven ? 1 : 0,
      preferences.consentGiven ? new Date().toISOString() : null,
      now
    ).run()
    
    return { success: true }
  } catch (error) {
    console.error('Error updating email preferences:', error)
    return { success: false, error: 'Failed to update preferences' }
  }
}

/**
 * Check if user has valid session for email preferences
 * @param {object} db - Database connection
 * @param {string} sessionToken - Session token
 * @returns {Promise<object>} Session validation result
 */
export async function validateEmailPreferencesSession(db, sessionToken) {
  try {
    const now = new Date().toISOString()
    
    const session = await db.prepare(`
      SELECT s.*, u.email, u.user_id 
      FROM user_sessions s 
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? 
      AND s.expires_at > ?
      AND u.is_active = 1
    `).bind(sessionToken, now).first()
    
    if (!session) {
      return { valid: false, error: 'Invalid or expired session' }
    }
    
    return {
      valid: true,
      userId: session.user_id,
      email: session.email
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, error: 'Session validation failed' }
  }
}

/**
 * Clean up expired verification tokens
 * @param {object} db - Database connection
 * @returns {Promise<number>} Number of tokens cleaned up
 */
export async function cleanupExpiredVerificationTokens(db) {
  try {
    const now = new Date().toISOString()
    
    const result = await db.prepare(`
      DELETE FROM email_verification_tokens 
      WHERE expires_at < ? AND used_at IS NULL
    `).bind(now).run()
    
    return result.changes || 0
  } catch (error) {
    console.error('Error cleaning up tokens:', error)
    return 0
  }
}

// Rate limiting for email verification requests
const emailVerificationRateLimits = new Map()

/**
 * Check rate limit for email verification
 * @param {string} ip - IP address
 * @param {string} email - Email address
 * @returns {boolean} True if request is allowed
 */
export function checkEmailVerificationRateLimit(ip, email) {
  const now = Date.now()
  const key = `${ip}:${email}`
  
  if (emailVerificationRateLimits.has(key)) {
    const [timestamp, count] = emailVerificationRateLimits.get(key)
    
    // Reset after 1 hour
    if (now - timestamp > 60 * 60 * 1000) {
      emailVerificationRateLimits.set(key, [now, 1])
      return true
    }
    
    // Limit to 3 attempts per hour
    if (count >= 3) {
      return false
    }
    
    emailVerificationRateLimits.set(key, [timestamp, count + 1])
    return true
  }
  
  emailVerificationRateLimits.set(key, [now, 1])
  return true
}

/**
 * Generate email verification link
 * @param {string} baseUrl - Base URL of the application
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @returns {string} Full verification URL
 */
export function generateVerificationLink(baseUrl, email, token) {
  // URL-safe email encoding
  const encodedEmail = encodeURIComponent(email)
  return `${baseUrl}/email-preferences?email=${encodedEmail}&token=${token}`
}

/**
 * Check if user can access email preferences without verification
 * (Currently always returns false since we don't have user sessions yet)
 * @param {object} db - Database connection
 * @param {string} sessionToken - Session token
 * @returns {Promise<boolean>} True if direct access is allowed
 */
export async function canAccessEmailPreferencesDirectly(db, sessionToken) {
  // Currently disabled since we don't have user sessions yet
  // This can be enabled later when user authentication is implemented
  return false
}