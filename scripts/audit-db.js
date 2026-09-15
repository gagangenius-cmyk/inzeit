const mysql = require('mysql2/promise');

const databaseUrl = 'mysql://dmconsultant_dm_next:Demo2026DMNEXT@187.127.123.60:3306/dmconsultant_dm_next';
const parsedUrl = new URL(databaseUrl);
const database = parsedUrl.pathname.replace(/^\//, '');

const config = {
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database,
};

async function run() {
  const conn = await mysql.createConnection(config);

  const [tables] = await conn.query('SHOW TABLES');
  const tableKey = Object.keys(tables[0])[0];

  for (const row of tables) {
    const tableName = row[tableKey];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TABLE: ${tableName}`);
    console.log('='.repeat(80));

    const [createResult] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    console.log(createResult[0]['Create Table']);
  }

  await conn.end();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
