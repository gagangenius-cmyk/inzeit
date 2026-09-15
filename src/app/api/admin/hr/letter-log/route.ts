import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

let tableReady: Promise<void> | null = null;
const ensureTable = async () => {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_hr_letter_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        template_id VARCHAR(20) NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        ref_number VARCHAR(100) NOT NULL,
        letter_date DATE NULL,
        generated_by INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view']);
  if (isAuthError(auth)) return auth;
  await ensureDB();
  await ensureTable();
  const rows = await sequelize.query<any>(
    `SELECT id, template_id, template_name, employee_name, ref_number, letter_date, created_at
     FROM crm_hr_letter_log ORDER BY created_at DESC LIMIT 50`,
    { type: QueryTypes.SELECT }
  );
  return NextResponse.json({ history: rows });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  await ensureDB();
  await ensureTable();
  const userId = auth.id;
  const body = await request.json();

  await sequelize.query(
    `INSERT INTO crm_hr_letter_log (template_id, template_name, employee_name, ref_number, letter_date, generated_by)
     VALUES (:templateId, :templateName, :employeeName, :refNumber, :letterDate, :generatedBy)`,
    {
      replacements: {
        templateId: body.templateId || '',
        templateName: body.templateName || '',
        employeeName: body.employeeName || '—',
        refNumber: body.refNumber || '',
        letterDate: body.letterDate || null,
        generatedBy: userId,
      },
    }
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
