import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { sequelize } from './sequelize';
import { encryptSecret, decryptSecret } from './encryption';
import { generateTotpSecret, verifyTotpCode, buildOtpAuthUrl } from './totp';

// TOTP-based MFA for staff login - part of the "fix it" enterprise-hardening
// pass alongside FK constraints, error tracking, fuzzy dup detection, email
// delivery tracking and the data-access audit log. Opt-in per employee: an
// employee who never enrolls sees zero change to their login flow (see
// src/app/api/auth/login/route.ts), so rolling this out can't lock anyone out.
//
// The TOTP secret is encrypted at rest (src/lib/encryption.ts, AES-256-GCM)
// because verifying a code requires recovering the plaintext secret. Backup
// codes are hashed with bcrypt instead, the same as passwords, because they
// only ever need a one-way comparison.

let tableReady: Promise<void> | null = null;

const ensureMfaTable = async () => {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_employee_mfa (
        employee_id INT PRIMARY KEY,
        secret_encrypted TEXT NOT NULL,
        enabled TINYINT NOT NULL DEFAULT 0,
        backup_codes_hashed TEXT NULL,
        confirmed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_employee_mfa_employee FOREIGN KEY (employee_id) REFERENCES crm_employee(id) ON DELETE CASCADE
      )
    `).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
};

export interface MfaStatus {
  enabled: boolean;
  pendingEnrollment: boolean;
}

export async function getMfaStatus(employeeId: number): Promise<MfaStatus> {
  await ensureMfaTable();
  const [row] = await sequelize.query<{ enabled: number; confirmed_at: string | null }>(
    `SELECT enabled, confirmed_at FROM crm_employee_mfa WHERE employee_id = :employeeId`,
    { replacements: { employeeId }, type: QueryTypes.SELECT }
  );
  return {
    enabled: Boolean(row?.enabled),
    pendingEnrollment: Boolean(row && !row.enabled && !row.confirmed_at),
  };
}

export async function isMfaEnabled(employeeId: number): Promise<boolean> {
  const status = await getMfaStatus(employeeId);
  return status.enabled;
}

export async function startEnrollment(employeeId: number, accountName: string): Promise<{ secret: string; otpauthUrl: string }> {
  await ensureMfaTable();
  const secret = generateTotpSecret();
  await sequelize.query(
    `INSERT INTO crm_employee_mfa (employee_id, secret_encrypted, enabled, confirmed_at)
     VALUES (:employeeId, :secretEncrypted, 0, NULL) AS new_row
     ON DUPLICATE KEY UPDATE
       secret_encrypted = new_row.secret_encrypted,
       enabled = 0,
       confirmed_at = NULL,
       backup_codes_hashed = NULL`,
    { replacements: { employeeId, secretEncrypted: encryptSecret(secret) } }
  );
  return {
    secret,
    otpauthUrl: buildOtpAuthUrl({ secret, accountName, issuer: 'Global Navigator LLC FZ' }),
  };
}

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

// Second (and final) step of enrollment: the employee must prove they can
// generate a valid code from the secret they just scanned before MFA is
// actually turned on - otherwise a typo'd QR scan would permanently lock the
// employee out on their very next login.
export async function confirmEnrollment(employeeId: number, code: string): Promise<{ backupCodes: string[] } | null> {
  await ensureMfaTable();
  const [row] = await sequelize.query<{ secret_encrypted: string }>(
    `SELECT secret_encrypted FROM crm_employee_mfa WHERE employee_id = :employeeId`,
    { replacements: { employeeId }, type: QueryTypes.SELECT }
  );
  if (!row) return null;

  const secret = decryptSecret(row.secret_encrypted);
  if (!verifyTotpCode(secret, code)) return null;

  const backupCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(backupCodes.map((plain) => bcrypt.hash(plain, 10)));
  await sequelize.query(
    `UPDATE crm_employee_mfa
     SET enabled = 1, confirmed_at = NOW(), backup_codes_hashed = :codes
     WHERE employee_id = :employeeId`,
    { replacements: { employeeId, codes: JSON.stringify(hashedCodes) } }
  );
  return { backupCodes };
}

// Login-time check: a live TOTP code, or (lost-phone recovery) one of the
// one-time backup codes issued at enrollment, consumed on use.
export async function verifyLoginCode(employeeId: number, code: string): Promise<boolean> {
  await ensureMfaTable();
  const [row] = await sequelize.query<{ secret_encrypted: string; enabled: number; backup_codes_hashed: string | null }>(
    `SELECT secret_encrypted, enabled, backup_codes_hashed FROM crm_employee_mfa WHERE employee_id = :employeeId`,
    { replacements: { employeeId }, type: QueryTypes.SELECT }
  );
  if (!row || !row.enabled) return false;

  const secret = decryptSecret(row.secret_encrypted);
  if (verifyTotpCode(secret, code)) return true;

  const trimmed = String(code || '').trim().toUpperCase();
  if (!trimmed || !row.backup_codes_hashed) return false;

  let hashes: string[];
  try {
    hashes = JSON.parse(row.backup_codes_hashed);
  } catch {
    return false;
  }

  for (let i = 0; i < hashes.length; i += 1) {
    if (await bcrypt.compare(trimmed, hashes[i])) {
      hashes.splice(i, 1);
      await sequelize.query(
        `UPDATE crm_employee_mfa SET backup_codes_hashed = :codes WHERE employee_id = :employeeId`,
        { replacements: { employeeId, codes: JSON.stringify(hashes) } }
      );
      return true;
    }
  }
  return false;
}

export async function disableMfa(employeeId: number): Promise<void> {
  await ensureMfaTable();
  await sequelize.query(`DELETE FROM crm_employee_mfa WHERE employee_id = :employeeId`, { replacements: { employeeId } });
}
