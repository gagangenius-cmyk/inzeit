-- Admin fee checkbox at receipt generation (Payment stage of the Opportunity
-- Flow wizard): a fixed government/registration fee the counselor can opt to
-- add as a separate line on the printed receipt (120 AED for Dubai/Abu
-- Dhabi/Qatar, 10 KWD for Kuwait, none for India — see getAdminFeeAmount in
-- src/lib/receiptTemplate.ts). Stored on the legacy crm_pay_history ledger
-- (not crm_opportunity_payments) so it's readable back the same way remark
-- already is — see the counselor_receipt join in
-- src/app/api/opportunity-payments/route.ts.

SET @payhist_schema := DATABASE();

SET @payhist_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @payhist_schema AND table_name = 'crm_pay_history' AND column_name = 'admin_fee_included') = 0,
  'ALTER TABLE crm_pay_history ADD COLUMN admin_fee_included TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE payhist_statement FROM @payhist_sql; EXECUTE payhist_statement; DEALLOCATE PREPARE payhist_statement;

SET @payhist_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @payhist_schema AND table_name = 'crm_pay_history' AND column_name = 'admin_fee_amount') = 0,
  'ALTER TABLE crm_pay_history ADD COLUMN admin_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00',
  'SELECT 1'
);
PREPARE payhist_statement FROM @payhist_sql; EXECUTE payhist_statement; DEALLOCATE PREPARE payhist_statement;
