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

const { FEE_ROWS } = require('./seed-fees');

const PROGRAM_VALIDITY_SEEDS = [
  // Legacy crm_service catalog (ids 1-38) — this is the catalog real leads
  // actually reference via service_interest; the 1001+ codes below are a
  // newer, parallel catalog most leads never used, which is why Canada/
  // Australia opportunities kept showing a generic duration instead of the
  // real 18-month program term.
  { code: '1', name: 'Canada PA & Spouse', category: 'Canada', validity: '18 Months' },
  { code: '2', name: 'Canada Single', category: 'Canada', validity: '18 Months' },
  { code: '3', name: 'Canada ECA - PA & Spouse', category: 'Canada', validity: '18 Months' },
  { code: '4', name: 'Canada ECA - Single', category: 'Canada', validity: '18 Months' },
  { code: '5', name: 'Canada Post ECA - PA & Spouse', category: 'Canada', validity: '18 Months' },
  { code: '6', name: 'Canada Post ECA- Single', category: 'Canada', validity: '18 Months' },
  { code: '7', name: 'Alberta Tech Pathway', category: 'Canada', validity: '18 Months' },
  { code: '8', name: 'Canada OINP Work Permit', category: 'Canada', validity: '18 Months' },
  { code: '9', name: 'Canada-Quebec Skill Worker Program', category: 'Canada', validity: '18 Months' },
  { code: '10', name: 'Ontario Entrepreneur Stream(OINP)', category: 'Canada', validity: '18 Months' },
  { code: '11', name: 'PNP', category: 'Canada', validity: '18 Months' },
  { code: '12', name: 'PNP - Ontario Foreign Worker Stream', category: 'Canada', validity: '18 Months' },
  { code: '13', name: 'PNP PR', category: 'Canada', validity: '18 Months' },
  { code: '14', name: 'Provincial Immigration Program - AIP', category: 'Canada', validity: '18 Months' },
  { code: '15', name: 'Provincial Nomination Program – PR Pathway', category: 'Canada', validity: '18 Months' },
  { code: '16', name: 'Rural Community Immigration Pilot', category: 'Canada', validity: '18 Months' },
  { code: '17', name: 'Rural Renewal Stream', category: 'Canada', validity: '18 Months' },
  { code: '18', name: 'Rural Renewal Stream 30', category: 'Canada', validity: '18 Months' },
  { code: '19', name: 'SINP', category: 'Canada', validity: '18 Months' },
  { code: '20', name: 'Saskatchewan', category: 'Canada', validity: '18 Months' },
  { code: '21', name: 'YUKON & RURAL Immigration program 10', category: 'Canada', validity: '18 Months' },
  { code: '22', name: 'Yukon Nomination Program', category: 'Canada', validity: '18 Months' },
  { code: '23', name: 'Economic Immigration Program', category: 'Canada', validity: '18 Months' },
  { code: '24', name: 'Canada Nursing - Work Permit', category: 'Canada', validity: '18 Months' },
  { code: '25', name: 'Super Visa', category: 'Canada', validity: '18 Months' },
  { code: '26', name: 'Australia PA and Spouse', category: 'Australia', validity: '18 Months' },
  { code: '27', name: 'Australia PR Application PA and Spouse Skill Assessment + Job Search', category: 'Australia', validity: '18 Months' },
  { code: '28', name: 'Australia Single', category: 'Australia', validity: '18 Months' },
  { code: '29', name: 'Australia Single (Lawyer)', category: 'Australia', validity: '18 Months' },
  { code: '30', name: 'Australia Single Application & Spouse Skill Assessment Only', category: 'Australia', validity: '18 Months' },
  { code: '31', name: 'Australia Single PR + Job Search Assistance', category: 'Australia', validity: '18 Months' },
  { code: '32', name: 'Australia Work Visa', category: 'Australia', validity: '18 Months' },
  { code: '33', name: 'Australia Skill Assessment', category: 'Australia', validity: '18 Months' },
  { code: '34', name: 'Australia Post Skill Assessment', category: 'Australia', validity: '18 Months' },
  { code: '35', name: 'Global Talent Visa', category: 'Australia', validity: '18 Months' },
  { code: '38', name: 'Australia Job Search Assistance', category: 'Australia', validity: '18 Months' },
  { code: '1001', name: 'Canada Single', category: 'Canada', validity: '18 Months' },
  { code: '1002', name: 'Canada ECA - Single', category: 'Canada', validity: '18 Months' },
  { code: '1003', name: 'PNP', category: 'Canada', validity: '18 Months' },
  { code: '1004', name: 'Canada ITA', category: 'Canada', validity: '18 Months' },
  { code: '1005', name: 'Economic Immigration Program', category: 'Canada', validity: '18 Months' },
  { code: '1006', name: 'Canada Nursing - Work Permit', category: 'Canada', validity: '18 Months' },
  { code: '1007', name: 'Canada Supervisa', category: 'Canada', validity: '18 Months' },
  { code: '1008', name: 'Australia Single', category: 'Australia', validity: '18 Months' },
  { code: '1009', name: 'Australia Skill Assessment', category: 'Australia', validity: '18 Months' },
  { code: '1010', name: 'Australia Post Skill Assessment', category: 'Australia', validity: '18 Months' },
  { code: '1011', name: 'Australia ITA', category: 'Australia', validity: '18 Months' },
  { code: '1012', name: 'Global Talent Visa', category: 'Australia', validity: '18 Months' },
  { code: '1013', name: 'Visit Visa / Tourist Visa', category: 'Visa', validity: '6 Months' },
  { code: '1014', name: 'Student Visa', category: 'Visa', validity: '12 Months' },
  { code: '1015', name: 'Job Seeker Visa', category: 'Visa', validity: '6 Months' },
  { code: '1016', name: 'Dependant Visa', category: 'Visa', validity: '6 Months' },
  { code: '1017', name: 'Visa Application', category: 'Visa', validity: '6 Months' },
  { code: '1018', name: 'Citizenship by Investment', category: 'Investment', validity: '12 Months' },
  { code: '1019', name: 'Resume Marketing', category: 'Service', validity: '6 Months' },
  { code: '1020', name: 'Nomad Visa', category: 'Visa', validity: '6 Months' },
  { code: '1021', name: 'US Petitions', category: 'USA', validity: '12 Months' },
  { code: '1022', name: 'Germany Opportunity Card', category: 'Germany', validity: '6 Months' },
  { code: '1023', name: 'Germany Blue Card', category: 'Germany', validity: '6 Months' },
  { code: '1024', name: 'National Innovation Visa Subclass 858', category: 'Australia', validity: '18 Months' },
];

