-- Automatic activity log for major lead actions (assignment/reassignment,
-- status changes, manual remarks, appointments booked, follow-ups added),
-- so every "who did what and when" event on a lead is recorded in one place
-- instead of only living as a side-effect on individual tables.
CREATE TABLE IF NOT EXISTS crm_remarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  remark TEXT NOT NULL,
  previous_value VARCHAR(255) NULL,
  new_value VARCHAR(255) NULL,
  actor_id INT NULL,
  actor_role VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dm_remarks_lead (lead_id, created_at),
  CONSTRAINT fk_dm_remarks_lead FOREIGN KEY (lead_id) REFERENCES crm_forum_leads (id) ON DELETE CASCADE,
  CONSTRAINT fk_dm_remarks_actor FOREIGN KEY (actor_id) REFERENCES crm_employee (id) ON DELETE SET NULL
);
