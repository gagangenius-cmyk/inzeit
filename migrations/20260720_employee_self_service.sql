-- Employee self-service module: attendance breaks, Emergency Leave type,
-- and a resignation workflow tracker (Submitted -> Under Review -> Acknowledged -> Exit Process).
-- MySQL 8 compatible. Safe to run more than once - the migration runner
-- (scripts/setup-database.js) tolerates ER_DUP_FIELDNAME on repeat ADD COLUMN
-- statements, and it cannot execute DELIMITER/stored-procedure syntax at all,
-- so this file deliberately avoids that pattern.

CREATE TABLE IF NOT EXISTS crm_hr_attendance_breaks (
  break_id CHAR(36) PRIMARY KEY,
  attendance_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  break_type ENUM('Lunch Break', 'Prayer Break', 'Short Break') NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  duration_minutes INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hr_attendance_breaks_attendance (attendance_id),
  INDEX idx_hr_attendance_breaks_employee (employee_id)
);

-- Re-running an identical ENUM redefinition is a no-op, so this is safe on repeat runs.
ALTER TABLE crm_hr_leave_requests MODIFY COLUMN leave_type ENUM(
  'Annual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave', 'Hajj Leave',
  'Bereavement Leave', 'Unpaid Leave', 'Compensatory Leave', 'Emergency Leave'
) NOT NULL;

ALTER TABLE crm_hr_exit_requests MODIFY COLUMN status ENUM(
  'Pending', 'Approved', 'Rejected', 'Completed', 'Withdrawn'
) NOT NULL DEFAULT 'Pending';

ALTER TABLE crm_hr_exit_requests ADD COLUMN notice_period_days INT NULL DEFAULT 30 AFTER requested_lwd;
ALTER TABLE crm_hr_exit_requests ADD COLUMN reason_category VARCHAR(120) NULL AFTER reason;
ALTER TABLE crm_hr_exit_requests ADD COLUMN additional_comments TEXT NULL AFTER notes;
ALTER TABLE crm_hr_exit_requests ADD COLUMN branch_snapshot VARCHAR(255) NULL AFTER additional_comments;
ALTER TABLE crm_hr_exit_requests ADD COLUMN workflow_stage ENUM('Submitted','Under Review','Acknowledged','Exit Process') NOT NULL DEFAULT 'Submitted' AFTER status;
