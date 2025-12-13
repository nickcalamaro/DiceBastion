-- Migration 0001: Initial Database Schema
-- Creates all core tables for DiceBastion

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
    membership_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tier TEXT NOT NULL,
    status TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    auto_renew INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    membership_price REAL,
    non_membership_price REAL,
    stock_quantity INTEGER,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    event_datetime TEXT NOT NULL,
    location TEXT,
    membership_price REAL,
    non_membership_price REAL,
    capacity INTEGER,
    tickets_sold INTEGER DEFAULT 0,
    image_url TEXT,
    requires_purchase INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ticket_type TEXT NOT NULL,
    price REAL NOT NULL,
    purchase_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    purchase_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(event_datetime);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
