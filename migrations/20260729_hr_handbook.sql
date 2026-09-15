-- Company Handbook: versioned documents per category, employee-facing read/download.
-- Uploading a new version for a category flips the previous "current" row for that category
-- off, keeping history. MySQL 8 compatible. Plain CREATE only - see
-- migrations/20260721_client_portal.sql for the idempotency contract this relies on.

CREATE TABLE IF NOT EXISTS crm_hr_handbook_documents (
  document_id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'General',
  file_url VARCHAR(500) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_by CHAR(36) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hr_handbook_category (category),
  INDEX idx_hr_handbook_current (is_current)
);
