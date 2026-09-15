-- Enterprise-style Lead Assignment Rules (Zoho/Salesforce concept) - an
-- ordered list of condition -> owner rules the round-robin engine
-- (src/lib/assignmentRuleEngine.ts) evaluates before falling back to the
-- plain per-branch round robin in crm_lead_round_robin_state. See
-- docs/LEAD_ASSIGNMENT_ROUND_ROBIN.md for the full design.
CREATE TABLE IF NOT EXISTS crm_assignment_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  branch_ids VARCHAR(255) NULL,
  source_ids VARCHAR(255) NULL,
  priorities VARCHAR(150) NULL,
  lead_qualities VARCHAR(255) NULL,
  country_interest_ids VARCHAR(255) NULL,
  service_interest_ids VARCHAR(255) NULL,
  assignment_mode VARCHAR(20) NOT NULL DEFAULT 'round_robin',
  employee_ids VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  INDEX idx_assignment_rules_active_order (is_active, sort_order),
  CONSTRAINT fk_assignment_rules_created_by FOREIGN KEY (created_by) REFERENCES crm_employee(id) ON DELETE SET NULL,
  CONSTRAINT fk_assignment_rules_updated_by FOREIGN KEY (updated_by) REFERENCES crm_employee(id) ON DELETE SET NULL
);

-- One row per rule, tracking that rule's own round-robin cursor
-- independently of every other rule's and of the branch-level cursor.
CREATE TABLE IF NOT EXISTS crm_assignment_rule_state (
  rule_id INT NOT NULL PRIMARY KEY,
  last_employee_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_rule_state_rule FOREIGN KEY (rule_id) REFERENCES crm_assignment_rules(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_rule_state_employee FOREIGN KEY (last_employee_id) REFERENCES crm_employee(id) ON DELETE SET NULL
);
