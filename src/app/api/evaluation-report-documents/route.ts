import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { CrmEvaluationReportDocuments } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';

// Confirms the lead belongs to the Hyderabad branch — server-side
// defense-in-depth so this endpoint can't be used to attach evaluation-report
// documents to a non-Hyderabad lead even by calling the API directly,
// bypassing the wizard's own client-side guard.
async function isHyderabadLead(leadId: number): Promise<boolean> {
  const [row] = await sequelize.query<{ abbrv: string | null }>(
    `SELECT b.abbrv FROM crm_forum_leads l LEFT JOIN crm_branch b ON b.id = l.branch WHERE l.id = :leadId LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  return String(row?.abbrv || '').trim().toUpperCase() === 'HYD';
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['documents.view']);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const leadId = Number(searchParams.get('leadId'));
  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const documents = await CrmEvaluationReportDocuments.findAll({
    where: { leadId },
    include: [
      { association: 'uploadedEmployee', attributes: ['id', 'name'] },
      { association: 'verifiedEmployee', attributes: ['id', 'name'] },
    ],
    order: [['uploadedAt', 'DESC']],
  });

  return NextResponse.json({ data: documents });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['documents.create']);
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const leadId = Number(body.leadId);
  const documentLabel = String(body.documentLabel || '').trim();
  const fileUrl = String(body.fileUrl || '').trim();
  const fileName = String(body.fileName || '').trim();

  if (!leadId || !documentLabel || !fileUrl || !fileName) {
    return NextResponse.json({ error: 'leadId, documentLabel, fileUrl, and fileName are required' }, { status: 400 });
  }

  if (!isCeo(auth) && !(await isHyderabadLead(leadId))) {
    return NextResponse.json({ error: 'This is only available for Hyderabad-branch leads' }, { status: 403 });
  }

  const document = await CrmEvaluationReportDocuments.create({
    leadId,
    documentLabel,
    fileUrl,
    fileName,
    uploadedBy: auth.id,
    status: 'uploaded',
  });

  return NextResponse.json(document, { status: 201 });
}
