const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const ts = require('typescript');
require('dotenv').config();

const MODELS_DIR = path.join(process.cwd(), 'src', 'models');

function connectConfig() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm');
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1),
  };
}

function stringValue(node) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node)) return node.text;
  return null;
}

function propertyName(node) {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text;
  return null;
}

function hasVirtualType(attributeObject) {
  const typeProp = attributeObject.properties.find((prop) => {
    return ts.isPropertyAssignment(prop) && propertyName(prop.name) === 'type';
  });
  return Boolean(typeProp && typeProp.getText().includes('DataTypes.VIRTUAL'));
}

function fieldName(attributeObject) {
  const fieldProp = attributeObject.properties.find((prop) => {
    return ts.isPropertyAssignment(prop) && propertyName(prop.name) === 'field';
  });
  if (!fieldProp || !ts.isPropertyAssignment(fieldProp)) return null;
  return stringValue(fieldProp.initializer);
}

function modelNameFromInitExpression(expression) {
  if (!ts.isPropertyAccessExpression(expression)) return null;
  if (expression.name.text !== 'init') return null;
  return expression.expression.getText();
}

function tableNameFromOptions(optionsObject) {
  const tableNameProp = optionsObject.properties.find((prop) => {
    return ts.isPropertyAssignment(prop) && propertyName(prop.name) === 'tableName';
  });
  if (!tableNameProp || !ts.isPropertyAssignment(tableNameProp)) return null;
  return stringValue(tableNameProp.initializer);
}

function columnsFromAttributes(attributesObject) {
  const columns = [];
  for (const prop of attributesObject.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const attrName = propertyName(prop.name);
    if (!attrName) continue;

    const initializer = prop.initializer;
    if (ts.isObjectLiteralExpression(initializer)) {
      if (hasVirtualType(initializer)) continue;
      columns.push(fieldName(initializer) || attrName);
    } else {
      columns.push(attrName);
    }
  }
  return columns;
}

function extractModelsFromFile(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const models = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const modelName = modelNameFromInitExpression(node.expression);
      const [attributesArg, optionsArg] = node.arguments;
      if (
        modelName &&
        attributesArg &&
        optionsArg &&
        ts.isObjectLiteralExpression(attributesArg) &&
        ts.isObjectLiteralExpression(optionsArg)
      ) {
        const tableName = tableNameFromOptions(optionsArg);
        if (tableName) {
          models.push({
            modelName,
            tableName,
            file: path.relative(process.cwd(), filePath),
            columns: columnsFromAttributes(attributesArg),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return models;
}

function extractModels() {
  const files = fs.readdirSync(MODELS_DIR)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.join(MODELS_DIR, file));
  return files.flatMap(extractModelsFromFile);
}

async function loadDatabaseColumns(db) {
  const [rows] = await db.query(
    `SELECT TABLE_NAME, COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = SCHEMA()
     ORDER BY TABLE_NAME, ORDINAL_POSITION`
  );
  const tables = new Map();
  for (const row of rows) {
    if (!tables.has(row.TABLE_NAME)) tables.set(row.TABLE_NAME, new Set());
    tables.get(row.TABLE_NAME).add(row.COLUMN_NAME);
  }
  return tables;
}

async function main() {
  const models = extractModels();
  const db = await mysql.createConnection(connectConfig());

  try {
    console.log(`Connected to ${db.config.database}`);
    console.log(`Parsed ${models.length} Sequelize model definition(s).`);

    const dbTables = await loadDatabaseColumns(db);
    const missingTables = [];
    const missingColumns = [];

    for (const model of models) {
      const presentColumns = dbTables.get(model.tableName);
      if (!presentColumns) {
        missingTables.push(model);
        continue;
      }

      const missing = [...new Set(model.columns)].filter((column) => !presentColumns.has(column));
      if (missing.length) {
        missingColumns.push({ ...model, missing });
      }
    }

    if (missingTables.length) {
      console.log('\nMISSING TABLES');
      for (const model of missingTables) {
        console.log(`- ${model.tableName} (${model.modelName}, ${model.file})`);
      }
    }

    if (missingColumns.length) {
      console.log('\nMISSING COLUMNS');
      for (const model of missingColumns) {
        console.log(`- ${model.tableName} (${model.modelName}, ${model.file}): ${model.missing.join(', ')}`);
      }
    }

    if (!missingTables.length && !missingColumns.length) {
      console.log('\nAll Sequelize model tables and columns exist in the database.');
    } else {
      throw new Error(`${missingTables.length} missing table(s), ${missingColumns.reduce((sum, item) => sum + item.missing.length, 0)} missing column(s)`);
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
