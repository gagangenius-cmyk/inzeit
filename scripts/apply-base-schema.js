const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// One-time bootstrap for a brand-new DATABASE_URL target: applies the base
// 155-table schema dump (database-schema.sql) that the README documents as
// step 1, before `npm run db:setup` (scripts/setup-database.js) applies
// migrations/*.sql and seeds. Safe to re-run: existing tables are skipped.
async function run() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm');
  const database = url.pathname.replace(/^\//, '');
  const baseConfig = {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
  };

  const server = await mysql.createConnection(baseConfig);
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await server.end();

  const db = await mysql.createConnection({ ...baseConfig, database });

  // The dump carries legacy '0000-00-00 00:00:00' datetime defaults from the
  // old MySQL 5.x source. MySQL 8's default sql_mode (NO_ZERO_DATE, part of
  // STRICT_TRANS_TABLES) rejects those as CREATE TABLE defaults. Relax it for
  // this session only so the historical schema still loads verbatim.
  await db.query("SET SESSION sql_mode = ''");

  const schemaPath = path.join(__dirname, '..', 'database-schema.sql');
  const statements = fs.readFileSync(schemaPath, 'utf8')
    .replace(/--[^\r\n]*/g, '')
    .split(';')
    .map((sql) => sql.trim())
    .filter(Boolean);

  let created = 0;
  let skipped = 0;
  for (const sql of statements) {
    try {
      await db.query(sql);
      if (/^CREATE TABLE/i.test(sql)) created++;
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        skipped++;
        continue;
      }
      console.error('Failed statement:', sql.slice(0, 120));
      throw error;
    }
  }

  const [tables] = await db.query('SHOW TABLES');
  await db.end();
  console.log(`Base schema applied to \`${database}\`. Created ${created} tables, skipped ${skipped} already-existing. Database now has ${tables.length} tables total.`);
}

run().catch((error) => { console.error('Base schema migration failed:', error); process.exit(1); });
