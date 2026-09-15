-- HR can now set a login username/password when creating or editing an employee,
-- and can reset a forgotten password. Either action should force the employee to
-- pick their own password on next login rather than keep using the one HR set/emailed.
-- (Already created at runtime by HRService.ensureWorkforceDashboardTables() via
-- addColumnIfMissing(), which is why this uses the same conditional-add pattern as
-- the rest of this migrations folder - safe to run whether or not that already ran.)

SET @emp_schema := DATABASE();

SET @emp_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @emp_schema AND table_name = 'crm_employee' AND column_name = 'must_change_password') = 0,
  'ALTER TABLE crm_employee ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE emp_statement FROM @emp_sql; EXECUTE emp_statement; DEALLOCATE PREPARE emp_statement;
