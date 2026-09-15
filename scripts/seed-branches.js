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

// crm_region rows required by the branch below.
const REGION_SEEDS = ['UAE'];

// Company now operates a single branch (Dubai SZR / head office) - the
// Abu Dhabi, Kuwait, Doha and Hyderabad rows this seeder used to create were
// removed at the user's request, along with the matching rows in
// crm_branch/crm_fee in the live database (see removeNonDubaiBranches() in
// this repo's ad-hoc cleanup, or migrations/20260916_dubai_only_branch.sql
// for the equivalent one-off SQL). `branch` holds the branch's
// country/location (see src/lib/branchCurrency.ts, which matches
// crm_currency.country against crm_branch.branch) rather than a city name,
// so it must line up with the crm_currency rows in seed-currency.js.
const BRANCH_SEEDS = [
  { name: 'Dubai SZR', ar_name: 'دبي', branch: 'United Arab Emirates', region: 'UAE', abbrv: 'DXB SZR',
    address: '1701 Al Shafar Tower 1, Barsha Heights, Dubai, UAE', ar_address: '1701، برج الشافر 1، مركز برشا، دبي، الإمارات العربية المتحدة',
    email: 'info@inzeitconsultants.com', mobile: '+971581617799 / +97145527041', website: 'https://inzeitconsultants.com' },
];

async function ensureRegions(connection) {
  const regionIds = {};
  const [rows] = await connection.query('SELECT id, name FROM crm_region');
  for (const row of rows) regionIds[row.name] = row.id;

  for (const name of REGION_SEEDS) {
    if (regionIds[name]) continue;
    const [result] = await connection.query('INSERT INTO crm_region (name, status) VALUES (?, 1)', [name]);
    regionIds[name] = result.insertId;
  }

  return regionIds;
}

async function seedBranches(connection) {
  const regionIds = await ensureRegions(connection);

  const [rows] = await connection.query('SELECT id, abbrv FROM crm_branch');
  const existingIdByAbbrv = new Map(rows.map((r) => [r.abbrv, r.id]));

  let created = 0;
  for (const b of BRANCH_SEEDS) {
    const existingId = existingIdByAbbrv.get(b.abbrv);
    if (existingId) {
      // Also keeps address/contact fields in sync on re-runs (e.g. after a
      // company rebrand) - originally this only synced branch/region, which
      // meant editing address/email/mobile/website above never reached an
      // already-seeded row.
      await connection.query(
        'UPDATE crm_branch SET branch = ?, region = ?, name = ?, ar_name = ?, address = ?, ar_address = ?, email = ?, mobile = ?, website = ? WHERE id = ?',
        [b.branch, regionIds[b.region], b.name, b.ar_name, b.address, b.ar_address, b.email, b.mobile, b.website, existingId]
      );
      continue;
    }
    await connection.query(
      `INSERT INTO crm_branch (name, ar_name, branch, region, abbrv, address, ar_address, email, mobile, status, website)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [b.name, b.ar_name, b.branch, regionIds[b.region], b.abbrv, b.address, b.ar_address, b.email, b.mobile, b.website]
    );
    created++;
  }

  return { branches: created, regions: Object.keys(regionIds).length };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedBranches(connection);
  await connection.end();
  console.log(`Seeded ${result.branches} branches (${result.regions} regions ensured).`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Branch seed failed:', error);
    process.exit(1);
  });
}

module.exports = { BRANCH_SEEDS, seedBranches };
