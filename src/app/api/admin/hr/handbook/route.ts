import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const ensureTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_hr_handbook_documents (
      document_id CHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(120) NOT NULL DEFAULT 'General',
      file_url VARCHAR(500) NOT NULL,
      version INT NOT NULL DEFAULT 1,
      is_current TINYINT(1) NOT NULL DEFAULT 1,
      uploaded_by CHAR(36) NULL,
      uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_hr_handbook_category (category),
      INDEX idx_hr_handbook_current (is_current)
    )
  `);
};

// Any authenticated employee can view the handbook - it's company policy, not an HR-only
// screen, so there's no permission gate on GET (only on the upload/POST path below).
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  await ensureTable();
  const documents = await sequelize.query(
    `SELECT document_id, title, category, file_url, version, uploaded_at
     FROM crm_hr_handbook_documents WHERE is_current = 1 ORDER BY category ASC, title ASC`,
    { type: QueryTypes.SELECT }
  );
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  await ensureTable();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || 'General').trim() || 'General';
  if (!file || !title) {
    return NextResponse.json({ error: 'file and title are required' }, { status: 400 });
  }

  const [previous] = await sequelize.query<{ version: number }>(
    `SELECT MAX(version) AS version FROM crm_hr_handbook_documents WHERE category = :category`,
    { replacements: { category }, type: QueryTypes.SELECT }
  );
  const nextVersion = (previous?.version || 0) + 1;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await put(`hr-handbook/${category}/${Date.now()}_${safeName}`, file, { access: 'public', addRandomSuffix: true });

  await sequelize.query(`UPDATE crm_hr_handbook_documents SET is_current = 0 WHERE category = :category`, { replacements: { category } });

  const documentId = crypto.randomUUID();
  await sequelize.query(
    `INSERT INTO crm_hr_handbook_documents (document_id, title, category, file_url, version, is_current, uploaded_by)
     VALUES (:documentId, :title, :category, :fileUrl, :version, 1, :uploadedBy)`,
    { replacements: { documentId, title, category, fileUrl: blob.url, version: nextVersion, uploadedBy: String(auth.id) } }
  );

  return NextResponse.json({ document_id: documentId, version: nextVersion }, { status: 201 });
}
