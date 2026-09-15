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

// Fixed ids referenced by crm_fee.currency in seed-fees.js's FEE_ROWS, and by
// crm_branch.branch in seed-branches.js (matched via src/lib/branchCurrency.ts).
const CURRENCY_SEEDS = [
  { id: 3, country: 'India', currency_code: 'INR', rate: 1 },
  { id: 5, country: 'Qatar', currency_code: 'QAR', rate: 1 },
  { id: 6, country: 'Kuwait', currency_code: 'KWD', rate: 1 },
  { id: 7, country: 'United Arab Emirates', currency_code: 'AED', rate: 1 },
];

async function seedCurrency(connection) {
  for (const { id, country, currency_code, rate } of CURRENCY_SEEDS) {
    await connection.query(
      `INSERT INTO crm_currency (id, country, currency_code, rate, status, created)
       VALUES (?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE country = VALUES(country), currency_code = VALUES(currency_code), status = 1`,
      [id, country, currency_code, rate]
    );
  }

  return { currencies: CURRENCY_SEEDS.length };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedCurrency(connection);
  await connection.end();
  console.log(`Seeded ${result.currencies} currencies.`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Currency seed failed:', error);
    process.exit(1);
  });
}

module.exports = { CURRENCY_SEEDS, seedCurrency };
