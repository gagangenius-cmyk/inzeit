-- HR joining and exit workflows (MySQL 8)

CREATE TABLE IF NOT EXISTS crm_hr_recruitment_candidates (
  candidate_id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(80) NULL,
  applied_position VARCHAR(180) NOT NULL,
  applied_date DATE NOT NULL,
  source VARCHAR(120) NULL,
  interview_date DATETIME NULL,
  interview_outcome ENUM('Pending', 'Pass', 'Fail') NOT NULL DEFAULT 'Pending',
  status ENUM('Applied', 'Interviewed', 'Selected', 'Rejected', 'Offer Sent', 'Accepted', 'Joined') NOT NULL DEFAULT 'Applied',
  rejection_reason TEXT NULL,
  offer_salary DECIMAL(12,2) NULL,
  offer_designation VARCHAR(180) NULL,
  offer_terms TEXT NULL,
  offer_letter_url TEXT NULL,
  offer_sent_at DATETIME NULL,
  offer_accepted_at DATETIME NULL,
  joining_date DATE NULL,
  company_email VARCHAR(255) NULL,
  crm_id_generated_at DATETIME NULL,
  employee_id CHAR(36) NULL,
  dos_approved_by CHAR(36) NULL,
  dos_approved_at DATETIME NULL,
  acceptance_token CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_candidate_status (status),
  INDEX idx_hr_candidate_email (email),
  INDEX idx_hr_candidate_interview (interview_date)
);

CREATE TABLE IF NOT EXISTS crm_hr_exit_requests (
  exit_request_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  exit_type ENUM('Resignation', 'Termination') NOT NULL,
  submitted_by CHAR(36) NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL,
  requested_lwd DATE NULL,
  approved_lwd DATE NULL,
  approved_by CHAR(36) NULL,
  approved_at DATETIME NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending',
  exit_interview_id CHAR(36) NULL,
  fnf_email_sent_at DATETIME NULL,
  fnf_email_status ENUM('Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Pending',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_exit_request_employee (employee_id),
  INDEX idx_hr_exit_request_status (status),
  INDEX idx_hr_exit_request_type (exit_type)
);

CREATE TABLE IF NOT EXISTS crm_hr_workflow_notifications (
  notification_id CHAR(36) PRIMARY KEY,
  workflow_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('Queued', 'Sent', 'Failed') NOT NULL DEFAULT 'Queued',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hr_workflow_notification_entity (entity_id),
  INDEX idx_hr_workflow_notification_status (status)
);
