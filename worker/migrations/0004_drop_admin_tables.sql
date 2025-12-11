-- Migration 0004: Drop unused admin tables
-- Now that we've consolidated into users/user_sessions, remove the old admin tables

DROP TABLE IF EXISTS admin_sessions;
DROP TABLE IF EXISTS admin_users;
