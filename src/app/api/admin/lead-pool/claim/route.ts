import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { canViewAllBranches } from '@/lib/roleChecks';
import { claimLead } from '@/lib/leadPool';
import { captureError } from '@/lib/errorTracking';

// Self-serve claim: any authenticated employee with lead-edit rights can
// grab an unassigned lead in their own branch for themselves. Deliberately
// narrower than the general "assign leads" capability gated to managers
// elsewhere (LeadManagement.tsx's canAssignLeads) — this route can only ever
// assign a lead to the caller, never to anyone else, so it's safe to open to
// every agent without handing out broader reassignment rights.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.update']);
  if (isAuthError(auth)) return auth;

  try {
    const { leadId } = await request.json();
    const id = Number(leadId);
    if (!id) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

    if (!canViewAllBranches(auth)) {
      const [lead] = await sequelize.query<{ branch: number | null }>(
        `SELECT branch FROM crm_forum_leads WHERE id = :id LIMIT 1`,
        { replacements: { id }, type: QueryTypes.SELECT },
      );
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      if (Number(lead.branch) !== Number(auth.branch || 0)) {
        return NextResponse.json({ error: 'You can only claim leads in your own branch' }, { status: 403 });
      }
    }

    const result = await claimLead({ leadId: id, employeeId: auth.id, actorRole: auth.roleName || auth.type });
    if (!result.success) {
      const status = result.reason === 'not_found' ? 404 : 409;
      const message = result.reason === 'not_found' ? 'Lead not found' : 'This lead was just claimed by someone else';
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ success: true, leadName: result.leadName });
  } catch (error) {
    console.error('Failed to claim lead:', error);
    captureError(error, { route: 'POST /api/admin/lead-pool/claim' });
    return NextResponse.json({ error: 'Failed to claim lead' }, { status: 500 });
  }
}
