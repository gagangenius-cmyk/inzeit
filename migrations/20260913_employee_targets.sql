-- Hierarchical monthly Target Assignment (crm_employee.manager_id backbone -
-- see 20260723b_employee_reporting_manager.sql). One row per
-- employee/month/target-type; target-type splits "new leads" (meetings/
-- appointments/sales revenue) from "balance recovery / collection" targets.
-- See docs/TARGET_ASSIGNMENT_AND_ORG_STRUCTURE.md for the full design.
CREATE TABLE IF NOT EXISTS crm_employee_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  assigned_by INT NULL,
  target_month DATE NOT NULL,
  target_type VARCHAR(20) NOT NULL DEFAULT 'new_leads',
  meetings_target INT NULL,
  appointments_target INT NULL,
  sales_revenue_target DECIMAL(14,2) NULL,
  collection_target DECIMAL(14,2) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_employee_month_type (employee_id, target_month, target_type),
  INDEX idx_targets_employee (employee_id),
  INDEX idx_targets_month (target_month),
  CONSTRAINT fk_employee_targets_employee FOREIGN KEY (employee_id) REFERENCES crm_employee(id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_targets_assigned_by FOREIGN KEY (assigned_by) REFERENCES crm_employee(id) ON DELETE SET NULL
);
