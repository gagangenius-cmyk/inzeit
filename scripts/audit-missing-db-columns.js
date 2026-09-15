const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const GUARDED_COLUMNS = {
  crm_pay_history: {
    proof_url: 'varchar(500) DEFAULT NULL',
    admin_fee_included: "tinyint(1) NOT NULL DEFAULT '0'",
    admin_fee_amount: "decimal(10,2) NOT NULL DEFAULT '0.00'",
  },
  crm_forum_leads: {
    client_actual_name: 'varchar(255) DEFAULT NULL',
  },
  appointments: {
    remarks: 'text',
  },
  crm_ops_assignments: {
    outcome_remark: 'text',
  },
  crm_source: {
    category: 'varchar(60) DEFAULT NULL',
  },
  crm_service: {
    validity: 'varchar(50) DEFAULT NULL',
  },
  crm_client_documents: {
    mandatory: "tinyint(1) NOT NULL DEFAULT '1'",
    accepted_formats: 'varchar(255) DEFAULT NULL',
  },
  crm_client_credentials: {
    temporary_password: 'varchar(255) DEFAULT NULL',
  },
  crm_follow_up_reminders: {
    completion_notes: 'text',
  },
  crm_employee_preferences: {
    whatsapp_template: 'text',
  },
};

function parseCreateTableColumns(sql) {
  const tables = {};
  const tablePattern = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g;
  let tableMatch;

  while ((tableMatch = tablePattern.exec(sql))) {
    const tableName = tableMatch[1];
    const tableBody = tableMatch[2];
    tables[tableName] = {};

    for (const rawLine of tableBody.split(/\r?\n/)) {
      const line = rawLine.trim();
      const columnMatch = line.match(/^`([^`]+)`\s+(.+?)(?:,)?$/);
      if (!columnMatch) continue;
      tables[tableName][columnMatch[1]] = columnMatch[2].replace(/,$/, '').trim();
    }
  }

  return tables;
}

async function main() {
  const expected = parseCreateTableColumns(fs.readFileSync('database-schema.sql', 'utf8'));
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm');
  const db = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1),
  });

  const [columns] = await db.query(
    'SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = SCHEMA()'
  );
  await db.end();

  const live = {};
  for (const column of columns) {
    if (!live[column.TABLE_NAME]) live[column.TABLE_NAME] = new Set();
    live[column.TABLE_NAME].add(column.COLUMN_NAME);
  }

  const missing = [];
  for (const [tableName, expectedColumns] of Object.entries(expected)) {
    if (!live[tableName]) continue;
    for (const [columnName, definition] of Object.entries(expectedColumns)) {
      if (!live[tableName].has(columnName)) {
        missing.push({ tableName, columnName, definition });
      }
    }
  }
  for (const [tableName, expectedColumns] of Object.entries(GUARDED_COLUMNS)) {
    if (!live[tableName]) continue;
    for (const [columnName, definition] of Object.entries(expectedColumns)) {
      if (!live[tableName].has(columnName)) {
        missing.push({ tableName, columnName, definition });
      }
    }
  }

  if (missing.length === 0) {
    console.log('No missing columns found against database-schema.sql.');
    return;
  }

  for (const item of missing) {
    console.log(`${item.tableName}.${item.columnName} ${item.definition}`);
  }
  process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
