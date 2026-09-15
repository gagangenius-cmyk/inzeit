// One-off grant: gives the Operations case-handling tier (Process
// Coordinator, Team Leader, CPO, Assistant Branch Manager, Sr Branch
// Co-ordinator, Sr Team Lead, Branch Coordinator, Operations Case Manager,
// Process Coordinator & Legal Case Coordinator, Case Officer) the
// 'clients.view' permission, matching what Director of Operations/Operation
// Manager/Assistant Operations Manager already have - without it,
// /admin/clients and its APIs 403 for this whole tier even though they're
// the ones actually working the case day to day.
// Safe to re-run - upserts by unique key, does not touch any other role/permission.
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
};

const TARGET_ROLES = [
  'Process Coordinator',
  'Team Leader',
  'CPO',
  'Assistant Branch Manager',
  'Sr Branch Co-ordinator',
  'Sr Team Lead',
  'Branch Coordinator',
  'Operations Case Manager',
  'Process Coordinator & Legal Case Coordinator',
  'Case Officer',
];

async function run() {
  const connection = await mysql.createConnection({ ...baseConfig, database });

  const [[perm]] = await connection.query(
    `SELECT id FROM crm_permissions WHERE permission_key = 'clients.view' LIMIT 1`,
  );
  if (!perm) throw new Error('clients.view permission not found in crm_permissions - expected it to already exist');

  const [roles] = await connection.query(
    `SELECT id, name FROM crm_role WHERE name IN (?)`,
    [TARGET_ROLES],
  );

  for (const role of roles) {
    await connection.query(
      `INSERT INTO crm_role_permissions (role_id, permission_id, status)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE status = 1, updated_at = CURRENT_TIMESTAMP`,
      [role.id, perm.id],
    );
  }

  const found = roles.map((r) => r.name);
  const missing = TARGET_ROLES.filter((name) => !found.includes(name));
  console.log(`Granted clients.view (permission id ${perm.id}) to: ${found.join(', ')}`);
  if (missing.length) console.warn(`Not found in crm_role (skipped): ${missing.join(', ')}`);

  await connection.end();
}

run().catch((error) => {
  console.error('Grant failed:', error);
  process.exit(1);
});
