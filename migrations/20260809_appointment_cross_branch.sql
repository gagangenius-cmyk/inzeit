-- Cross-branch appointment assignment: a counselor/BM can hand an appointment
-- to a counselor or branch manager in a *different* branch (e.g. the client is
-- travelling, or the assigned branch has no free counselor that slot). The
-- receiving person must acknowledge the assignment, and the person who
-- assigned it is notified once they do (see src/lib/notify.ts / crm_notifications).

SET @appt_schema := DATABASE();

SET @appt_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @appt_schema AND table_name = 'appointments' AND column_name = 'cross_branch') = 0,
  'ALTER TABLE appointments ADD COLUMN cross_branch TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE appt_statement FROM @appt_sql; EXECUTE appt_statement; DEALLOCATE PREPARE appt_statement;

SET @appt_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @appt_schema AND table_name = 'appointments' AND column_name = 'assigned_branch') = 0,
  'ALTER TABLE appointments ADD COLUMN assigned_branch INT NULL',
  'SELECT 1'
);
PREPARE appt_statement FROM @appt_sql; EXECUTE appt_statement; DEALLOCATE PREPARE appt_statement;

SET @appt_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @appt_schema AND table_name = 'appointments' AND column_name = 'assigned_by') = 0,
  'ALTER TABLE appointments ADD COLUMN assigned_by INT NULL',
  'SELECT 1'
);
PREPARE appt_statement FROM @appt_sql; EXECUTE appt_statement; DEALLOCATE PREPARE appt_statement;

SET @appt_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @appt_schema AND table_name = 'appointments' AND column_name = 'acknowledged') = 0,
  'ALTER TABLE appointments ADD COLUMN acknowledged TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE appt_statement FROM @appt_sql; EXECUTE appt_statement; DEALLOCATE PREPARE appt_statement;

SET @appt_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @appt_schema AND table_name = 'appointments' AND column_name = 'acknowledged_at') = 0,
  'ALTER TABLE appointments ADD COLUMN acknowledged_at DATETIME NULL',
  'SELECT 1'
);
PREPARE appt_statement FROM @appt_sql; EXECUTE appt_statement; DEALLOCATE PREPARE appt_statement;
