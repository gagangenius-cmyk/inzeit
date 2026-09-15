import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

type RouteContext = { params: Promise<{ id: string }> };
const DOC_STATUSES = ['pending', 'submitted', 'approved', 'rejected'];

// Upsert-by-(entry_id, document_type): calling this again for the same
// document_type updates its status/file rather than creating a duplicate
// checklist row, mirroring the find-then-update pattern used by the
// operations stage-data save route.
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;
    await ensureDB();

    const { id } = await context.params;
    const entryId = Number.parseInt(id, 10);
    if (!entryId) return NextResponse.json({ success: false, error: 'Invalid entry id' }, { status: 400 });

    const body = await request.json();
    const documentType = String(body.document_type || body.documentType || '').trim();
    if (!documentType) return NextResponse.json({ success: false, error: 'document_type is required' }, { status: 400 });
    const status = DOC_STATUSES.includes(body.status) ? body.status : 'pending';

    const [existing] = await sequelize.query<{ id: number }>(
      'SELECT id FROM crm_crm_entry_documents WHERE entry_id = :entryId AND document_type = :documentType LIMIT 1',
      { replacements: { entryId, documentType }, type: QueryTypes.SELECT },
    );

    if (existing) {
      await sequelize.query(
        'UPDATE crm_crm_entry_documents SET status = :status, file_url = :fileUrl, updated_at = NOW() WHERE id = :id',
        { replacements: { id: existing.id, status, fileUrl: body.file_url || body.fileUrl || null } },
      );
    } else {
      await sequelize.query(
        'INSERT INTO crm_crm_entry_documents (entry_id, document_type, status, file_url) VALUES (:entryId, :documentType, :status, :fileUrl)',
        { replacements: { entryId, documentType, status, fileUrl: body.file_url || body.fileUrl || null } },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to save CRM entry document:', error);
    return NextResponse.json({ success: false, error: 'Failed to save document' }, { status: 500 });
  }
}
