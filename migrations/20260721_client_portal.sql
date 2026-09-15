-- Client Portal: credentialed client login, document checklist, and case status timeline.
-- MySQL 8 compatible. Plain ALTER/CREATE only (no DELIMITER) - the migration runner
-- (scripts/setup-database.js) silently skips any file containing DELIMITER syntax and
-- tolerates ER_DUP_FIELDNAME/ER_TABLE_EXISTS_ERROR on repeat runs, so this is safe to re-run.

CREATE TABLE IF NOT EXISTS crm_client_credentials (
  client_credential_id CHAR(36) PRIMARY KEY,
  lead_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  generated_by CHAR(36) NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_client_credential_lead (lead_id),
  UNIQUE KEY uniq_client_credential_email (email),
  INDEX idx_client_credential_status (status)
);

CREATE TABLE IF NOT EXISTS crm_client_documents (
  document_id CHAR(36) PRIMARY KEY,
  lead_id INT NOT NULL,
  opportunity_id INT NULL,
  checklist_key VARCHAR(100) NOT NULL,
  document_label VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  status ENUM('Pending', 'Submitted', 'Approved', 'Rejected', 'Resubmit Requested') NOT NULL DEFAULT 'Pending',
  reviewer_id CHAR(36) NULL,
  review_note TEXT NULL,
  uploaded_at DATETIME NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_client_document_item (lead_id, opportunity_id, checklist_key),
  INDEX idx_client_document_lead (lead_id),
  INDEX idx_client_document_status (status)
);

CREATE TABLE IF NOT EXISTS crm_client_status_log (
  log_id CHAR(36) PRIMARY KEY,
  lead_id INT NOT NULL,
  opportunity_id INT NULL,
  posted_by CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_status_log_lead (lead_id, created_at)
);
