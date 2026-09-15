-- Persists the last counselor selected for each branch so website leads rotate reliably.
CREATE TABLE IF NOT EXISTS crm_lead_round_robin_state (
  branch_id INT NOT NULL PRIMARY KEY,
  last_employee_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lead_round_robin_last_employee (last_employee_id)
);
