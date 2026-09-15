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

const adminPermissions = [
  'all',
  'admin.access',
  'sales.view',
  'sales.create',
  'sales.update',
  'sales.delete',
  'operations.view',
  'operations.create',
  'operations.update',
  'operations.delete',
  'operations.manage',
  // Operations Manager Console rights (case transfer, case-status lifecycle,
  // task reassignment, CRM access freeze/restrict) and the Team Allocation
  // page — declared in src/lib/modulePermissions.ts but previously missing
  // from this seed list, so no role (including Operation Manager, whose
  // stated rights already covered these) could actually be granted them.
  'operations.case_transfer',
  'operations.case_status_manage',
  'operations.task_reassign',
  'operations.access_control',
  'operations.team_allocation',
  // Assign Call/Task/Appointment tool (crm_ops_assignments) - granted broadly
  // here plus explicitly to Branch Manager/Regional Manager below, since
  // those two roles otherwise have no operations.* permission at all.
  'operations.assign_activities',
  'reports.view',
  'reports.create',
  'reports.update',
  'reports.delete',
  'leads.view',
  'leads.create',
  'leads.update',
  'leads.delete',
  'leads.bulk_upload',
  'analytics.view',
  'appointments.view',
  'appointments.manage',
  'documents.view',
  'documents.create',
  'documents.update',
  'documents.delete',
  'payments.view',
  'payments.create',
  'payments.update',
  'payments.delete',
  'invoices.view',
  'invoices.create',
  'invoices.update',
  'invoices.delete',
  'agreements.view',
  'agreements.create',
  'agreements.update',
  'agreements.delete',
  'clients.view',
  'clients.create',
  'clients.update',
  'clients.delete',
  'counselors.manage',
  'employees.manage',
  'branches.manage',
  'departments.manage',
  'attendance.manage',
  'programs.manage',
  'fees.manage',
  'currency.manage',
  'countries.manage',
  'roles.manage',
  'marketing.manage',
  'campaigns.manage',
  'templates.manage',
  'b2b.manage',
  'employers.manage',
  'transfers.manage',
  'recognition.manage',
  'monitoring.view',
  'settings.manage',
  'hr.dashboard',
  'hr.view',
  'hr.create',
  'hr.update',
  'hr.delete',
  'hr.config',
  'hr.payroll',
  'hr.eosb',
  'pro.dashboard',
  'pro.view',
  'pro.create',
  'pro.update',
  'pro.delete',
  'pro.config',
  'pro.wps.view',
  'pro.owners.restricted',
  'hr.self',
  'hr.team.attendance_leave',
  'hr.reports.attendance',
  'finance.view',
  'finance.manage',
  'fees.view',
  'it.dashboard',
  'it.view',
  'it.approve.manager',
  'it.approve.branch',
  'it.approve.director',
  'it.manage',
  'it.config',
  // Automation rules engine (crm_automation_rules) - system-level config in
  // the same tier as roles.manage/settings.manage, not a per-department right.
  'automation.manage',
];

// Every employee, regardless of role, can raise and track their own IT tickets.
const itSelfServicePermissions = ['it.create', 'it.self'];

// Individual-contributor tier: own leads/meetings/agreements only, read-only
// Operations visibility, and no receipts/invoice access. Used by both
// Senior Immigration Advisor and Immigration Advisor - the two differ only
// in seniority/hierarchy and who manages them, not in CRM permissions.
const counsellorPermissions = [
  'sales.view', 'sales.create', 'sales.update',
  'leads.view', 'leads.create', 'leads.update',
  'clients.view', 'clients.create', 'clients.update',
  'appointments.view', 'appointments.manage',
  'documents.view', 'documents.create', 'documents.update',
  'agreements.view', 'agreements.create',
  'operations.view',
  'reports.view',
  'fees.view',
];

// Team Leader / Area Manager: full company-wide sales + operations +
// reporting authority (can see every lead, not just their own), plus the
// ability to assign leads to the advisors under them (transfers.manage) -
// but no user/system administration, no fee-plan editing, no destructive
// delete/void/refund actions. Identical permission grant for both roles;
// they differ only in which advisor tier they manage (Senior Immigration
// Advisor vs Immigration Advisor - see src/lib/roleChecks.ts and the Target
// Assignment hierarchy, not this permission set).
const teamLeaderPermissions = [
  'sales.view', 'sales.create', 'sales.update',
  'leads.view', 'leads.create', 'leads.update',
  'clients.view', 'clients.create', 'clients.update', 'clients.delete',
  'appointments.view', 'appointments.manage',
  'documents.view', 'documents.create', 'documents.update', 'documents.delete',
  'payments.view', 'payments.create', 'payments.update',
  'invoices.view', 'invoices.create', 'invoices.update',
  'agreements.view', 'agreements.create', 'agreements.update',
  'reports.view', 'reports.create',
  'analytics.view',
  'operations.view', 'operations.create', 'operations.update', 'operations.manage',
  'counselors.manage',
  'transfers.manage',
  'recognition.manage',
  'monitoring.view',
  'fees.view',
  'leads.bulk_upload',
  // Needed to open Leave Management and approve/reject requests for staff
  // the system auto-assigns them as manager for.
  'hr.team.attendance_leave',
];

