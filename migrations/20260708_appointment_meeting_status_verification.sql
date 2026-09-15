-- The `appointments` table only had booked/done/not_done flags, which can't
-- distinguish "No Show" from "Cancelled" or represent "Rescheduled" at all
-- (statusToFlags() in AppointmentScheduler.tsx mapped both to identical flag
-- combinations). meeting_status is now the source of truth for that state;
-- booked/done/not_done are kept in sync for any legacy reads.
--
-- meeting_verified/verified_by/verified_at/foe_remark let a FOE confirm
-- whether an uploaded meeting-done proof (the existing `screenshot` column)
-- actually shows the meeting happened, independent of the counselor who
-- marked it done.
-- No IF NOT EXISTS: this server's MySQL/MariaDB version doesn't support it on
-- ADD COLUMN. runSqlMigrations() in scripts/setup-database.js already treats
-- ER_DUP_FIELDNAME as an idempotent no-op on re-runs, and the columnMigrations
-- ensureColumn() pass right after this one is the real idempotency guard.
ALTER TABLE appointments
  ADD COLUMN meeting_status VARCHAR(20) NULL,
  ADD COLUMN meeting_verified TINYINT NULL DEFAULT NULL,
  ADD COLUMN verified_by INT NULL,
  ADD COLUMN verified_at DATETIME NULL,
  ADD COLUMN foe_remark VARCHAR(500) NULL;
