-- Case Milestones: generic, cross-program case-processing structure.
--
-- Gap this fills: of the 20 program-specific operations wizards
-- (src/app/admin/leads/*-operations-wizard.tsx), only skill-canada (Express
-- Entry) has structured fields for government reference numbers, decisions,
-- visa/residence issuance, and closure reasons - the other 19 have only a
-- free-text "Application Status" dropdown, and NONE have any RFE (request
-- for additional evidence) or interview-scheduling structure at all. Rather
-- than editing 20 wizard files, these tables back one new shared
-- "Case Milestones" tab injected once into OperationsWizardShell.tsx, so
-- every module gets this for free - the same approach already used there for
-- the Client Documents and Chat tabs.
--
-- Distinct from (not a replacement for): crm_operation_stage_data (the
-- per-module JSON stage blobs - unstructured, wizard-specific) and
-- crm_immigration_tool_results (pre-sales eligibility screening tied to a
-- lead, not a case). Distinct from crm_pro_* (internal UAE company/staff
-- compliance, not client case data - see docs/CASE_MILESTONES.md).

CREATE TABLE IF NOT EXISTS crm_case_eligibility_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  assessedBy INT NOT NULL,
  assessmentDate DATE NOT NULL,
  criteria JSON NULL,
  score INT NULL,
  outcome ENUM('eligible', 'not_eligible', 'conditionally_eligible') NOT NULL,
  notes TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_eligibility_lead (leadId),
  INDEX idx_case_eligibility_opportunity (opportunityId),
  INDEX idx_case_eligibility_module (module),
  CONSTRAINT fk_case_eligibility_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_eligibility_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_case_eligibility_assessed_by FOREIGN KEY (assessedBy) REFERENCES crm_employee(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS crm_case_references (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  referenceType VARCHAR(100) NOT NULL,
  referenceNumber VARCHAR(255) NOT NULL,
  issuedDate DATE NULL,
  notes TEXT NULL,
  createdBy INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_references_lead (leadId),
  INDEX idx_case_references_opportunity (opportunityId),
  INDEX idx_case_references_module (module),
  CONSTRAINT fk_case_references_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_references_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_case_references_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS crm_case_rfe_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  requestedBy VARCHAR(255) NULL,
  requestDate DATE NOT NULL,
  description TEXT NOT NULL,
  documentsRequired TEXT NULL,
  responseDueDate DATE NULL,
  responseSubmittedDate DATE NULL,
  status ENUM('pending', 'submitted', 'overdue', 'waived') NOT NULL DEFAULT 'pending',
  createdBy INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_rfe_lead (leadId),
  INDEX idx_case_rfe_opportunity (opportunityId),
  INDEX idx_case_rfe_status (status),
  INDEX idx_case_rfe_due (responseDueDate),
  CONSTRAINT fk_case_rfe_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_rfe_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_case_rfe_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS crm_case_interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  interviewType VARCHAR(100) NULL,
  scheduledAt DATETIME NULL,
  location VARCHAR(255) NULL,
  mode ENUM('in_person', 'video', 'phone') NOT NULL DEFAULT 'in_person',
  status ENUM('scheduled', 'completed', 'rescheduled', 'no_show', 'cancelled') NOT NULL DEFAULT 'scheduled',
  outcome ENUM('passed', 'failed', 'pending') NULL,
  outcomeNotes TEXT NULL,
  createdBy INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_interviews_lead (leadId),
  INDEX idx_case_interviews_opportunity (opportunityId),
  INDEX idx_case_interviews_scheduled (scheduledAt),
  CONSTRAINT fk_case_interviews_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_interviews_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_case_interviews_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS crm_case_decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  decision ENUM('approved', 'refused', 'withdrawn', 'pending') NOT NULL DEFAULT 'pending',
  decisionDate DATE NULL,
  decisionNotes TEXT NULL,
  issuedDocumentType VARCHAR(100) NULL,
  issuedDocumentNumber VARCHAR(255) NULL,
  issueDate DATE NULL,
  expiryDate DATE NULL,
  createdBy INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_decisions_lead (leadId),
  INDEX idx_case_decisions_opportunity (opportunityId),
  INDEX idx_case_decisions_expiry (expiryDate),
  CONSTRAINT fk_case_decisions_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_decisions_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_case_decisions_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS crm_case_closures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  leadId INT NOT NULL,
  opportunityId INT NULL,
  closureReason ENUM('visa_approved_completed', 'client_withdrew', 'refused', 'non_payment', 'other') NOT NULL,
  closureDate DATE NOT NULL,
  closedBy INT NOT NULL,
  notes TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_case_closure (leadId, module),
  INDEX idx_case_closures_opportunity (opportunityId),
  CONSTRAINT fk_case_closures_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_closures_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  CONSTRAINT fk_case_closures_closed_by FOREIGN KEY (closedBy) REFERENCES crm_employee(id) ON DELETE RESTRICT
);
