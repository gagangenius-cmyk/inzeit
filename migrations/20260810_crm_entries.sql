-- CRM Entry Operations: real backing tables for the client-acquisition intake
-- pipeline. Previously src/app/admin/ops-crm-entry/page.tsx faked this data by
-- reshaping generic operations-search rows (budget/timeline/requirements/
-- documents/milestones were all hardcoded placeholders with no real source).
-- One crm_crm_entries row per lead's acquisition case, with child tables for
-- its document checklist, milestones, and note log.
-- MySQL 8 compatible. Plain CREATE TABLE IF NOT EXISTS - the migration runner
-- (scripts/setup-database.js) tolerates ER_TABLE_EXISTS_ERROR on repeat runs,
-- so this is safe to re-run.

CREATE TABLE IF NOT EXISTS crm_crm_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  entry_type VARCHAR(60) NOT NULL DEFAULT 'Direct Inquiry',
  source VARCHAR(100) NULL,
  category VARCHAR(100) NULL,
  sub_category VARCHAR(150) NULL,
  service VARCHAR(150) NULL,
  budget VARCHAR(100) NULL,
  timeline VARCHAR(100) NULL,
  expectations TEXT NULL,
  urgency ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status ENUM('initial_contact','qualification','consultation','proposal','agreement','onboarding','completed') NOT NULL DEFAULT 'initial_contact',
  assigned_to INT NULL,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_crm_entries_lead (leadId),
  INDEX idx_crm_entries_opportunity (opportunityId),
  INDEX idx_crm_entries_status (status),
  INDEX idx_crm_entries_assigned (assigned_to)
);

CREATE TABLE IF NOT EXISTS crm_crm_entry_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  requirement VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crm_req_entry (entry_id)
);

CREATE TABLE IF NOT EXISTS crm_crm_entry_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  status ENUM('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
  file_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_crm_entry_document (entry_id, document_type),
  INDEX idx_crm_doc_entry (entry_id)
);

CREATE TABLE IF NOT EXISTS crm_crm_entry_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  phase VARCHAR(150) NOT NULL,
  status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  completed_date DATE NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_crm_milestone_entry (entry_id)
);

CREATE TABLE IF NOT EXISTS crm_crm_entry_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  note TEXT NOT NULL,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crm_note_entry (entry_id)
);
