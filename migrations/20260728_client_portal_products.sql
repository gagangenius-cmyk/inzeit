-- Client Portal product modules (EIP, Student Visa, Visit Visa): explicit product typing on
-- opportunities, per-product client-facing process checklist, two-way conversation scoping,
-- profile-change requests, and generic form submissions.
-- MySQL 8 compatible. Plain ALTER/CREATE only - the migration runner (scripts/setup-database.js)
-- tolerates ER_DUP_FIELDNAME/ER_TABLE_EXISTS_ERROR on repeat runs, so this is safe to re-run.

ALTER TABLE crm_opportunities ADD COLUMN product_type VARCHAR(40) NULL AFTER serviceRequired;

ALTER TABLE crm_forum_leads ADD COLUMN passport_number VARCHAR(50) NULL AFTER nationality;

ALTER TABLE crm_client_conversations ADD COLUMN opportunity_id INT NULL AFTER leadId;

CREATE INDEX idx_client_conversations_lead_opp ON crm_client_conversations (leadId, opportunity_id);

CREATE TABLE IF NOT EXISTS crm_client_checklist_stages (
  stage_id CHAR(36) PRIMARY KEY,
  opportunity_id INT NOT NULL,
  lead_id INT NOT NULL,
  product_type VARCHAR(40) NOT NULL,
  stage_key VARCHAR(60) NOT NULL,
  stage_label VARCHAR(150) NOT NULL,
  sequence INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  status_note TEXT NULL,
  completed_at DATETIME NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_client_checklist_stage (opportunity_id, stage_key),
  INDEX idx_client_checklist_lead (lead_id)
);

CREATE TABLE IF NOT EXISTS crm_client_profile_change_requests (
  request_id CHAR(36) PRIMARY KEY,
  lead_id INT NOT NULL,
  field VARCHAR(60) NOT NULL,
  old_value VARCHAR(255) NULL,
  new_value VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME NULL,
  INDEX idx_profile_change_lead (lead_id),
  INDEX idx_profile_change_status (status)
);

CREATE TABLE IF NOT EXISTS crm_client_form_submissions (
  submission_id CHAR(36) PRIMARY KEY,
  lead_id INT NOT NULL,
  opportunity_id INT NULL,
  form_key VARCHAR(60) NOT NULL,
  form_data LONGTEXT NOT NULL,
  status ENUM('submitted', 'reviewed') NOT NULL DEFAULT 'submitted',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_submissions_lead (lead_id)
);

-- Best-effort backfill of product_type from existing free-text serviceType/serviceRequired so
-- pre-existing opportunities aren't left NULL. Order is most-specific first; staff can correct
-- any of these via the admin UI. Rows that don't match any pattern stay NULL and must be set
-- manually - there's no safe generic guess for those.
UPDATE crm_opportunities
SET product_type = 'eip'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'eip|express entry|economic immigration';

UPDATE crm_opportunities
SET product_type = 'student-visa'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'student|study permit|university';

UPDATE crm_opportunities
SET product_type = 'visit-visa'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'visit visa|visitor visa|tourist visa|trv';

UPDATE crm_opportunities
SET product_type = 'rms'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'resume marketing|rms';

UPDATE crm_opportunities
SET product_type = 'australia-pr'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'australia';

UPDATE crm_opportunities
SET product_type = 'canada-pr'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'skilled|permanent residence|canada';
