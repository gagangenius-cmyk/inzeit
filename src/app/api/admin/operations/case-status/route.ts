import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { logLeadRemark } from '@/lib/leadRemarks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

const VALID_STATUSES = ['Active', 'Closed', 'Refund', 'On Hold', 'Visa Approved'] as const;

// GET the operations-relevant opportunities (cases) for a lead, with their
// current operations_status - one lead can run several products in parallel.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.case_status_manage']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const { searchParams } = new URL(request.url);
  const leadId = Number(searchParams.get('leadId'));
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

  const rows = await sequelize.query(
    `SELECT o.id, o.opportunityName, o.serviceType, o.operations_status AS operationsStatus,
            o.operations_status_updated_at AS operationsStatusUpdatedAt, e.name AS operationsStatusUpdatedByName
     FROM crm_opportunities o
     LEFT JOIN crm_employee e ON e.id = o.operations_status_updated_by
     WHERE o.leadId = :leadId
     ORDER BY o.id DESC`,
    { replacements: { leadId }, type: QueryTypes.SELECT }
  );

  return NextResponse.json({ cases: rows });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['operations.case_status_manage']);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const body = await request.json().catch(() => ({}));
  const opportunityId = Number(body.opportunityId);
  const status = body.status;

  if (!opportunityId) return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  const [opportunity] = await sequelize.query<{ leadId: number; operations_status: string; opportunityName: string }>(
    `SELECT leadId, operations_status, opportunityName FROM crm_opportunities WHERE id = :opportunityId LIMIT 1`,
    { replacements: { opportunityId }, type: QueryTypes.SELECT }
  );
  if (!opportunity) return NextResponse.json({ error: 'Case (opportunity) not found' }, { status: 404 });

  await sequelize.query(
    `UPDATE crm_opportunities
     SET operations_status = :status, operations_status_updated_by = :userId, operations_status_updated_at = NOW()
     WHERE id = :opportunityId`,
    { replacements: { status, userId: auth.id, opportunityId } }
  );

  await logLeadRemark({
    leadId: opportunity.leadId,
    action: 'operations_case_status_changed',
    remark: `${opportunity.opportunityName || `Case #${opportunityId}`} status changed from ${opportunity.operations_status} to ${status}`,
    previousValue: opportunity.operations_status,
    newValue: status,
    actorId: auth.id,
    actorRole: auth.roleName,
  });

  return NextResponse.json({ success: true });
}
