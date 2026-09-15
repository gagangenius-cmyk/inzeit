import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

type RouteContext = { params: Promise<{ id: string }> };

// Reads/writes the same crm_hr_employee_documents table as the bearer-token-only v1 API
// (src/app/api/v1/[...path]/route.ts) - this route exists so the browser-session-authenticated
// admin UI (cookie auth, like every other admin page) can actually use it; the v1 endpoint's
// own auth model isn't reachable from a normal page fetch.
const ensureTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_hr_employee_documents (
      document_id CHAR(36) PRIMARY KEY,
      employee_id CHAR(36) NOT NULL,
      document_type VARCHAR(255) NOT NULL,
      document_url VARCHAR(500) NOT NULL,
      expiry_date DATE NULL,
      notes TEXT NULL,
      deleted_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_hr_employee_documents_employee (employee_id)
    )
  `);
};

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request, ['hr.view', 'hr.self']);
  if (isAuthError(auth)) return auth;
  const { id } = await context.params;
  await ensureTable();
  const documents = await sequelize.query(
    `SELECT document_id, employee_id, document_type, document_url, expiry_date, notes, created_at
     FROM crm_hr_employee_documents WHERE employee_id = :employeeId AND deleted_at IS NULL ORDER BY created_at DESC`,
    { replacements: { employeeId: id }, type: QueryTypes.SELECT }
  );
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  const { id } = await context.params;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const documentType = String(formData.get('document_type') || '').trim();
  if (!file || !documentType) {
    return NextResponse.json({ error: 'file and document_type are required' }, { status: 400 });
  }

  await ensureTable();

  // Duplicate-submission guard: block re-uploading the same document type for
  // this employee within the last minute, before spending time on the blob
  // upload itself (the slow part a user is most likely to get impatient with).
  const [recentUpload] = await sequelize.query<{ document_id: string }>(
    `SELECT document_id FROM crm_hr_employee_documents
     WHERE employee_id = :employeeId AND document_type = :documentType AND deleted_at IS NULL
       AND created_at >= (NOW() - INTERVAL 60 SECOND)
     LIMIT 1`,
    { replacements: { employeeId: id, documentType }, type: QueryTypes.SELECT }
  );
  if (recentUpload) {
    return NextResponse.json({ error: 'This document type was already uploaded a moment ago.' }, { status: 409 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await put(`hr-employee-documents/${id}/${Date.now()}_${safeName}`, file, { access: 'public', addRandomSuffix: true });

  const documentId = crypto.randomUUID();
  await sequelize.query(
    `INSERT INTO crm_hr_employee_documents (document_id, employee_id, document_type, document_url, expiry_date, notes)
     VALUES (:documentId, :employeeId, :documentType, :documentUrl, :expiryDate, :notes)`,
    {
      replacements: {
        documentId,
        employeeId: id,
        documentType,
        documentUrl: blob.url,
        expiryDate: formData.get('expiry_date') ? String(formData.get('expiry_date')) : null,
        notes: formData.get('notes') ? String(formData.get('notes')) : null,
      },
    }
  );

  return NextResponse.json({ document_id: documentId, document_url: blob.url }, { status: 201 });
}