// Director of Sales: everything CEO can do EXCEPT delete anything - every
// adminPermissions key except 'all' (which would bypass this restriction)
// and every '*.delete' key.
const fullAccessExceptDeletePermissions = adminPermissions.filter(
  (permission) => permission !== 'all' && !permission.endsWith('.delete'),
);

const hrModulePermissions = [
  'hr.dashboard', 'hr.view', 'hr.create', 'hr.update', 'hr.delete',
  'hr.config', 'hr.payroll', 'hr.eosb', 'hr.reports.attendance',
];

// Accounts: finance module only - view/manage financials plus the
// payments/invoices views finance work actually touches day to day.
const accountsPermissions = [
  'finance.view', 'finance.manage',
  'payments.view', 'payments.create', 'payments.update',
  'invoices.view', 'invoices.create', 'invoices.update',
  'fees.view', 'reports.view',
];

// Operations: only the Operations module, nothing else.
const operationsPermissions = ['operations.view', 'operations.create', 'operations.update', 'operations.manage'];

// The complete, intentionally small role roster - every designation not
// listed here is retired (deactivated, not deleted - see
// deactivateRetiredRoles below) rather than kept around as unused cruft.
const roleSeedsBase = [
  // Full, unrestricted access to everything in the CRM.
  { name: 'CEO', type: 'director', hierarchy: 8, departmentId: 1, permissions: adminPermissions },
  // Same access as CEO, minus every delete permission.
  { name: 'Director of Sales', type: 'director_of_sales', hierarchy: 9, departmentId: 1, permissions: fullAccessExceptDeletePermissions },
  // Sees every lead/client company-wide and assigns leads to Senior
  // Immigration Advisors under them.
  { name: 'Team Leader', type: 'team_leader', hierarchy: 15, departmentId: 1, permissions: teamLeaderPermissions },
  // Same rights as Team Leader; assigns leads to Immigration Advisors instead.
  { name: 'Area Manager', type: 'area_manager', hierarchy: 15, departmentId: 1, permissions: teamLeaderPermissions },
  { name: 'Senior Immigration Advisor', type: 'senior_immigration_advisor', hierarchy: 40, departmentId: 1, permissions: counsellorPermissions },
  { name: 'Immigration Advisor', type: 'immigration_advisor', hierarchy: 45, departmentId: 1, permissions: counsellorPermissions },
  { name: 'HR', type: 'hr', hierarchy: 30, departmentId: 1, permissions: hrModulePermissions },
  { name: 'Accounts', type: 'accounts', hierarchy: 30, departmentId: 1, permissions: accountsPermissions },
  { name: 'Operations', type: 'operations', hierarchy: 40, departmentId: 1, permissions: operationsPermissions },
];

// Every crm_role not in this canonical list is a retired designation -
// deactivated (status = 0), never deleted, so historical employees/leads/
// remarks that still reference the old role_id stay intact and the change
// is trivially reversible.
async function deactivateRetiredRoles(connection, keepNames) {
  const placeholders = keepNames.map(() => '?').join(',');
  const [result] = await connection.query(
    `UPDATE crm_role SET status = 0 WHERE status = 1 AND LOWER(name) NOT IN (${placeholders})`,
    keepNames.map((name) => name.toLowerCase()),
  );
  return result.affectedRows || 0;
}

// Every role gets it.create/it.self merged in, so any employee can raise and
// track their own IT support tickets regardless of their primary role.
const roleSeeds = roleSeedsBase.map((role) => ({
  ...role,
  permissions: Array.from(new Set([...role.permissions, ...itSelfServicePermissions])),
}));

