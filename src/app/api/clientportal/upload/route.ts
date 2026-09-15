import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { ClientPortalService } from '@/services/client-portal-service';

export async function POST(request: NextRequest) {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return client;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const opportunityId = Number(formData.get('opportunityId'));
    const checklistKey = String(formData.get('checklistKey') || '');

    if (!file || !opportunityId || !checklistKey) {
      return NextResponse.json({ error: 'file, opportunityId, and checklistKey are required' }, { status: 400 });
    }

    await ClientPortalService.getChecklist(client.leadId);

    // Only checklist rows seeded from verified/won services can receive uploads.
    const [document] = await sequelize.query<{ document_id: string }>(
      `SELECT document_id
       FROM crm_client_documents
       WHERE lead_id = :leadId AND opportunity_id = :opportunityId AND checklist_key = :checklistKey
       LIMIT 1`,
      { replacements: { opportunityId, checklistKey, leadId: client.leadId }, type: QueryTypes.SELECT }
    );
    if (!document) {
      return NextResponse.json({ error: 'That document is not part of your verified checklist' }, { status: 403 });
    }

    // recordUpload() below UPDATEs a fixed checklist row rather than
    // inserting, so a resubmit can't create a duplicate row - but it would
    // still waste a redundant blob upload on a double-click, so short-circuit
    // that here instead.
    const [justUploaded] = await sequelize.query<{ document_id: string }>(
      `SELECT document_id FROM crm_client_documents
       WHERE lead_id = :leadId AND opportunity_id = :opportunityId AND checklist_key = :checklistKey
         AND uploaded_at >= (NOW() - INTERVAL 60 SECOND)
       LIMIT 1`,
      { replacements: { opportunityId, checklistKey, leadId: client.leadId }, type: QueryTypes.SELECT }
    );
    if (justUploaded) {
      return NextResponse.json({ error: 'This file was already uploaded a moment ago.' }, { status: 409 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`client-portal-documents/${client.leadId}/${checklistKey}/${Date.now()}_${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    const result = await ClientPortalService.recordUpload({
      leadId: client.leadId,
      opportunityId,
      checklistKey,
      fileUrl: blob.url,
      fileName: file.name,
    });

    return NextResponse.json({ document: result[0] || null }, { status: 201 });
  } catch (error) {
    console.error('Client portal upload error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
