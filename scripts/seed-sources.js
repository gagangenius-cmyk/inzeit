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

// Lead Code -> { name, category }
const sourceSeeds = {
  2001: { name: 'Inbound Call', category: 'Inbound / Direct' },
  2002: { name: 'Walk In', category: 'Inbound / Direct' },
  2003: { name: 'Existing Client', category: 'Inbound / Direct' },
  2004: { name: 'Website', category: 'Website' },
  2005: { name: 'Study Abroad - Website', category: 'Website' },
  2006: { name: 'Google Ads / Landing Page', category: 'Digital Advertising' },
  2007: { name: 'Meta (Facebook/Instagram)', category: 'Digital Advertising' },
  2008: { name: 'TikTok', category: 'Digital Advertising' },
  2009: { name: 'LinkedIn', category: 'Social & Professional' },
  2010: { name: 'SEO Leads (English)', category: 'SEO & Organic' },
  2011: { name: 'SEO Arabic', category: 'SEO & Organic' },
  2012: { name: 'My Google Business', category: 'SEO & Organic' },
  2013: { name: 'WhatsApp (Direct)', category: 'WhatsApp' },
  2014: { name: 'WhatsApp Ads', category: 'WhatsApp' },
  2015: { name: 'WhatsApp SEO', category: 'WhatsApp' },
  2016: { name: 'Livechat - Google Ads', category: 'Live Chat' },
  2017: { name: 'Livechat - SEO', category: 'Live Chat' },
  2018: { name: 'SMS Campaign', category: 'Outbound / Campaigns' },
  2019: { name: 'Email Marketing', category: 'Outbound / Campaigns' },
  2020: { name: 'IELTS Candidates', category: 'Specific Segments' },
  2021: { name: 'CBI Skilled', category: 'Specific Segments' },
  2022: { name: 'Data 3rd Party', category: 'Referral / Third Party' },
  2023: { name: 'Website Pop up', category: 'Website' },
};

async function ensureCategoryColumn(connection) {
  const [cols] = await connection.query("SHOW COLUMNS FROM crm_source LIKE 'category'");
  if (!cols.length) {
    await connection.query('ALTER TABLE crm_source ADD COLUMN category VARCHAR(60) NULL AFTER name');
  }
}

async function ensureSubSourceDefault(connection) {
  const [cols] = await connection.query("SHOW COLUMNS FROM crm_source LIKE 'sub_source'");
  if (cols.length && cols[0].Null === 'NO' && cols[0].Default === null) {
    await connection.query('ALTER TABLE crm_source MODIFY COLUMN sub_source INT NOT NULL DEFAULT 0');
  }
}

async function seedSources(connection) {
  await ensureCategoryColumn(connection);
  await ensureSubSourceDefault(connection);

  for (const [id, { name, category }] of Object.entries(sourceSeeds)) {
    await connection.query(
      `INSERT INTO crm_source (id, name, category, status)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), status = 1`,
      [id, name, category]
    );
  }

  return { sources: Object.keys(sourceSeeds).length };
}

async function run() {
  if (!database) throw new Error('DATABASE_URL must include a database name');
  const connection = await mysql.createConnection({ ...baseConfig, database });
  const result = await seedSources(connection);
  await connection.end();
  console.log(`Seeded ${result.sources} lead sources.`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Source seed failed:', error);
    process.exit(1);
  });
}

module.exports = { sourceSeeds, seedSources };
