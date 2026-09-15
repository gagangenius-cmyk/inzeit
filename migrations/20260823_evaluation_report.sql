-- Backs the new Hyderabad-only "Generate Evaluation Report" wizard
-- (src/app/admin/leads/evaluation-report-wizard.tsx). Deliberately NOT
-- crm_opportunity_documents — that table's opportunityId FK is NOT NULL,
-- and this flow structurally never creates a crm_opportunities row (the
-- payment for this flow is recorded via POST /api/receipts with
-- opportunityId omitted, so it can never make the lead eligible to appear
-- on /admin/clients — see that route and src/app/api/admin/clients/route.ts).
-- Scoped by lead_id instead of opportunityId.
CREATE TABLE crm_evaluation_report_documents (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  document_label VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','uploaded','verified','rejected') NOT NULL DEFAULT 'uploaded',
  verified_by INT NULL,
  verified_at DATETIME NULL,
  review_note TEXT NULL,
  CONSTRAINT fk_eval_report_doc_lead FOREIGN KEY (lead_id) REFERENCES crm_forum_leads(id),
  CONSTRAINT fk_eval_report_doc_uploader FOREIGN KEY (uploaded_by) REFERENCES crm_employee(id),
  CONSTRAINT fk_eval_report_doc_verifier FOREIGN KEY (verified_by) REFERENCES crm_employee(id),
  INDEX idx_eval_report_doc_lead (lead_id),
  INDEX idx_eval_report_doc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per generated Evaluation Report — keeps the counselor's
-- eligibility write-up and the fee actually charged on record server-side
-- (not just printed to a PDF and lost), and lets the wizard detect
-- "already completed" and offer reprint instead of re-finalizing.
CREATE TABLE crm_evaluation_reports (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  eligibility_summary TEXT NOT NULL,
  fee_paid DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  receipt_number VARCHAR(255) NULL,
  generated_by INT NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eval_report_lead FOREIGN KEY (lead_id) REFERENCES crm_forum_leads(id),
  CONSTRAINT fk_eval_report_generator FOREIGN KEY (generated_by) REFERENCES crm_employee(id),
  INDEX idx_eval_report_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
