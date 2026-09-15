import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { invalidRequest } from '@/lib/apiError';

const REVIEW_STATUSES = new Set(['Approved', 'Rejected', 'Resubmit Requested']);

// Case officers review, from inside the ops wizard, the exact same
// crm_client_documents rows the client uploads to via their portal checklist
// (see /api/clientportal/upload) - the client-portal document-upload page
// already reads status/review_note off this table, so updating a row here is
// all that's needed for the client to see the outcome; no separate sync step.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const leadId = Number.parseInt(searchParams.get('leadId') || '', 10);
    if (!leadId) return invalidRequest('A valid leadId is required');
    const opportunityId = searchParams.get('opportunityId') ? Number.parseInt(searchParams.get('opportunityId')!, 10) : null;

    const documents = await sequelize.query(
      `SELECT document_id, lead_id, opportunity_id, checklist_key, document_label, mandatory,
              accepted_formats, file_url, file_name, status, reviewer_id, review_note,
              uploaded_at, reviewed_at
       FROM crm_client_documents
       WHERE lead_id = :leadId ${opportunityId ? 'AND (opportunity_id IS NULL OR opportunity_id = :opportunityId)' : ''}
       ORDER BY checklist_key ASC`,
      { replacements: { leadId, opportunityId }, type: QueryTypes.SELECT },
    );

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('Failed to load client documents for review:', error);
    return NextResponse.json({ success: false, error: 'Failed to load client documents' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const documentId = String(body.documentId || '');
    const status = String(body.status || '');
    const reviewNote = body.reviewNote != null ? String(body.reviewNote) : null;

    if (!documentId || !REVIEW_STATUSES.has(status)) {
      return invalidRequest(`documentId is required and status must be one of: ${Array.from(REVIEW_STATUSES).join(', ')}`);
    }

    const [existing] = await sequelize.query<{ document_id: string; file_url: string | null }>(
      `SELECT document_id, file_url FROM crm_client_documents WHERE document_id = :documentId LIMIT 1`,
      { replacements: { documentId }, type: QueryTypes.SELECT },
    );
    if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    if (!existing.file_url) return invalidRequest('This document has not been uploaded by the client yet');

    await sequelize.query(
      `UPDATE crm_client_documents
       SET status = :status, reviewer_id = :reviewerId, review_note = :reviewNote, reviewed_at = NOW()
       WHERE document_id = :documentId`,
      { replacements: { documentId, status, reviewerId: String(auth.id), reviewNote } },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to review client document:', error);
    return NextResponse.json({ success: false, error: 'Failed to review client document' }, { status: 500 });
  }
}
