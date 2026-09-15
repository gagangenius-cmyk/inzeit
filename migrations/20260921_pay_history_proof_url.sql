-- Store proof-of-payment URL on the legacy payment ledger used by finance,
-- recovery, analytics, and receipt reprint flows.
SET @payhist_schema := DATABASE();

SET @add_proof_url_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @payhist_schema AND table_name = 'crm_pay_history' AND column_name = 'proof_url') = 0,
  'ALTER TABLE crm_pay_history ADD COLUMN proof_url VARCHAR(500) NULL AFTER refNumber',
  'SELECT 1'
);

PREPARE add_proof_url_stmt FROM @add_proof_url_sql;
EXECUTE add_proof_url_stmt;
DEALLOCATE PREPARE add_proof_url_stmt;
