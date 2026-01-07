-- Create cron job logging table
CREATE TABLE IF NOT EXISTS cron_job_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name TEXT NOT NULL,              -- e.g., 'auto_renewals', 'event_reminders', 'payment_reconciliation'
  started_at TEXT NOT NULL,            -- ISO timestamp when job started
  completed_at TEXT,                   -- ISO timestamp when job completed
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0, -- Count of items processed
  records_succeeded INTEGER DEFAULT 0, -- Count of successful operations
  records_failed INTEGER DEFAULT 0,    -- Count of failed operations
  error_message TEXT,                  -- Error details if status is 'failed'
  details TEXT,                        -- JSON string with additional details
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create index for faster queries by job name and date
CREATE INDEX IF NOT EXISTS idx_cron_job_log_name_date 
  ON cron_job_log(job_name, started_at DESC);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_cron_job_log_status 
  ON cron_job_log(status, started_at DESC);
