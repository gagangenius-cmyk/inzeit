-- Consolidates the legacy crm_employee_attendance table (used by the retired /admin/attendance
-- page) into crm_hr_attendance_records (used by HR self-service clock-in/out and
-- /admin/hr/attendance-management), so dashboard and payroll calculations see a single source
-- of truth. Idempotent gap-fill only - never overwrites a row that already exists for a given
-- (employee_id, date), and the legacy table is left untouched as a historical archive.
-- MySQL 8 compatible. Plain statements only, see migrations/20260721_client_portal.sql for the
-- idempotency contract this relies on.

INSERT INTO crm_hr_attendance_records (attendance_id, employee_id, date, check_in, check_out, status, overtime_hours, source, notes)
SELECT
  UUID(),
  CAST(agg.emp_id AS CHAR),
  agg.attendance_date,
  TIME(agg.first_login),
  TIME(agg.last_logout),
  CASE WHEN agg.any_checkin = 1 THEN 'Present' ELSE 'Absent' END,
  COALESCE(agg.total_extra, 0),
  'Import',
  'Migrated from legacy attendance log (crm_employee_attendance)'
FROM (
  SELECT
    emp_id,
    DATE(login_time) AS attendance_date,
    MIN(login_time) AS first_login,
    MAX(logout_time) AS last_logout,
    MAX(checkin) AS any_checkin,
    SUM(COALESCE(extra_hours, 0)) AS total_extra
  FROM crm_employee_attendance
  WHERE login_time IS NOT NULL
  GROUP BY emp_id, DATE(login_time)
) agg
WHERE NOT EXISTS (
  SELECT 1 FROM crm_hr_attendance_records r
  WHERE r.employee_id = CAST(agg.emp_id AS CHAR) COLLATE utf8mb4_general_ci
    AND r.date = agg.attendance_date
);
