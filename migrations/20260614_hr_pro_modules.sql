-- HR and PRO Works module schema
-- MySQL 8 compatible. Safe to run more than once for table creation.

CREATE TABLE IF NOT EXISTS crm_hr_attendance_records (
  attendance_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  check_in TIME NULL,
  check_out TIME NULL,
  status ENUM('Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'Holiday') NOT NULL,
  overtime_hours DECIMAL(5,2) NULL DEFAULT 0,
  source ENUM('Manual', 'Biometric', 'Import') NOT NULL,
  notes TEXT NULL,
  approved_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_attendance_employee_date (employee_id, date),
  INDEX idx_hr_attendance_status (status),
  INDEX idx_hr_attendance_source (source)
);

CREATE TABLE IF NOT EXISTS crm_hr_leave_requests (
  leave_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  manager_id CHAR(36) NULL,
  leave_type ENUM('Annual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave', 'Hajj Leave', 'Bereavement Leave', 'Unpaid Leave', 'Compensatory Leave') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(6,2) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
  workflow_status ENUM('Manager Review', 'HR Confirmation', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Manager Review',
  reason TEXT NULL,
  medical_certificate_required BOOLEAN NOT NULL DEFAULT false,
  document_url TEXT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  manager_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  manager_reviewed_at DATETIME NULL,
  manager_comment TEXT NULL,
  hr_status ENUM('Pending', 'Confirmed', 'Overridden') NOT NULL DEFAULT 'Pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME NULL,
  review_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_leave_employee_year (employee_id, start_date),
  INDEX idx_hr_leave_status (status),
  INDEX idx_hr_leave_type (leave_type)
);

CREATE TABLE IF NOT EXISTS crm_hr_leave_balances (
  balance_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  leave_type VARCHAR(80) NOT NULL,
  year INT NOT NULL,
  entitlement_days DECIMAL(6,2) NOT NULL DEFAULT 0,
  used_days DECIMAL(6,2) NOT NULL DEFAULT 0,
  pending_days DECIMAL(6,2) NOT NULL DEFAULT 0,
  remaining_days DECIMAL(6,2) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_hr_leave_balance (employee_id, leave_type, year),
  INDEX idx_hr_leave_balance_employee (employee_id, year)
);

CREATE TABLE IF NOT EXISTS crm_hr_eosb_settlements (
  eosb_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  joining_date DATE NOT NULL,
  last_working_day DATE NOT NULL,
  years_of_service DECIMAL(6,2) NOT NULL DEFAULT 0,
  separation_reason ENUM('Resignation', 'Termination', 'Retirement', 'Death', 'Mutual') NOT NULL,
  last_basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  eosb_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  leave_balance_days INT NOT NULL DEFAULT 0,
  leave_encashment DECIMAL(12,2) NOT NULL DEFAULT 0,
  unpaid_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_payable DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NOT NULL,
  settlement_date DATE NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_eosb_employee (employee_id),
  INDEX idx_hr_eosb_reason (separation_reason),
  INDEX idx_hr_eosb_settlement_date (settlement_date)
);

CREATE TABLE IF NOT EXISTS crm_hr_payslips (
  payslip_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  pay_year INT NOT NULL,
  pay_month INT NOT NULL,
  pay_period VARCHAR(20) NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  allowances_json JSON NULL,
  overtime_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  overtime_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deductions_json JSON NULL,
  gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  bank_name VARCHAR(255) NULL,
  masked_iban VARCHAR(80) NULL,
  ytd_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  storage_key VARCHAR(500) NOT NULL,
  signed_url TEXT NOT NULL,
  signed_url_expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_hr_payslip_employee_month (employee_id, pay_year, pay_month),
  INDEX idx_hr_payslip_employee (employee_id)
);

CREATE TABLE IF NOT EXISTS crm_hr_exit_checklists (
  checklist_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  separation_reason VARCHAR(80) NULL,
  last_working_day DATE NULL,
  status ENUM('Open', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Open',
  assigned_by CHAR(36) NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  INDEX idx_hr_exit_checklist_employee (employee_id),
  INDEX idx_hr_exit_checklist_status (status)
);

CREATE TABLE IF NOT EXISTS crm_hr_exit_checklist_items (
  item_id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  department VARCHAR(50) NOT NULL,
  item_text VARCHAR(255) NOT NULL,
  owner_role VARCHAR(100) NOT NULL,
  status ENUM('Pending', 'Completed', 'Waived') NOT NULL DEFAULT 'Pending',
  completed_by CHAR(36) NULL,
  completed_at DATETIME NULL,
  notes TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  INDEX idx_hr_exit_item_checklist (checklist_id),
  INDEX idx_hr_exit_item_employee (employee_id),
  INDEX idx_hr_exit_item_department (department),
  INDEX idx_hr_exit_item_status (status)
);

CREATE TABLE IF NOT EXISTS crm_hr_letter_templates (
  template_id CHAR(36) PRIMARY KEY,
  letter_type ENUM('relieving', 'experience') NOT NULL,
  template_name VARCHAR(150) NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_letter_template_type (letter_type, is_active)
);

CREATE TABLE IF NOT EXISTS crm_hr_employee_letters (
  letter_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  letter_type ENUM('relieving', 'experience') NOT NULL,
  template_id CHAR(36) NOT NULL,
  ref_number VARCHAR(80) NOT NULL,
  issue_date DATE NOT NULL,
  last_working_day DATE NOT NULL,
  designation VARCHAR(150) NULL,
  department VARCHAR(150) NULL,
  rendered_body TEXT NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  signed_url TEXT NOT NULL,
  signed_url_expires_at DATETIME NOT NULL,
  generated_by CHAR(36) NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_hr_letter_ref (ref_number),
  INDEX idx_hr_employee_letter_employee (employee_id),
  INDEX idx_hr_employee_letter_type (letter_type)
);

CREATE TABLE IF NOT EXISTS crm_hr_exit_interviews (
  exit_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  interview_date DATE NOT NULL,
  conducted_by CHAR(36) NOT NULL,
  reason_leaving ENUM('Better Opportunity', 'Salary', 'Relocation', 'Personal', 'Termination', 'Other') NOT NULL,
  reason_details TEXT NULL,
  job_satisfaction TINYINT NOT NULL,
  mgmt_satisfaction TINYINT NOT NULL,
  work_env_rating TINYINT NOT NULL,
  compensation_rating TINYINT NOT NULL,
  growth_rating TINYINT NOT NULL,
  recommend_company BOOLEAN NOT NULL,
  rehire_eligible BOOLEAN NOT NULL,
  feedback_text TEXT NULL,
  suggestions TEXT NULL,
  confidential BOOLEAN NOT NULL DEFAULT true,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_exit_interview_employee (employee_id),
  INDEX idx_hr_exit_interview_reason (reason_leaving),
  INDEX idx_hr_exit_interview_date (interview_date)
);

CREATE TABLE IF NOT EXISTS crm_hr_headcount_snapshots (
  snapshot_id CHAR(36) PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  snapshot_month DATE NOT NULL,
  total INT NOT NULL DEFAULT 0,
  active INT NOT NULL DEFAULT 0,
  inactive INT NOT NULL DEFAULT 0,
  on_leave INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_hr_headcount_snapshot_month (snapshot_month),
  INDEX idx_hr_headcount_snapshot_date (snapshot_date)
);

CREATE TABLE IF NOT EXISTS crm_hr_employee_documents (
  document_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  document_type VARCHAR(120) NOT NULL,
  file_name VARCHAR(255) NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_by CHAR(36) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_hr_employee_document_employee (employee_id),
  INDEX idx_hr_employee_document_type (document_type),
  INDEX idx_hr_employee_document_deleted (deleted_at)
);

CREATE TABLE IF NOT EXISTS crm_pro_companies (
  company_id CHAR(36) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  mohre_employer_code VARCHAR(255) NULL,
  gdrfa_establishment_no VARCHAR(255) NULL,
  tax_registration_no VARCHAR(255) NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pro_company_status (status),
  INDEX idx_pro_company_deleted (deleted_at)
);

CREATE TABLE IF NOT EXISTS crm_pro_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id CHAR(36) NULL,
  company_id CHAR(36) NULL,
  title VARCHAR(255) NULL,
  doc_type ENUM('Trade License', 'Chamber Certificate', 'Establishment Card', 'MOA', 'AOA', 'VAT Certificate', 'Tax Registration', 'Office Lease', 'Bank Account', 'Other') NULL,
  doc_number VARCHAR(255) NULL,
  issuing_authority VARCHAR(255) NULL,
  category VARCHAR(100) NULL,
  owner VARCHAR(255) NULL,
  authority VARCHAR(255) NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  reminder_days JSON NULL,
  status ENUM('Valid', 'Expiring Soon', 'Expired', 'Renewal In Progress', 'Cancelled') NOT NULL DEFAULT 'Valid',
  doc_file_url VARCHAR(500) NULL,
  notes TEXT NULL,
  managed_by CHAR(36) NULL,
  renewal_cost DECIMAL(12,2) NULL,
  last_renewed DATE NULL,
  location VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pro_document_company (company_id),
  INDEX idx_pro_document_expiry (expiry_date),
  INDEX idx_pro_document_status (status)
);

CREATE TABLE IF NOT EXISTS crm_pro_employee_immigration (
  pro_emp_id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  visa_uid VARCHAR(255) NOT NULL,
  visa_type ENUM('Employment', 'Mission', 'Investor', 'Partner', 'Other') NOT NULL,
  visa_issue_date DATE NOT NULL,
  visa_expiry_date DATE NOT NULL,
  visa_status ENUM('Active', 'Expiring', 'Expired', 'Cancelled', 'Under Processing') NOT NULL DEFAULT 'Active',
  labour_card_no VARCHAR(255) NOT NULL,
  labour_card_expiry DATE NOT NULL,
  contract_type ENUM('Limited', 'Unlimited') NOT NULL,
  mohre_contract_ref VARCHAR(255) NULL,
  medical_fitness DATE NULL,
  health_insurance_no VARCHAR(255) NULL,
  insurance_expiry DATE NULL,
  entry_permit_no VARCHAR(255) NULL,
  status_change_log JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pro_employee_immigration_employee (employee_id),
  INDEX idx_pro_employee_visa_expiry (visa_expiry_date),
  INDEX idx_pro_employee_labour_expiry (labour_card_expiry),
  INDEX idx_pro_employee_insurance_expiry (insurance_expiry),
  INDEX idx_pro_employee_visa_status (visa_status)
);

CREATE TABLE IF NOT EXISTS crm_pro_wps_records (
  wps_id CHAR(36) PRIMARY KEY,
  payroll_month DATE NOT NULL,
  employer_code VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  total_employees INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  sif_file_url VARCHAR(500) NULL,
  submission_date DATE NULL,
  submission_ref VARCHAR(255) NULL,
  status ENUM('Draft', 'Generated', 'Submitted', 'Confirmed', 'Rejected') NOT NULL DEFAULT 'Draft',
  rejection_reason TEXT NULL,
  processed_by CHAR(36) NOT NULL,
  salary_records JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pro_wps_month (payroll_month),
  INDEX idx_pro_wps_status (status),
  INDEX idx_pro_wps_processed_by (processed_by)
);

CREATE TABLE IF NOT EXISTS crm_pro_insurance_records (
  insurance_id CHAR(36) PRIMARY KEY,
  insurance_category ENUM('Health', 'Vehicle', 'Office', 'Workmen Compensation', 'Other') NOT NULL DEFAULT 'Health',
  employee_id CHAR(36) NULL,
  insured_name VARCHAR(255) NOT NULL,
  insurance_company VARCHAR(255) NOT NULL,
  policy_number VARCHAR(255) NOT NULL,
  policy_start DATE NOT NULL,
  policy_expiry DATE NOT NULL,
  coverage_amount DECIMAL(12,2) NULL,
  premium_amount DECIMAL(12,2) NULL,
  dependents JSON NULL,
  network_code VARCHAR(100) NULL,
  card_url VARCHAR(500) NULL,
  status ENUM('Active', 'Expiring', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pro_insurance_policy (policy_number),
  INDEX idx_pro_insurance_expiry (policy_expiry),
  INDEX idx_pro_insurance_status (status),
  INDEX idx_pro_insurance_employee (employee_id)
);

CREATE TABLE IF NOT EXISTS crm_pro_gcc_branch_documents (
  branch_id CHAR(36) PRIMARY KEY,
  branch_name VARCHAR(255) NOT NULL,
  country ENUM('UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman') NOT NULL,
  city VARCHAR(255) NOT NULL,
  registration_no VARCHAR(255) NOT NULL,
  registration_expiry DATE NOT NULL,
  licence_type VARCHAR(255) NOT NULL,
  licence_expiry DATE NOT NULL,
  bank_account VARCHAR(255) NULL,
  bank_name VARCHAR(255) NULL,
  branch_manager VARCHAR(255) NULL,
  contact_phone VARCHAR(100) NULL,
  documents JSON NULL,
  notes TEXT NULL,
  status ENUM('Active', 'Inactive', 'Renewal Pending') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_gcc_branch_registration (country, registration_no),
  INDEX idx_gcc_branch_registration_expiry (registration_expiry),
  INDEX idx_gcc_branch_licence_expiry (licence_expiry),
  INDEX idx_gcc_branch_status (status)
);

CREATE TABLE IF NOT EXISTS crm_pro_owner_documents (
  owner_id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('Owner', 'Partner', 'Investor', 'Director', 'Signatory') NOT NULL,
  nationality VARCHAR(255) NOT NULL,
  passport_no VARCHAR(255) NOT NULL,
  passport_expiry DATE NOT NULL,
  emirates_id VARCHAR(255) NULL,
  emirates_id_expiry DATE NULL,
  residence_visa_no VARCHAR(255) NULL,
  visa_expiry DATE NULL,
  share_percentage DECIMAL(6,2) NULL,
  poa_document VARCHAR(500) NULL,
  poa_expiry DATE NULL,
  signature_specimen VARCHAR(500) NULL,
  bank_signatories JSON NULL,
  documents JSON NULL,
  access_level ENUM('Restricted') NOT NULL DEFAULT 'Restricted',
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_owner_passport (passport_no),
  INDEX idx_owner_passport_expiry (passport_expiry),
  INDEX idx_owner_eid_expiry (emirates_id_expiry),
  INDEX idx_owner_visa_expiry (visa_expiry),
  INDEX idx_owner_poa_expiry (poa_expiry),
  INDEX idx_owner_deleted (deleted_at)
);

CREATE TABLE IF NOT EXISTS crm_pro_monthly_tasks (
  task_id CHAR(36) PRIMARY KEY,
  task_month DATE NOT NULL,
  priority ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
  task_label VARCHAR(255) NOT NULL,
  entity_type ENUM('Company', 'Employee', 'Insurance', 'Branch', 'Owner') NOT NULL,
  entity_ref_id CHAR(36) NOT NULL,
  doc_type VARCHAR(120) NOT NULL,
  expiry_date DATE NOT NULL,
  est_cost_aed DECIMAL(12,2) NULL,
  assigned_to CHAR(36) NULL,
  status ENUM('To Do', 'In Progress', 'Renewal Applied', 'Completed', 'On Hold') NOT NULL DEFAULT 'To Do',
  due_date DATE NOT NULL,
  notes TEXT NULL,
  completed_at DATETIME NULL,
  completed_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pro_monthly_task_source (task_month, entity_type, entity_ref_id, doc_type, expiry_date),
  INDEX idx_pro_monthly_task_month (task_month),
  INDEX idx_pro_monthly_task_status (status),
  INDEX idx_pro_monthly_task_priority (priority),
  INDEX idx_pro_monthly_task_due (due_date)
);

CREATE TABLE IF NOT EXISTS crm_pro_wps_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  month_label VARCHAR(50) NOT NULL,
  employees INT NOT NULL DEFAULT 0,
  gross_payroll DECIMAL(12,2) NOT NULL DEFAULT 0,
  sif_status VARCHAR(50) NOT NULL DEFAULT 'Prepared',
  bank VARCHAR(255) NOT NULL DEFAULT '',
  transfer_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_pro_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  due_date DATE NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  status VARCHAR(50) NOT NULL DEFAULT 'Open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_log (
  log_id CHAR(36) PRIMARY KEY,
  source_module VARCHAR(50) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  employee_id CHAR(36) NULL,
  company_id CHAR(36) NULL,
  threshold_days INT NOT NULL,
  expiry_date DATE NOT NULL,
  notified_parties JSON NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channels JSON NULL,
  status ENUM('Sent', 'Skipped', 'Failed') NOT NULL DEFAULT 'Sent',
  error_message TEXT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_notification_log (source_module, document_type, record_id, threshold_days, expiry_date),
  INDEX idx_notification_log_expiry (expiry_date),
  INDEX idx_notification_log_sent (sent_at)
);

CREATE TABLE IF NOT EXISTS data_access_audit_log (
  audit_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action VARCHAR(80) NOT NULL,
  metadata JSON NULL,
  accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_data_access_entity (entity_type, entity_id),
  INDEX idx_data_access_user (user_id),
  INDEX idx_data_access_at (accessed_at)
);

DROP PROCEDURE IF EXISTS dm_add_column_if_missing;
DELIMITER //
CREATE PROCEDURE dm_add_column_if_missing(
  IN target_table VARCHAR(64),
  IN target_column VARCHAR(64),
  IN column_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = target_table
      AND COLUMN_NAME = target_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', target_table, '` ADD COLUMN `', target_column, '` ', column_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

CALL dm_add_column_if_missing('crm_employee', 'work_location', "ENUM('Onshore', 'Offshore', 'Remote-UAE', 'GCC-Branch') NOT NULL DEFAULT 'Onshore'");
CALL dm_add_column_if_missing('crm_employee', 'work_country', "VARCHAR(255) NULL DEFAULT 'UAE'");
CALL dm_add_column_if_missing('crm_employee', 'work_city', 'VARCHAR(255) NULL');
CALL dm_add_column_if_missing('crm_employee', 'work_site', 'VARCHAR(255) NULL');
CALL dm_add_column_if_missing('crm_employee', 'employment_type', "ENUM('Full-time', 'Contract', 'Freelance', 'Part-time') NOT NULL DEFAULT 'Full-time'");

CALL dm_add_column_if_missing('crm_hr_leave_requests', 'manager_id', 'CHAR(36) NULL AFTER employee_id');
CALL dm_add_column_if_missing('crm_hr_leave_requests', 'workflow_status', "ENUM('Manager Review', 'HR Confirmation', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Manager Review' AFTER status");
CALL dm_add_column_if_missing('crm_hr_leave_requests', 'manager_status', "ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending' AFTER applied_at");
CALL dm_add_column_if_missing('crm_hr_leave_requests', 'manager_reviewed_at', 'DATETIME NULL AFTER manager_status');
CALL dm_add_column_if_missing('crm_hr_leave_requests', 'manager_comment', 'TEXT NULL AFTER manager_reviewed_at');
CALL dm_add_column_if_missing('crm_hr_leave_requests', 'hr_status', "ENUM('Pending', 'Confirmed', 'Overridden') NOT NULL DEFAULT 'Pending' AFTER manager_comment");

CALL dm_add_column_if_missing('crm_pro_documents', 'document_id', 'CHAR(36) NULL AFTER id');
CALL dm_add_column_if_missing('crm_pro_documents', 'company_id', 'CHAR(36) NULL AFTER document_id');
CALL dm_add_column_if_missing('crm_pro_documents', 'doc_type', "ENUM('Trade License', 'Chamber Certificate', 'Establishment Card', 'MOA', 'AOA', 'VAT Certificate', 'Tax Registration', 'Office Lease', 'Bank Account', 'Other') NULL AFTER title");
CALL dm_add_column_if_missing('crm_pro_documents', 'doc_number', 'VARCHAR(255) NULL AFTER doc_type');
CALL dm_add_column_if_missing('crm_pro_documents', 'issuing_authority', 'VARCHAR(255) NULL AFTER doc_number');
CALL dm_add_column_if_missing('crm_pro_documents', 'reminder_days', 'JSON NULL AFTER expiry_date');
CALL dm_add_column_if_missing('crm_pro_documents', 'doc_file_url', 'VARCHAR(500) NULL AFTER status');
CALL dm_add_column_if_missing('crm_pro_documents', 'notes', 'TEXT NULL AFTER doc_file_url');
CALL dm_add_column_if_missing('crm_pro_documents', 'managed_by', 'CHAR(36) NULL AFTER notes');
CALL dm_add_column_if_missing('crm_pro_documents', 'renewal_cost', 'DECIMAL(12,2) NULL AFTER managed_by');
CALL dm_add_column_if_missing('crm_pro_documents', 'last_renewed', 'DATE NULL AFTER renewal_cost');

DROP PROCEDURE dm_add_column_if_missing;
