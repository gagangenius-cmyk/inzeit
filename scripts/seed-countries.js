const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { COUNTRY } = require('./seed-fees');

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

// Fixed ids matching the COUNTRY map in seed-fees.js, which assumes this
// stock data already exists in crm_country_proces. seed-fees.js's
// ensureCountries() only appends brand-new countries after this set, using
// MAX(id)+1, so these ids must be seeded first or its ids would collide.
async function seedCountries(connection) {
  for (const [name, id] of Object.entries(COUNTRY)) {
    await connection.query(
      `INSERT INTO crm_country_proces (id, name, sub_counteries, status)
       VALUES (?, ?, 0, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), status = 1`,
      [id, name]
    );
  }

  return { countries: Object.keys(COUNTRY).length };
}

// All UN member/observer states (~196), for the "Country of Interest" style
// dropdowns that should offer every country, not just DMC's stock
// destination-country list above. Names already covered by COUNTRY/NEW_COUNTRIES
// (or by an obvious alias, e.g. "USA" / "United States of America") are skipped
// so we never create a duplicate row for the same country.
const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo (Republic of the)', 'Congo (Democratic Republic of the)', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine State',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
];

// Countries already in crm_country_proces under a different name — skip these
// so we don't create a second row for the same country.
const ALIASES_OF_EXISTING = new Set([
  'united states of america', // existing: "USA"
  'saint kitts and nevis',    // existing: "St. Kitts & Nevis"
  'saint lucia',              // existing: "St. Lucia"
]);

// Appends every remaining world country not already represented, using the
// same MAX(id)+1 append strategy as seed-fees.js's ensureCountries() (rather
// than relying on AUTO_INCREMENT, which may be behind the real max id).
async function seedAllWorldCountries(connection) {
  const [existingRows] = await connection.query('SELECT name FROM crm_country_proces');
  const existingNames = new Set(existingRows.map((row) => String(row.name).trim().toLowerCase()));

  const [[maxRow]] = await connection.query('SELECT MAX(id) as m FROM crm_country_proces');
  let nextId = maxRow.m + 1;

  let inserted = 0;
  for (const name of WORLD_COUNTRIES) {
    const key = name.toLowerCase();
    if (existingNames.has(key) || ALIASES_OF_EXISTING.has(key)) continue;

    await connection.query(
      'INSERT INTO crm_country_proces (id, name, sub_counteries, status) VALUES (?, ?, 0, 1)',
      [nextId, name]
    );
    existingNames.add(key);
    nextId++;
    inserted++;
  }

  return { inserted, totalConsidered: WORLD_COUNTRIES.length };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedCountries(connection);
  const worldResult = await seedAllWorldCountries(connection);
  await connection.end();
  console.log(`Seeded ${result.countries} core countries. Added ${worldResult.inserted} additional world countries (${worldResult.totalConsidered} considered).`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Country seed failed:', error);
    process.exit(1);
  });
}

module.exports = { seedCountries, seedAllWorldCountries, WORLD_COUNTRIES };
