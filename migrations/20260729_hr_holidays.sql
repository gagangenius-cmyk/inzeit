-- Company holiday calendar, scoped per branch/region (NULL branch_id = applies company-wide),
-- consumed by leave-day calculation so holidays inside a leave range don't count against the
-- employee. MySQL 8 compatible. Plain CREATE only - see migrations/20260721_client_portal.sql
-- for the idempotency contract this relies on.

CREATE TABLE IF NOT EXISTS crm_hr_holidays (
  holiday_id CHAR(36) PRIMARY KEY,
  holiday_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  branch_id INT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_hr_holiday (holiday_date, branch_id),
  INDEX idx_hr_holidays_date (holiday_date),
  INDEX idx_hr_holidays_branch (branch_id)
);
