-- Lets the assignee log an outcome (e.g. "not reachable", "client didn't
-- respond") whenever they update an assignment's status, without overwriting
-- the original task/call description already stored in crm_ops_assignments.notes.
-- Kept as a single running-log text column (entries appended with a
-- timestamp/status prefix in application code) rather than a separate table,
-- matching this feature's existing "no full audit-log table" scope.
ALTER TABLE crm_ops_assignments ADD COLUMN outcome_remark TEXT NULL AFTER notes;
