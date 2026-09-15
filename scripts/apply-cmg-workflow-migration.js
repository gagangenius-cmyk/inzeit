const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm');
  const db = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1)
  });
  const statements = fs.readFileSync('migrations/20260623_opportunity_handover_accounting_portal.sql', 'utf8')
    .replace(/--[^\r\n]*/g, '').split(';').map((sql) => sql.trim()).filter(Boolean);
  for (const sql of statements) await db.query(sql);
  const [rows] = await db.query("SHOW TABLES LIKE 'crm_opportunity_workflow_reviews'");
  await db.end();
  if (!rows.length) throw new Error('CMG workflow table was not created.');
  console.log('CMG workflow migration applied.');
}

run().catch((error) => { console.error(error); process.exit(1); });
