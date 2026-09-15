-- Unified Call/Task/Appointment assignment tool for the Operations module,
-- opened up to Branch Manager (see roleAccess.ts operations.assign_activities)
-- in addition to the operations.view/operations.manage tier. Kept as its own
-- table rather than overloading crm_task/dm_appointments/crm_call_requests,
-- since those three have mismatched, purpose-specific schemas (crm_call_requests
-- requires a branch_id and is lead-centric; dm_appointments has no assignee
-- column at all - it's a personal reminder list for the creator only).
CREATE TABLE IF NOT EXISTS crm_ops_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('call', 'task', 'appointment') NOT NULL,
  title VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  lead_id INT NULL,
  opportunity_id INT NULL,
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  due_at DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dm_ops_assignments_assigned_to (assigned_to, status),
  INDEX idx_dm_ops_assignments_assigned_by (assigned_by),
  INDEX idx_dm_ops_assignments_type (type),
  INDEX idx_dm_ops_assignments_lead (lead_id),
  CONSTRAINT fk_dm_ops_assignments_assigned_to FOREIGN KEY (assigned_to) REFERENCES crm_employee (id) ON DELETE CASCADE,
  CONSTRAINT fk_dm_ops_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES crm_employee (id) ON DELETE CASCADE
);
