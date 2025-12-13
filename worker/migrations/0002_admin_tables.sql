-- Migration 0002: Admin Tables (temporary)
-- These will be dropped in migration 0004 after consolidation into users table

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
