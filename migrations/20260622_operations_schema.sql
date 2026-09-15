-- Canonical storage for every program-specific operations wizard and list page.
-- Safe to run on a new database before deploying the operations module.

CREATE TABLE IF NOT EXISTS crm_operation_stage_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  stage VARCHAR(80) NOT NULL,
  stageData LONGTEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_operation_stage_data (module, leadId, opportunityId, stage),
  INDEX idx_operation_stage_data_lead (leadId),
  INDEX idx_operation_stage_data_opportunity (opportunityId),
  INDEX idx_operation_stage_data_module (module),
  INDEX idx_operation_stage_data_case (module, leadId, opportunityId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Used by the shared Operations Documents screen/API for documents that are
-- not embedded in a program stage payload.
CREATE TABLE IF NOT EXISTS crm_ops_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  opsId INT NULL,
  doc_type VARCHAR(100) NULL,
  doc_uploaded_for VARCHAR(255) NULL,
  leadId INT NULL,
  tab INT NULL,
  name VARCHAR(555) NULL,
  file VARCHAR(555) NULL,
  created DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL DEFAULT 1,
  status INT NOT NULL DEFAULT 0,
  remarks TEXT NULL,
  download_file INT NOT NULL DEFAULT 0,
  INDEX idx_ops_documents_lead (leadId),
  INDEX idx_ops_documents_ops (opsId),
  INDEX idx_ops_documents_type (doc_type),
  INDEX idx_ops_documents_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supports assigning operations cases to case officers by branch and period.
CREATE TABLE IF NOT EXISTS crm_operation_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_officer INT NOT NULL,
  branch INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL DEFAULT 1,
  status INT NOT NULL DEFAULT 1,
  is_deleted INT NOT NULL DEFAULT 0,
  INDEX idx_operation_allocations_officer (case_officer),
  INDEX idx_operation_allocations_branch (branch),
  INDEX idx_operation_allocations_active (status, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The stage table was introduced before this migration in some environments.
-- Guard each compatibility change through information_schema so this also runs
-- on MySQL-compatible servers that do not implement ADD ... IF NOT EXISTS.
SET @operations_schema := DATABASE();

SET @operations_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @operations_schema AND table_name = 'crm_operation_stage_data' AND column_name = 'stageData') = 0,
  'ALTER TABLE crm_operation_stage_data ADD COLUMN stageData LONGTEXT NOT NULL',
  'SELECT 1'
);
PREPARE operations_statement FROM @operations_sql; EXECUTE operations_statement; DEALLOCATE PREPARE operations_statement;

SET @operations_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @operations_schema AND table_name = 'crm_operation_stage_data' AND column_name = 'createdAt') = 0,
  'ALTER TABLE crm_operation_stage_data ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE operations_statement FROM @operations_sql; EXECUTE operations_statement; DEALLOCATE PREPARE operations_statement;

SET @operations_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @operations_schema AND table_name = 'crm_operation_stage_data' AND column_name = 'updatedAt') = 0,
  'ALTER TABLE crm_operation_stage_data ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE operations_statement FROM @operations_sql; EXECUTE operations_statement; DEALLOCATE PREPARE operations_statement;

SET @operations_sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @operations_schema AND table_name = 'crm_operation_stage_data' AND index_name = 'idx_operation_stage_data_case') = 0,
  'ALTER TABLE crm_operation_stage_data ADD INDEX idx_operation_stage_data_case (module, leadId, opportunityId)',
  'SELECT 1'
);
PREPARE operations_statement FROM @operations_sql; EXECUTE operations_statement; DEALLOCATE PREPARE operations_statement;
