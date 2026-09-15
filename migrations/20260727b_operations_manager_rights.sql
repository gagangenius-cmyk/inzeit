-- Operations Manager rights: case status lifecycle (per opportunity, since a
-- lead can run multiple products/cases in parallel) and an audit trail for
-- CRM access freezes, layered on top of the existing crm_forum_leads.case_officer
-- (case transfer) and crm_employee.status (access control) fields.
ALTER TABLE crm_opportunities ADD COLUMN operations_status ENUM('Active', 'Closed', 'Refund', 'On Hold', 'Visa Approved') NOT NULL DEFAULT 'Active';
ALTER TABLE crm_opportunities ADD COLUMN operations_status_updated_by INT NULL;
ALTER TABLE crm_opportunities ADD COLUMN operations_status_updated_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS crm_employee_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  action ENUM('frozen', 'restored') NOT NULL,
  reason VARCHAR(255) NULL,
  actor_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dm_employee_access_log_employee (employee_id, created_at),
  CONSTRAINT fk_dm_employee_access_log_employee FOREIGN KEY (employee_id) REFERENCES crm_employee (id) ON DELETE CASCADE,
  CONSTRAINT fk_dm_employee_access_log_actor FOREIGN KEY (actor_id) REFERENCES crm_employee (id) ON DELETE CASCADE
);
