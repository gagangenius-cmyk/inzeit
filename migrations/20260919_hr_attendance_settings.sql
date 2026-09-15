-- Configurable weekly-off days for leave-duration math
-- (src/services/hr-service.ts calculateWorkingDays), previously hardcoded
-- to "no weekend exclusion at all" - every calendar day in a leave request
-- counted against the employee's balance, including days they would never
-- have worked anyway.
--
-- weekly_off_days is a CSV of JS Date.getDay() values (0=Sunday ...
-- 6=Saturday). branch_id=0 is the global/company-wide default row; a real
-- branch_id can override it for that branch specifically (self-provisioning
-- code defaults to Sunday-only ('0') when no row exists at all yet, so this
-- table can start empty on a fresh install).
CREATE TABLE IF NOT EXISTS crm_hr_attendance_settings (
  branch_id INT NOT NULL DEFAULT 0,
  weekly_off_days VARCHAR(20) NOT NULL DEFAULT '0',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36) NULL,
  PRIMARY KEY (branch_id)
);

-- Seeds the explicit global default (Sunday-only) so the setting is visible
-- to anyone browsing the table directly, rather than relying purely on
-- application-code fallback logic for a row that doesn't exist yet.
INSERT INTO crm_hr_attendance_settings (branch_id, weekly_off_days)
VALUES (0, '0')
AS new_row
ON DUPLICATE KEY UPDATE weekly_off_days = crm_hr_attendance_settings.weekly_off_days;
