-- Persisted per-employee compensation record so the Payslip Generator stops requiring a full
-- re-entry of salary/allowances every run, plus a currency_code on payslips so multi-country
-- payroll no longer defaults to a hardcoded currency. MySQL 8 compatible. Plain CREATE/ALTER
-- only - see migrations/20260721_client_portal.sql for the idempotency contract this relies on.

CREATE TABLE IF NOT EXISTS crm_hr_employee_compensation (
  employee_id CHAR(36) PRIMARY KEY,
  basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'AED',
  standard_allowances_json TEXT NULL,
  bank_name VARCHAR(255) NULL,
  iban VARCHAR(80) NULL,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE crm_hr_payslips ADD COLUMN currency_code VARCHAR(10) NOT NULL DEFAULT 'AED' AFTER net_salary;
