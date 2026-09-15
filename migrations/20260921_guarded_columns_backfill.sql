-- Backfill columns that are guarded/lazily created by routes/services so fresh
-- and existing databases match the code paths without waiting for a route hit.

SET @schema_name := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'appointments' AND column_name = 'remarks') = 0,
  'ALTER TABLE appointments ADD COLUMN remarks TEXT NULL AFTER foe_remark',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'crm_client_documents' AND column_name = 'mandatory') = 0,
  'ALTER TABLE crm_client_documents ADD COLUMN mandatory TINYINT(1) NOT NULL DEFAULT 1 AFTER document_label',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'crm_client_documents' AND column_name = 'accepted_formats') = 0,
  'ALTER TABLE crm_client_documents ADD COLUMN accepted_formats VARCHAR(255) NULL AFTER mandatory',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'crm_client_credentials' AND column_name = 'temporary_password') = 0,
  'ALTER TABLE crm_client_credentials ADD COLUMN temporary_password VARCHAR(255) NULL AFTER password_hash',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'crm_follow_up_reminders' AND column_name = 'completion_notes') = 0,
  'ALTER TABLE crm_follow_up_reminders ADD COLUMN completion_notes TEXT NULL AFTER completed_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
