import { sequelize } from './sequelize';

// crm_employee_attendance is the legacy/lead-routing attendance signal -
// distinct from the current official system (crm_hr_attendance_records,
// see src/services/hr-service.ts), which src/app/admin/attendance/page.tsx's
// own redirect comment confirms is what HR actually uses now. This table is
// kept alive only because three other things still read/write it: the
// "is this employee checked in today" round-robin eligibility check
// (src/lib/leadAutoAssignment.ts, src/lib/assignmentRuleEngine.ts) and the
// lead-assignment-availability presence toggle
// (src/app/api/admin/attendance/presence/route.ts) built earlier this
// session, plus the retired admin CRUD at src/app/api/admin/attendance
// kept as a historical archive viewer.
//
// Previously THREE different files each had their own
// `CREATE TABLE IF NOT EXISTS crm_employee_attendance` with three different
// column sets (16 columns / 16 + an index / just 6) - since
// `IF NOT EXISTS` is a no-op once any of them has run, whichever one
// happened to execute first on a given database permanently decided the
// table's real shape for every other consumer, and a 4th consumer
// (assignmentRuleEngine.ts's loadRuleCandidates) called none of them at
// all and depended entirely on one of the other three having already run.
// Consolidated into this one shared definition - the full legacy schema,
// matching what the real production table already has - so every consumer
// provisions (or assumes) the exact same shape.
let tableReady: Promise<void> | null = null;

export const ensureEmployeeAttendanceTable = async (): Promise<void> => {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_employee_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id INT NOT NULL,
        ip_address VARCHAR(255) NULL,
        device VARCHAR(255) NULL,
        agent TEXT NULL,
        login_time DATETIME NULL,
        logout_time DATETIME NULL,
        total_hours FLOAT NULL,
        short_fall FLOAT NULL,
        remarks TEXT NULL,
        watch_by INT NULL,
        created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by INT NOT NULL DEFAULT 1,
        checkin INT NOT NULL DEFAULT 0,
        checkout INT NOT NULL DEFAULT 0,
        logout_ip_address VARCHAR(255) NULL,
        extra_hours FLOAT NULL,
        INDEX idx_employee_attendance_presence (emp_id, created, checkin, checkout)
      )
    `).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
};

// The round-robin lead-assignment engine's "is this employee available
// right now" eligibility check - previously only looked at
// crm_employee_attendance, the legacy table nothing but an admin's manual
// presence-panel toggle (src/app/api/admin/attendance/presence) ever
// writes to. An employee could genuinely clock in for the day via the real
// self-service system (crm_hr_attendance_records, what
// /admin/my-attendance actually writes to - see src/services/hr-service.ts
// clockIn/clockOut) and still never become eligible for lead routing unless
// someone separately toggled them on here too. Reconnected as an OR of both
// signals: either counts as "checked in today" - a real self-service
// clock-in, or an admin's manual override (still useful on its own, e.g.
// an employee who forgot to clock in but a manager knows is present).
// Assumes the enclosing query aliases the employee row as `e`.
export const CHECKED_IN_TODAY_SQL = `(
  EXISTS (
    SELECT 1 FROM crm_employee_attendance attendance
    WHERE attendance.emp_id = e.id
      AND DATE(attendance.created) = CURDATE()
      AND COALESCE(attendance.checkin, 0) = 1
      AND COALESCE(attendance.checkout, 0) = 0
  )
  OR EXISTS (
    SELECT 1 FROM crm_hr_attendance_records hr
    WHERE CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = hr.employee_id
      AND hr.date = CURDATE()
      AND hr.check_in IS NOT NULL
      AND hr.check_out IS NULL
  )
)`;
