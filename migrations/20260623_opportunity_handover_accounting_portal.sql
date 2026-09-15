-- Counselor → accounting → operations workflow.
CREATE TABLE IF NOT EXISTS crm_opportunity_handover_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  opportunity_id INT NULL,
  counselor_id INT NULL,
  conversation_summary TEXT NOT NULL,
  client_commitments TEXT NULL,
  next_action TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_handover_opportunity (opportunity_id),
  INDEX idx_handover_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_opportunity_accounting_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  opportunity_id INT NOT NULL,
  payment_proof_url VARCHAR(500) NULL,
  payment_received TINYINT(1) NOT NULL DEFAULT 0,
  documents_complete TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  accountant_id INT NULL,
  notes TEXT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  UNIQUE KEY uniq_accounting_verification_opportunity (opportunity_id),
  INDEX idx_accounting_verification_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_client_upload_portals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(40) NOT NULL UNIQUE,
  lead_id INT NOT NULL,
  opportunity_id INT NULL,
  agreement_number VARCHAR(100) NULL,
  access_token CHAR(64) NOT NULL UNIQUE,
  status ENUM('active','closed','expired') NOT NULL DEFAULT 'active',
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_portal_lead (lead_id),
  INDEX idx_client_portal_opportunity (opportunity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_client_upload_checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  portal_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('pending','uploaded','verified','rejected') NOT NULL DEFAULT 'pending',
  file_url VARCHAR(500) NULL,
  uploaded_at DATETIME NULL,
  verified_by INT NULL,
  verified_at DATETIME NULL,
  notes TEXT NULL,
  INDEX idx_client_checklist_portal (portal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CMG CRM process-flow gates.  This table is the authoritative workflow state;
-- the legacy opportunity status remains available for existing reports.
CREATE TABLE IF NOT EXISTS crm_opportunity_workflow_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT NOT NULL UNIQUE,
  lead_id INT NOT NULL,
  workflow_status VARCHAR(50) NOT NULL DEFAULT 'opportunity_created',
  official_id_data JSON NULL,
  payment_data JSON NULL,
  finance_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  finance_checklist JSON NULL,
  finance_reason TEXT NULL,
  finance_reviewed_by INT NULL,
  finance_reviewed_at DATETIME NULL,
  compliance_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  compliance_checklist JSON NULL,
  compliance_reason TEXT NULL,
  compliance_reviewed_by INT NULL,
  compliance_reviewed_at DATETIME NULL,
  formal_client_id VARCHAR(40) NULL UNIQUE,
  case_activated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_workflow_finance (finance_status),
  INDEX idx_workflow_compliance (compliance_status),
  INDEX idx_workflow_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_opportunity_workflow_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT NOT NULL,
  action VARCHAR(80) NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  actor_id INT NULL,
  actor_role VARCHAR(80) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_workflow_audit_opportunity (opportunity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
