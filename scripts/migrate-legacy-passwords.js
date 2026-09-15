// One-time migration: upgrades any crm_employee.password still stored as
// plaintext to bcrypt, in place, with no user-visible change (same password,
// stronger hash). This is a required pre-flight before src/lib/auth.ts can
// safely drop its legacy plaintext/MD5 fallback (see PLAN.md Security A2) —
// removing that fallback before this has run would lock out any account
// still on an old hash.
//
// MD5-shaped values (32 hex chars) are NOT migrated — MD5 is one-way, so
// re-hashing the digest itself would never match the real password on a
// future login. Those accounts are reported separately and need a manual
// password reset instead.
//
// Usage:
//   node scripts/migrate-legacy-passwords.js            (dry run — report only)
//   node scripts/migrate-legacy-passwords.js --apply     (write the migration)

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm';
const parsedUrl = new URL(databaseUrl);
const database = parsedUrl.pathname.replace(/^\//, '');

const baseConfig = {
  host: parsedUrl.hostname || 'localhost',
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username || 'root'),
  password: decodeURIComponent(parsedUrl.password || ''),
  multipleStatements: false,
};

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const MD5_SHAPED_RE = /^[0-9a-f]{32}$/i;

async function migrateLegacyPasswords({ apply = false } = {}) {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const [rows] = await connection.query(
    "SELECT id, username, password FROM crm_employee WHERE password IS NOT NULL AND password <> ''"
  );

  const alreadyBcrypt = rows.filter((r) => BCRYPT_RE.test(r.password));
  const md5Shaped = rows.filter((r) => !BCRYPT_RE.test(r.password) && MD5_SHAPED_RE.test(r.password));
  const plaintext = rows.filter((r) => !BCRYPT_RE.test(r.password) && !MD5_SHAPED_RE.test(r.password));

  console.log(`Scanned ${rows.length} crm_employee rows with a password set.`);
  console.log(`  already bcrypt:         ${alreadyBcrypt.length}`);
  console.log(`  plaintext (migratable): ${plaintext.length}`);
  console.log(`  MD5-shaped (cannot be safely converted): ${md5Shaped.length}`);
  if (md5Shaped.length) {
    console.log(`  MD5-shaped account ids needing a manual password reset: ${md5Shaped.map((r) => r.id).join(', ')}`);
  }

  if (!apply) {
    console.log('Dry run only — no changes written. Re-run with --apply to migrate the plaintext rows.');
    await connection.end();
    return { scanned: rows.length, plaintext: plaintext.length, md5Shaped: md5Shaped.length, migrated: 0 };
  }

  let migrated = 0;
  for (const row of plaintext) {
    const hash = await bcrypt.hash(row.password, 12);
    await connection.query('UPDATE crm_employee SET password = ? WHERE id = ?', [hash, row.id]);
    migrated++;
  }
  console.log(`Migrated ${migrated} plaintext account(s) to bcrypt in place.`);
  if (md5Shaped.length) {
    console.log(`WARNING: ${md5Shaped.length} MD5-shaped account(s) were left untouched — reset their passwords manually before removing the MD5 fallback, or those accounts will be locked out.`);
  }
  await connection.end();
  return { scanned: rows.length, plaintext: plaintext.length, md5Shaped: md5Shaped.length, migrated };
}

if (require.main === module) {
  migrateLegacyPasswords({ apply: process.argv.includes('--apply') }).catch((error) => {
    console.error('Password migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateLegacyPasswords, BCRYPT_RE, MD5_SHAPED_RE };