const PROGRAM_VALIDITY_BY_CODE = Object.fromEntries(
  PROGRAM_VALIDITY_SEEDS.map((row) => [row.code, row.validity])
);

async function ensureProgramValidityColumn(connection) {
  const [cols] = await connection.query("SHOW COLUMNS FROM crm_service LIKE 'validity'");
  if (!cols.length) {
    await connection.query('ALTER TABLE crm_service ADD COLUMN validity VARCHAR(50) NULL AFTER name');
  }
}

async function seedProgramValidity(connection) {
  await ensureProgramValidityColumn(connection);

  const serviceValidityByName = new Map();
  for (const [programCode, serviceName] of FEE_ROWS) {
    const validity = PROGRAM_VALIDITY_BY_CODE[String(programCode)];
    if (!validity || serviceValidityByName.has(serviceName)) continue;
    serviceValidityByName.set(serviceName, validity);
  }

  let updatedDetailedServices = 0;
  for (const [serviceName, validity] of serviceValidityByName.entries()) {
    const [result] = await connection.query(
      'UPDATE crm_service SET validity = ?, status = 1 WHERE LOWER(name) = LOWER(?)',
      [validity, serviceName]
    );
    updatedDetailedServices += result.affectedRows || 0;
  }

  for (const row of PROGRAM_VALIDITY_SEEDS) {
    const numericCode = Number(row.code);
    const [byCode] = await connection.query('SELECT id FROM crm_service WHERE id = ? LIMIT 1', [numericCode]);
    if (byCode.length) {
      await connection.query(
        'UPDATE crm_service SET name = COALESCE(NULLIF(name, \'\'), ?), validity = ?, status = 1 WHERE id = ?',
        [row.name, row.validity, numericCode]
      );
      continue;
    }

    const [byName] = await connection.query('SELECT id FROM crm_service WHERE LOWER(name) = LOWER(?) LIMIT 1', [row.name]);
    if (byName.length) {
      await connection.query('UPDATE crm_service SET validity = ?, status = 1 WHERE id = ?', [row.validity, byName[0].id]);
      continue;
    }

    await connection.query(
      'INSERT INTO crm_service (id, name, validity, status) VALUES (?, ?, ?, 1)',
      [numericCode, row.name, row.validity]
    );
  }

  return {
    programValidity: PROGRAM_VALIDITY_SEEDS.length,
    detailedServices: serviceValidityByName.size,
    updatedDetailedServices,
  };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedProgramValidity(connection);
  await connection.end();
  console.log(`Seeded ${result.programValidity} program validity rows and mapped ${result.updatedDetailedServices}/${result.detailedServices} detailed services.`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Program validity seed failed:', error);
    process.exit(1);
  });
}

module.exports = { PROGRAM_VALIDITY_SEEDS, seedProgramValidity, ensureProgramValidityColumn };
