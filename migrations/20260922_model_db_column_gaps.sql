-- Columns required by Sequelize models/routes but absent from the live schema
-- audited by scripts/verify-model-db-columns.js.

ALTER TABLE appointments
  ADD COLUMN remarks TEXT NULL AFTER foe_remark;

ALTER TABLE crm_follow_up_reminders
  ADD COLUMN completion_notes TEXT NULL AFTER completed_at;

ALTER TABLE crm_forum_leads
  ADD COLUMN sf INT NOT NULL DEFAULT 0 AFTER old_branch,
  ADD COLUMN budget_range VARCHAR(100) NULL AFTER qualification_score,
  ADD COLUMN timeline VARCHAR(100) NULL AFTER budget_range,
  ADD COLUMN decision_maker VARCHAR(255) NULL AFTER timeline,
  ADD COLUMN decision_maker_title VARCHAR(255) NULL AFTER decision_maker,
  ADD COLUMN decision_maker_contact VARCHAR(255) NULL AFTER decision_maker_title,
  ADD COLUMN next_followup_date DATETIME NULL AFTER decision_maker_contact,
  ADD COLUMN opportunity_notes TEXT NULL AFTER next_followup_date,
  ADD COLUMN tags VARCHAR(500) NULL AFTER opportunity_notes;

ALTER TABLE crm_hr_employee_documents
  ADD COLUMN document_url VARCHAR(500) NULL AFTER document_type,
  ADD COLUMN expiry_date DATE NULL AFTER document_url,
  ADD COLUMN notes TEXT NULL AFTER expiry_date,
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER deleted_at;

UPDATE crm_hr_employee_documents
SET document_url = file_url
WHERE document_url IS NULL AND file_url IS NOT NULL;
