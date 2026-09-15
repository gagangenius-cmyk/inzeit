// One-off grant: gives Branch Manager and Regional Manager the new
// 'operations.assign_activities' permission, so they can use the new
// Assign Call/Task/Appointment pages (/admin/ops-assign, /admin/ops-my-assignments)
// without granting them the broader operations.view/operations.manage access
// that would open up the rest of the Operations module (case management etc).
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

async function run() {
  const connection = await mysql.createConnection({ ...baseConfig, database });

  await connection.query(
    `INSERT INTO crm_permissions (permission_key, module, action, label, description, status)
     VALUES ('operations.assign_activities', 'operations', 'assign_activities', 'Assign Activities', 'Assign Activities access', 1)
     ON DUPLICATE KEY UPDATE module = VALUES(module), action = VALUES(action), label = VALUES(label), status = 1, updated_at = CURRENT_TIMESTAMP`,
  );
  const [[perm]] = await connection.query(
    `SELECT id FROM crm_permissions WHERE permission_key = 'operations.assign_activities' LIMIT 1`,
  );

  const [roles] = await connection.query(
    `SELECT id, name FROM crm_role WHERE name IN ('Branch Manager', 'Regional Manager')`,
  );

  for (const role of roles) {
    await connection.query(
      `INSERT INTO crm_role_permissions (role_id, permission_id, status)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE status = 1, updated_at = CURRENT_TIMESTAMP`,
      [role.id, perm.id],
    );
  }

  console.log(`Granted operations.assign_activities (permission id ${perm.id}) to: ${roles.map((r) => r.name).join(', ')}`);
  await connection.end();
}

run().catch((error) => {
  console.error('Grant failed:', error);
  process.exit(1);
});
