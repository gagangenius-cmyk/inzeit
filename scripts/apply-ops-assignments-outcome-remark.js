const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm');
  const db = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1),
  });

  const [existing] = await db.query(`
    SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crm_ops_assignments' AND COLUMN_NAME = 'outcome_remark'
  `);
  if (Number(existing[0]?.cnt || 0) === 0) {
    await db.query(`ALTER TABLE crm_ops_assignments ADD COLUMN outcome_remark TEXT NULL AFTER notes`);
    console.log('Added crm_ops_assignments.outcome_remark');
  } else {
    console.log('crm_ops_assignments.outcome_remark already exists, skipping.');
  }

  await db.end();
}

run().catch((error) => { console.error(error); process.exit(1); });
