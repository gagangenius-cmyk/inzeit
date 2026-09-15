-- crm_hr_attendance_records.createAttendanceRecord() (src/services/hr-service.ts)
-- only ever guarded against a duplicate same-day attendance record for an
-- employee with a SELECT-then-INSERT check in application code - the index
-- on (employee_id, date) was a plain, non-unique INDEX, so nothing at the
-- schema level stopped two near-simultaneous submissions (e.g. a double
-- click, or a biometric import racing a manual entry) from creating two
-- conflicting rows for the same person on the same day. Converted to a real
-- UNIQUE index; application code now also catches the resulting duplicate-key
-- error as a fallback for the race window between the pre-check and the
-- INSERT.
--
-- Verified zero existing duplicate (employee_id, date) pairs before applying
-- (table was empty in this environment) - safe to run directly elsewhere
-- only after the same check, since MySQL refuses to add a UNIQUE index over
-- pre-existing duplicate data.
ALTER TABLE crm_hr_attendance_records DROP INDEX idx_hr_attendance_employee_date;
ALTER TABLE crm_hr_attendance_records ADD UNIQUE INDEX idx_hr_attendance_employee_date (employee_id, date);
