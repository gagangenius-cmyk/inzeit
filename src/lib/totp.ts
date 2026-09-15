import crypto from 'crypto';

// RFC 6238 TOTP (the standard behind Google Authenticator/Authy/1Password/
// etc.) hand-rolled against Node's built-in `crypto` - no otplib/speakeasy
// dependency needed, the algorithm is ~30 lines once base32 is handled.
// Matches this codebase's established preference for a small first-party
// wrapper over a new dependency (see src/lib/mailer.ts, pusherServer.ts).

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

const DIGITS = 6;
const PERIOD_SECONDS = 30;

// HOTP per RFC 4226: HMAC-SHA1 over an 8-byte big-endian counter, then
// "dynamic truncation" pulls 4 bytes out at an offset taken from the last
// nibble of the HMAC itself.
function hotp(secretBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

function totpCounter(timestampMs: number): number {
  return Math.floor(timestampMs / 1000 / PERIOD_SECONDS);
}

export function generateTotpCode(secretBase32: string, timestampMs: number = Date.now()): string {
  return hotp(base32Decode(secretBase32), totpCounter(timestampMs));
}

// Accepts a code from the current 30s window or one step either side, to
// tolerate normal clock drift between the server and the user's phone -
// exactly what every real TOTP verifier does (a code is otherwise unusable
// the instant it's typed if the two clocks disagree by even a few seconds).
export function verifyTotpCode(secretBase32: string, code: string, windowSteps = 1): boolean {
  const trimmed = String(code || '').trim();
  if (!/^\d{6}$/.test(trimmed)) return false;

  const secretBuffer = base32Decode(secretBase32);
  const currentCounter = totpCounter(Date.now());
  for (let delta = -windowSteps; delta <= windowSteps; delta += 1) {
    if (hotp(secretBuffer, currentCounter + delta) === trimmed) return true;
  }
  return false;
}

export function buildOtpAuthUrl({ secret, accountName, issuer }: { secret: string; accountName: string; issuer: string }): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
