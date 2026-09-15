const mysql = require('mysql2/promise');
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

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

// One-off backfill for the "Duplicate Leads" tab: mirrors the phone/email
// matching rule in src/lib/duplicateLeadCheck.ts, applied retroactively so
// existing repeat-enquiry leads show up alongside newly created ones.
async function backfillDuplicateLeads(connection) {
  const [rows] = await connection.query(
    'SELECT id, phone, email, COALESCE(created, regdate) AS createdAt FROM crm_forum_leads ORDER BY COALESCE(created, regdate) ASC, id ASC'
  );

  const seenPhones = new Map();
  const seenEmails = new Map();
  let updated = 0;

  for (const row of rows) {
    const normalizedPhone = normalizePhone(row.phone);
    const normalizedEmail = String(row.email || '').trim().toLowerCase();

    const priorPhoneCount = normalizedPhone ? (seenPhones.get(normalizedPhone) || 0) : 0;
    const priorEmailCount = normalizedEmail ? (seenEmails.get(normalizedEmail) || 0) : 0;
    const duplicateCount = priorPhoneCount + priorEmailCount;

    if (normalizedPhone) seenPhones.set(normalizedPhone, priorPhoneCount + 1);
    if (normalizedEmail) seenEmails.set(normalizedEmail, priorEmailCount + 1);

    if (duplicateCount > 0) {
      await connection.query('UPDATE crm_forum_leads SET duplicate = 1, duplicate_count = ? WHERE id = ?', [duplicateCount, row.id]);
      updated++;
    }
  }

  return { updated, scanned: rows.length };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await backfillDuplicateLeads(connection);
  await connection.end();
  console.log(`Scanned ${result.scanned} leads, flagged ${result.updated} as duplicates.`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Duplicate backfill failed:', error);
    process.exit(1);
  });
}

module.exports = { backfillDuplicateLeads };
