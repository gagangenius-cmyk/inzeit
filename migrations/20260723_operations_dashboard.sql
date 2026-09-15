-- Operations Dashboard: call logging + task-to-case linkage.
-- Safe to run repeatedly (idempotent via information_schema guards).

CREATE TABLE IF NOT EXISTS crm_call_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  lead_id INT NULL,
  opportunity_id INT NULL,
  requested_by INT NULL,
  assigned_to INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_high_escalation TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_by INT NULL,
  INDEX idx_call_requests_branch (branch_id),
  INDEX idx_call_requests_status (status),
  INDEX idx_call_requests_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- crm_task predates the operations dashboard and has no link to a case or
-- visa-type category. Add both so tasks created from an operations case can
-- be tagged and rolled up by visa type; existing rows stay NULL.
--
-- crm_task.created carries a legacy invalid zero-date default; under strict
-- SQL modes MySQL re-validates every column's default on any ALTER TABLE, so
-- adding these new columns would otherwise fail on that unrelated pre-existing
-- default. Relax sql_mode only for these three statements, then restore it.
SET @dm_task_prior_sql_mode := @@SESSION.sql_mode;
SET SESSION sql_mode = '';

SET @dm_task_schema := DATABASE();

SET @dm_task_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dm_task_schema AND table_name = 'crm_task' AND column_name = 'opportunity_id') = 0,
  'ALTER TABLE crm_task ADD COLUMN opportunity_id INT NULL',
  'SELECT 1'
);
PREPARE dm_task_statement FROM @dm_task_sql; EXECUTE dm_task_statement; DEALLOCATE PREPARE dm_task_statement;

SET @dm_task_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dm_task_schema AND table_name = 'crm_task' AND column_name = 'visa_type') = 0,
  'ALTER TABLE crm_task ADD COLUMN visa_type VARCHAR(50) NULL',
  'SELECT 1'
);
PREPARE dm_task_statement FROM @dm_task_sql; EXECUTE dm_task_statement; DEALLOCATE PREPARE dm_task_statement;

SET @dm_task_sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @dm_task_schema AND table_name = 'crm_task' AND index_name = 'idx_dm_task_opportunity') = 0,
  'ALTER TABLE crm_task ADD INDEX idx_dm_task_opportunity (opportunity_id)',
  'SELECT 1'
);
PREPARE dm_task_statement FROM @dm_task_sql; EXECUTE dm_task_statement; DEALLOCATE PREPARE dm_task_statement;

SET SESSION sql_mode = @dm_task_prior_sql_mode;
