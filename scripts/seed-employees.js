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

// Single-branch company (Dubai SZR only) - see seed-branches.js.
const BRANCH_ABBRV = { DXB: 'DXB SZR' };
// crm_department has no seeded rows - src/app/admin/employees/page.tsx treats
// this as a fixed id->label enum instead (DEPARTMENT_LABELS there). Keep
// these ids in sync with that file if either changes.
const DEPT = { Sales: 1, Operations: 2, Admin: 3, HR: 4, Accounts: 5 };

// Canonical active roster, matching the 9-role restructuring in
// seed-roles-permissions.js. Created if missing (matched by username);
// existing records get role/branch/department/status kept in sync.
// `manager` (a username in this same list) populates crm_employee.manager_id,
// the backbone of the hierarchical Target Assignment system - see
// src/app/admin/targets/page.tsx and docs/TARGET_ASSIGNMENT.md.
//
// Branch defaults to Dubai SZR (head office) for every role here since none
// of these designations were given a specific branch - correct this per
// person if any of them should sit in a different branch.
const newEmployees = [
  // Only these two hold CEO (full, unrestricted) access - see roleSeedsBase
  // in seed-roles-permissions.js for what the CEO role grants.
  { branch: 'DXB', dept: 'Admin', doj: null, name: 'Akshay', username: 'Akshay', role: 'CEO' },
  { branch: 'DXB', dept: 'Admin', doj: null, name: 'Darshan', username: 'Darshan', role: 'CEO' },
  { branch: 'DXB', dept: 'Admin', doj: null, name: 'Ujjwal Sahani', username: 'Ujjwal', role: 'Director of Sales' },
  { branch: 'DXB', dept: 'Admin', doj: null, name: 'Mehak Riaz', username: 'Mehak', role: 'Team Leader' },
  { branch: 'DXB', dept: 'Admin', doj: null, name: 'Ashutosh Pandey', username: 'Ashutosh', role: 'Area Manager' },
  { branch: 'DXB', dept: 'Sales', doj: null, name: 'Aaron Paul', username: 'Aaron', role: 'Senior Immigration Advisor', manager: 'Mehak' },
  { branch: 'DXB', dept: 'Sales', doj: null, name: 'Rubeca Francis', username: 'Rubeca', role: 'Senior Immigration Advisor', manager: 'Mehak' },
  { branch: 'DXB', dept: 'Sales', doj: null, name: 'Harpreet Kaur', username: 'Harpreet', role: 'Immigration Advisor', manager: 'Ashutosh' },
  { branch: 'DXB', dept: 'HR', doj: null, name: 'HR', username: 'HR', role: 'HR' },
  { branch: 'DXB', dept: 'Accounts', doj: null, name: 'Accounts', username: 'Accounts', role: 'Accounts' },
  { branch: 'DXB', dept: 'Operations', doj: null, name: 'Operations', username: 'Operations', role: 'Operations' },
];

async function resolveLookups(connection) {
  const [branchRows] = await connection.query('SELECT id, abbrv FROM crm_branch');
  const byAbbrv = new Map(branchRows.map((r) => [r.abbrv, r.id]));
  const branchIds = {};
  for (const [key, abbrv] of Object.entries(BRANCH_ABBRV)) {
    if (!byAbbrv.has(abbrv)) throw new Error(`crm_branch row with abbrv "${abbrv}" not found`);
    branchIds[key] = byAbbrv.get(abbrv);
  }

  const [roleRows] = await connection.query('SELECT id, name FROM crm_role WHERE status = 1');
  const roleIds = new Map(roleRows.map((r) => [r.name, r.id]));

  return { branchIds, roleIds };
}

async function seedEmployees(connection) {
  const { branchIds, roleIds } = await resolveLookups(connection);
  const credentials = [];
  const idByUsername = new Map();
  let created = 0;
  let updated = 0;

  for (const emp of newEmployees) {
    const roleId = roleIds.get(emp.role);
    if (!roleId) throw new Error(`Role "${emp.role}" not found for ${emp.name}`);
    const branchId = branchIds[emp.branch];
    const deptId = DEPT[emp.dept];

    const [existing] = await connection.query('SELECT id FROM crm_employee WHERE username = ? LIMIT 1', [emp.username]);
    if (existing.length) {
      // status = 1 so re-running this script also reactivates someone who
      // was previously retired by an older roster version.
      await connection.query('UPDATE crm_employee SET role = ?, branch = ?, department = ?, status = 1 WHERE id = ?', [roleId, branchId, deptId, existing[0].id]);
      idByUsername.set(emp.username, existing[0].id);
      updated++;
      continue;
    }

    const password = emp.username;
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await connection.query(
      `INSERT INTO crm_employee (
        name, email, cemail, mobile, cmobile, paddress, address, photo, dob,
        role, vendor_id, branch, region, username, password, status, ppNo,
        visaExp, department, EID, doj, nationality, dol, remark, labexp,
        bounce, em_local_name, em_home_name, em_local_number, em_home_number,
        religion, gender, crea, wfh, work_location, work_country, work_city,
        work_site, employment_type
      ) VALUES (
        ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        ?, 0, ?, NULL, ?, ?, 1, NULL,
        NULL, ?, NULL, ?, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        '', '', 1, 0, 'Onshore', 'UAE', NULL,
        NULL, 'Full-time'
      )`,
      [emp.name, roleId, branchId, emp.username, hashed, deptId, emp.doj]
    );
    idByUsername.set(emp.username, result.insertId);
    credentials.push({ id: result.insertId, name: emp.name, username: emp.username, password });
    created++;
  }

  // Second pass: link manager_id now that every employee in this roster has
  // a resolved id (a manager may appear later in the array than their report).
  for (const emp of newEmployees) {
    if (!emp.manager) continue;
    const managerId = idByUsername.get(emp.manager);
    if (!managerId) throw new Error(`Manager username "${emp.manager}" not found for ${emp.name}`);
    await connection.query('UPDATE crm_employee SET manager_id = ? WHERE id = ?', [managerId, idByUsername.get(emp.username)]);
  }

  // Retire (deactivate, never delete) every employee not in this roster -
  // keeps all historical leads/remarks/payments referencing their id intact
  // and lets any of them be reinstated by simply flipping status back to 1.
  const keepUsernames = newEmployees.map((e) => e.username.toLowerCase());
  const placeholders = keepUsernames.map(() => '?').join(',');
  const [retireResult] = await connection.query(
    `UPDATE crm_employee SET status = 0 WHERE status = 1 AND LOWER(username) NOT IN (${placeholders})`,
    keepUsernames,
  );

  return { created, updated, credentials, retired: retireResult.affectedRows || 0 };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedEmployees(connection);
  await connection.end();
  console.log(`Employees: created ${result.created}, updated ${result.updated}, retired ${result.retired}.`);
  if (result.credentials.length) {
    console.log('New account credentials (save these — shown only once):');
    console.log(JSON.stringify(result.credentials, null, 2));
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Employee seed failed:', error);
    process.exit(1);
  });
}

module.exports = { newEmployees, seedEmployees };