const titleCase = (value) => value
  .replace(/[._-]+/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const permissionMeta = (permissionKey) => {
  if (permissionKey === 'all') {
    return { module: 'system', action: 'all', label: 'All Permissions' };
  }

  const [module, ...actionParts] = permissionKey.split('.');
  return {
    module,
    action: actionParts.join('.') || 'access',
    label: titleCase(permissionKey),
  };
};

async function ensureRolePermissionTables(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS crm_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_key VARCHAR(120) NOT NULL UNIQUE,
    module VARCHAR(80) NOT NULL,
    action VARCHAR(40) NOT NULL,
    label VARCHAR(160) NOT NULL,
    description TEXT NULL,
    status INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dm_permissions_module (module),
    INDEX idx_dm_permissions_status (status)
  )`);

  await connection.query(`CREATE TABLE IF NOT EXISTS crm_role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    status INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_dm_role_permission (role_id, permission_id),
    INDEX idx_dm_role_permissions_role (role_id),
    INDEX idx_dm_role_permissions_permission (permission_id),
    INDEX idx_dm_role_permissions_status (status)
  )`);
}

async function ensureForeignKey(connection, tableName, constraintName, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [database, tableName, constraintName],
  );

  if (Number(rows[0].count) === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${definition}`);
  }
}

async function ensureIndex(connection, tableName, indexName, columns) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [database, tableName, indexName],
  );

  if (Number(rows[0].count) === 0) {
    await connection.query(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${columns})`);
  }
}

async function upsertPermission(connection, permissionKey) {
  const meta = permissionMeta(permissionKey);
  await connection.query(
    `INSERT INTO crm_permissions (permission_key, module, action, label, description, status)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE module = VALUES(module), action = VALUES(action), label = VALUES(label), status = 1, updated_at = CURRENT_TIMESTAMP`,
    [permissionKey, meta.module, meta.action, meta.label, `${meta.label} access`],
  );

  const [rows] = await connection.query('SELECT id FROM crm_permissions WHERE permission_key = ? LIMIT 1', [permissionKey]);
  return rows[0].id;
}

async function upsertRole(connection, role) {
  const [existing] = await connection.query('SELECT id FROM crm_role WHERE LOWER(name) = LOWER(?) LIMIT 1', [role.name]);

  if (existing.length) {
    await connection.query(
      'UPDATE crm_role SET type = ?, hierarchy = ?, department_id = ?, status = 1 WHERE id = ?',
      [role.type, role.hierarchy, role.departmentId, existing[0].id],
    );
    return existing[0].id;
  }

  const [result] = await connection.query(
    'INSERT INTO crm_role (name, hierarchy, status, type, department_id) VALUES (?, ?, 1, ?, ?)',
    [role.name, role.hierarchy, role.type, role.departmentId],
  );
  return result.insertId;
}

async function seedRolePermissions(connection) {
  await ensureRolePermissionTables(connection);

  const allPermissions = Array.from(new Set(roleSeeds.flatMap((role) => role.permissions)));
  const permissionIds = new Map();
  for (const permissionKey of allPermissions) {
    permissionIds.set(permissionKey, await upsertPermission(connection, permissionKey));
  }

  for (const role of roleSeeds) {
    const roleId = await upsertRole(connection, role);
    await connection.query('UPDATE crm_role_permissions SET status = 0 WHERE role_id = ?', [roleId]);

    for (const permissionKey of role.permissions) {
      await connection.query(
        `INSERT INTO crm_role_permissions (role_id, permission_id, status)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE status = 1, updated_at = CURRENT_TIMESTAMP`,
        [roleId, permissionIds.get(permissionKey)],
      );
    }
  }

  await connection.query('DELETE rp FROM crm_role_permissions rp LEFT JOIN crm_role r ON r.id = rp.role_id WHERE r.id IS NULL');
  await connection.query('DELETE rp FROM crm_role_permissions rp LEFT JOIN crm_permissions p ON p.id = rp.permission_id WHERE p.id IS NULL');
  await ensureIndex(connection, 'crm_role', 'idx_dm_role_id', '`id`');
  await ensureIndex(connection, 'crm_permissions', 'idx_dm_permissions_id', '`id`');
  await ensureForeignKey(
    connection,
    'crm_role_permissions',
    'fk_dm_role_permissions_role',
    'FOREIGN KEY (`role_id`) REFERENCES `crm_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  );
  await ensureForeignKey(
    connection,
    'crm_role_permissions',
    'fk_dm_role_permissions_permission',
    'FOREIGN KEY (`permission_id`) REFERENCES `crm_permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  );

  const retiredRoles = await deactivateRetiredRoles(connection, roleSeeds.map((role) => role.name));

  return { roles: roleSeeds.length, permissions: allPermissions.length, retiredRoles };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedRolePermissions(connection);
  await connection.end();
  console.log(`Seeded ${result.roles} roles and ${result.permissions} permissions. Retired ${result.retiredRoles} old role(s).`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Role permission seed failed:', error);
    process.exit(1);
  });
}

module.exports = {
  adminPermissions,
  roleSeeds,
  seedRolePermissions,
};
