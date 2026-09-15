import crypto from 'crypto';

// AES-256-GCM at-rest encryption, keyed from DATA_ENCRYPTION_KEY /
// ENCRYPTION_KEY - both already referenced by uae-compliance-service.ts as a
// "is encryption configured" checkbox but never actually used to encrypt
// anything until now (MFA secrets are the first real consumer). Falls back
// to deriving a key from JWT_SECRET so MFA still works in environments that
// never set a dedicated encryption key, matching this app's existing
// tolerance for missing optional env vars (Pusher, Resend) rather than
// hard-failing at startup.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended nonce size for GCM

function getKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'navigator-next-fallback-key';
  // Accept a raw key of any length (including a human-typed passphrase) by
  // hashing it down to exactly 32 bytes for AES-256.
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv:authTag:ciphertext, each base64 - self-contained so the key can
  // rotate without needing to track versions per-row for this feature.
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, authTagB64, dataB64] = payload.split(':');
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}
