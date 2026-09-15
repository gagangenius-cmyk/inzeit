import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

/**
 * Full history of "Counselor Conversation Summary" entries recorded during
 * lead-to-opportunity conversion and case-note updates. Queried by leadId
 * (always populated) rather than opportunityId (nullable), so this works
 * from every page that only has the lead id on hand (Client list, Operations
 * list) as well as ones that have the opportunity id (Lead/Opportunity list).
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  await ensureDB();

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const opportunityId = searchParams.get('opportunityId');

  if (!leadId && !opportunityId) {
    return NextResponse.json({ error: 'leadId or opportunityId is required' }, { status: 400 });
  }

  // No permission string is required above (any authenticated user), so
  // ownership must be checked explicitly here: CEO sees any lead's notes,
  // Branch Manager their own branch, everyone else only leads they own.
  if (!isCeo(auth)) {
    const [accessRow] = await sequelize.query<{ branch: number | null; assignTo: number | null; counsilor: number | null }>(
      `SELECT COALESCE(l.branch, o.branchId) AS branch, l.assignTo, l.Counsilor AS counsilor
       FROM crm_forum_leads l
       LEFT JOIN crm_opportunities o ON o.id = :opportunityId
       WHERE l.id = COALESCE(:leadId, o.leadId)
       LIMIT 1`,
      { replacements: { leadId: leadId ? Number(leadId) : null, opportunityId: opportunityId ? Number(opportunityId) : null }, type: QueryTypes.SELECT },
    );
    if (accessRow) {
      if (isBranchManagerOrCeo(auth)) {
        if (accessRow.branch !== null && Number(accessRow.branch) !== Number(auth.branch || 0)) {
          return NextResponse.json({ error: 'You do not have permission to view these notes' }, { status: 403 });
        }
      } else {
        const owns = Number(accessRow.assignTo || 0) === Number(auth.id) || Number(accessRow.counsilor || 0) === Number(auth.id);
        if (!owns) {
          return NextResponse.json({ error: 'You do not have permission to view these notes' }, { status: 403 });
        }
      }
    }
  }

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};
  if (leadId) { conditions.push('n.lead_id = :leadId'); replacements.leadId = Number(leadId); }
  if (opportunityId) { conditions.push('n.opportunity_id = :opportunityId'); replacements.opportunityId = Number(opportunityId); }

  const rows = await sequelize.query<any>(
    `SELECT
       n.id, n.lead_id, n.opportunity_id, n.counselor_id,
       n.conversation_summary, n.client_commitments, n.next_action, n.created_at,
       e.name AS counselorName
     FROM crm_opportunity_handover_notes n
     LEFT JOIN crm_employee e ON e.id = n.counselor_id
     WHERE ${conditions.join(' OR ')}
     ORDER BY n.created_at DESC`,
    { replacements, type: QueryTypes.SELECT }
  );

  return NextResponse.json({ data: rows });
}
