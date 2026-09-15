-- Chart of Accounts for the Accounts module (COA / Expense / P&L pages).
-- crm_expense stays the system of record for expense entries (used today by
-- the Finance module's read-only Expenses tab) - this only adds an optional
-- link from each expense to a COA line, instead of forking a parallel table.
CREATE TABLE IF NOT EXISTS crm_coa_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  group_name VARCHAR(50) NOT NULL,
  nature ENUM('DR','CR') NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Accounts explicitly named in the Finance Module technical spec, grouped by
-- its 9 code ranges. A few "Other/Miscellaneous" lines round out ranges the
-- spec only gave examples for; CEO/Accounts can add more via the COA page.
INSERT INTO crm_coa_accounts (code, name, group_name, nature) VALUES
  ('1004', 'POS (Network International)', 'Revenue', 'CR'),
  ('1005', 'TAP Payment', 'Revenue', 'CR'),
  ('1006', 'TABBY', 'Revenue', 'CR'),
  ('1007', 'Client Payment', 'Revenue', 'CR'),
  ('1008', 'Commission', 'Revenue', 'CR'),
  ('1009', 'Cash Sales', 'Revenue', 'CR'),
  ('2001', '3rd Party Fees (Travnook, MADAR Typing)', 'Cost of Sales', 'DR'),
  ('2002', 'Govt Visa Fees', 'Cost of Sales', 'DR'),
  ('2003', 'Assessment Fees', 'Cost of Sales', 'DR'),
  ('2004', 'WES', 'Cost of Sales', 'DR'),
  ('2005', 'Other Cost of Sales', 'Cost of Sales', 'DR'),
  ('3001', 'Salary', 'Personnel', 'DR'),
  ('3002', 'Pending Salary', 'Personnel', 'DR'),
  ('3003', 'Incentives', 'Personnel', 'DR'),
  ('3004', 'FnF / Full & Final Settlement', 'Personnel', 'DR'),
  ('3005', 'WPS Bank Charges', 'Personnel', 'DR'),
  ('3006', 'Annual Ticket', 'Personnel', 'DR'),
  ('3007', 'Other Personnel Costs', 'Personnel', 'DR'),
  ('4001', 'Rent', 'Occupancy', 'DR'),
  ('4002', 'DEWA', 'Occupancy', 'DR'),
  ('4003', 'TAQA', 'Occupancy', 'DR'),
  ('4004', 'Internet / STC', 'Occupancy', 'DR'),
  ('4005', 'Printer Rental', 'Occupancy', 'DR'),
  ('4006', 'DMCC Freezone Fees', 'Occupancy', 'DR'),
  ('5001', 'Office Supplies', 'Operating', 'DR'),
  ('5002', 'Pantry', 'Operating', 'DR'),
  ('5003', 'Marketing / CK', 'Operating', 'DR'),
  ('5004', 'Software (Nitro PDF etc.)', 'Operating', 'DR'),
  ('5005', 'Legal Fees', 'Operating', 'DR'),
  ('5006', 'Court Fees', 'Operating', 'DR'),
  ('5007', 'Miscellaneous Operating Expense', 'Operating', 'DR'),
  ('6001', 'Bank Service Charges', 'Banking', 'DR'),
  ('6002', 'CHARGESDTB (VAT on Bank Transfers)', 'Banking', 'DR'),
  ('6003', 'POS Rental', 'Banking', 'DR'),
  ('6004', 'Card Refill', 'Banking', 'DR'),
  ('6005', 'Other Banking Charges', 'Banking', 'DR'),
  ('7001', 'Intercompany Transfer (DXB/AUH)', 'Intercompany', 'DR'),
  ('7002', 'Petty Cash Fund Replenishment', 'Intercompany', 'DR'),
  ('7003', 'Cash Deposit', 'Intercompany', 'DR'),
  ('7004', 'Qatar Bank Transfer', 'Intercompany', 'DR'),
  ('8001', 'VAT Output', 'Tax Accounts', 'CR'),
  ('8002', 'VAT Input', 'Tax Accounts', 'DR'),
  ('8003', 'GST Output', 'Tax Accounts', 'CR'),
  ('8004', 'GST Input', 'Tax Accounts', 'DR'),
  ('8005', 'CT Provision (9%)', 'Tax Accounts', 'DR'),
  ('9001', 'Client Refunds Paid', 'Refunds', 'DR'),
  ('9002', 'Govt / Court Refunds Received', 'Refunds', 'CR'),
  ('9003', 'Salary Advance Recovery', 'Refunds', 'CR')
ON DUPLICATE KEY UPDATE code = code;

ALTER TABLE crm_expense ADD COLUMN coa_account_id INT NULL;
ALTER TABLE crm_expense ADD CONSTRAINT fk_expense_coa FOREIGN KEY (coa_account_id) REFERENCES crm_coa_accounts(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS monthly_report_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_month CHAR(7) NOT NULL,        -- 'YYYY-MM'
  recipient_id INT NOT NULL,
  recipient_role VARCHAR(30) NOT NULL,  -- 'ceo' | 'branch_manager' | 'counsellor'
  status ENUM('Sent','Skipped','Failed') NOT NULL,
  error_message TEXT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_monthly_report_log (period_month, recipient_id),
  INDEX idx_monthly_report_log_period (period_month)
);
