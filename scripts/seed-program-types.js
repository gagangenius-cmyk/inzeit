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

// Ids match the crm_program_type scheme assumed by classifyProgramType() in seed-fees.js
// (1=Business, 2=Skill, 3=Student, 4=Visit, 5=Work, 6=Business CBI).
const PROGRAM_TYPE_SEEDS = [
  { id: 1, type: 'Business Immigration' },
  { id: 2, type: 'Skilled Immigration' },
  { id: 3, type: 'Study Abroad' },
  { id: 4, type: 'Visit Visa/ Tourist Visa' },
  { id: 5, type: 'Work Permit' },
  { id: 6, type: 'Citizenship By Investment' },
];

async function seedProgramTypes(connection) {
  for (const { id, type } of PROGRAM_TYPE_SEEDS) {
    await connection.query(
      `INSERT INTO crm_program_type (id, type, status, created, created_by)
       VALUES (?, ?, 1, NOW(), 1)
       ON DUPLICATE KEY UPDATE type = VALUES(type), status = 1`,
      [id, type]
    );
  }

  return { programTypes: PROGRAM_TYPE_SEEDS.length };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedProgramTypes(connection);
  await connection.end();
  console.log(`Seeded ${result.programTypes} program types.`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Program type seed failed:', error);
    process.exit(1);
  });
}

module.exports = { PROGRAM_TYPE_SEEDS, seedProgramTypes };
