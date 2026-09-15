-- Immigration Tools (sales module) results log: every calculation run from
-- /admin/immigration-tools that a counsellor chooses to save, optionally
-- attached to a lead so it becomes part of that lead's file history.
CREATE TABLE IF NOT EXISTS crm_immigration_tool_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NULL,
  employee_id INT NOT NULL,
  country ENUM('canada', 'australia') NOT NULL,
  tool VARCHAR(40) NOT NULL,
  headline_score VARCHAR(60) NULL,
  input JSON NOT NULL,
  result JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dm_immigration_tool_results_lead (lead_id, created_at),
  INDEX idx_dm_immigration_tool_results_employee (employee_id, created_at),
  CONSTRAINT fk_dm_immigration_tool_results_lead FOREIGN KEY (lead_id) REFERENCES crm_forum_leads (id) ON DELETE CASCADE,
  CONSTRAINT fk_dm_immigration_tool_results_employee FOREIGN KEY (employee_id) REFERENCES crm_employee (id) ON DELETE CASCADE
);
