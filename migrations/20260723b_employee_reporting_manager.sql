-- Profile Overview (employee self-service) needs a "Reporting Manager" field,
-- which crm_employee has never had. Self-referencing FK to crm_employee.id.

SET @emp_schema := DATABASE();

SET @emp_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @emp_schema AND table_name = 'crm_employee' AND column_name = 'manager_id') = 0,
  'ALTER TABLE crm_employee ADD COLUMN manager_id INT NULL',
  'SELECT 1'
);
PREPARE emp_statement FROM @emp_sql; EXECUTE emp_statement; DEALLOCATE PREPARE emp_statement;

SET @emp_sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @emp_schema AND table_name = 'crm_employee' AND index_name = 'idx_dm_employee_manager') = 0,
  'ALTER TABLE crm_employee ADD INDEX idx_dm_employee_manager (manager_id)',
  'SELECT 1'
);
PREPARE emp_statement FROM @emp_sql; EXECUTE emp_statement; DEALLOCATE PREPARE emp_statement;
