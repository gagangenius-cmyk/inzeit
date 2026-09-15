-- TOTP-based MFA for staff login (src/lib/mfa.ts, src/lib/totp.ts,
-- src/lib/encryption.ts). Self-provisioned lazily by src/lib/mfa.ts's
-- ensureMfaTable() the same as every other table this session added
-- (crm_assignment_rules, crm_employee_targets, data_access_audit_log,
-- crm_email_delivery_log) — this file exists for documentation and
-- fresh-install parity, matching this project's established pattern of
-- idempotent CREATE TABLE IF NOT EXISTS run from application code, paired
-- with a versioned .sql file that isn't itself part of any migration runner.
--
-- One row per enrolled employee (a real FK is possible here, unlike the
-- HR module's UUID-keyed tables — employee_id is a plain INTEGER matching
-- crm_employee.id). ON DELETE CASCADE because an MFA enrollment is purely
-- personal, dependent data with no reason to survive its employee, the same
-- reasoning already applied to crm_notifications.user_id in
-- 20260914_core_fk_constraints.sql.
--
-- secret_encrypted is AES-256-GCM ciphertext (DATA_ENCRYPTION_KEY /
-- ENCRYPTION_KEY, falling back to a JWT_SECRET-derived key) because
-- verifying a live code requires recovering the plaintext secret.
-- backup_codes_hashed is a JSON array of bcrypt hashes instead — one-time
-- recovery codes only ever need a one-way comparison, exactly like a
-- password, so they're hashed rather than encrypted and consumed on use.

CREATE TABLE IF NOT EXISTS crm_employee_mfa (
  employee_id INT PRIMARY KEY,
  secret_encrypted TEXT NOT NULL,
  enabled TINYINT NOT NULL DEFAULT 0,
  backup_codes_hashed TEXT NULL,
  confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employee_mfa_employee FOREIGN KEY (employee_id) REFERENCES crm_employee(id) ON DELETE CASCADE
);
