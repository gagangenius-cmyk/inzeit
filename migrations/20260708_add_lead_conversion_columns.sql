-- src/models/DmcForumLeads.ts already declares conversion_reason, lost_reason,
-- competitor and qualification_score as attributes, but the live crm_forum_leads
-- table never got these columns added (only opportunity_id, opportunity_status,
-- conversion_date and lead_quality were ever created). Any raw UPDATE that sets
-- conversion_reason (e.g. PUT /api/opportunities/[id] on retention "won"/"lost")
-- fails with "Unknown column 'conversion_reason' in 'field list'".
-- No IF NOT EXISTS: this server's MySQL/MariaDB version doesn't support it on
-- ADD COLUMN. runSqlMigrations() in scripts/setup-database.js already treats
-- ER_DUP_FIELDNAME as an idempotent no-op on re-runs, and the columnMigrations
-- ensureColumn() pass right after this one is the real idempotency guard.
ALTER TABLE crm_forum_leads
  ADD COLUMN conversion_reason TEXT NULL,
  ADD COLUMN lost_reason TEXT NULL,
  ADD COLUMN competitor VARCHAR(255) NULL,
  ADD COLUMN qualification_score INT NULL;
