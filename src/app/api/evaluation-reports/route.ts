import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { CrmEvaluationReports } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';

async function isHyderabadLead(leadId: number): Promise<boolean> {
  const [row] = await sequelize.query<{ abbrv: string | null }>(
    `SELECT b.abbrv FROM crm_forum_leads l LEFT JOIN crm_branch b ON b.id = l.branch WHERE l.id = :leadId LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  return String(row?.abbrv || '').trim().toUpperCase() === 'HYD';
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const leadId = Number(searchParams.get('leadId'));
  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const report = await CrmEvaluationReports.findOne({
    where: { leadId },
    order: [['generatedAt', 'DESC']],
  });

  return NextResponse.json({ data: report });
}

// Finalizes the Evaluation Report wizard: records what was generated and
// tags the lead's own status so counsellors can see at a glance this was
// done. Deliberately a small, purpose-built endpoint rather than going
// through the general-purpose PUT /api/leads/[id] (which carries unrelated
// field-level role gating not relevant here) — and deliberately only ever
// touches `status`/`status_date`, never `convet`/`opportunity_status`/
// `conversion_date`, so this stays fully outside the real
// lead-to-opportunity-to-client conversion pipeline.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['documents.create']);
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const leadId = Number(body.leadId);
  const eligibilitySummary = String(body.eligibilitySummary || '').trim();
  const feePaid = Number(body.feePaid);
  const discountApplied = Number(body.discountApplied || 0);
  const receiptNumber = body.receiptNumber ? String(body.receiptNumber).trim() : null;

  if (!leadId || !eligibilitySummary || !Number.isFinite(feePaid)) {
    return NextResponse.json({ error: 'leadId, eligibilitySummary, and feePaid are required' }, { status: 400 });
  }

  if (!isCeo(auth) && !(await isHyderabadLead(leadId))) {
    return NextResponse.json({ error: 'This is only available for Hyderabad-branch leads' }, { status: 403 });
  }

  const report = await CrmEvaluationReports.create({
    leadId,
    eligibilitySummary,
    feePaid,
    discountApplied,
    receiptNumber,
    generatedBy: auth.id,
  });

  await sequelize.query(
    `UPDATE crm_forum_leads SET status = 'evaluation_report_generated', status_date = NOW() WHERE id = :leadId`,
    { replacements: { leadId } },
  );

  return NextResponse.json(report, { status: 201 });
}
