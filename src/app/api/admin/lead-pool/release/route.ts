import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, canViewAllBranches } from '@/lib/roleChecks';
import { releaseToPool } from '@/lib/leadPool';
import { captureError } from '@/lib/errorTracking';
import { logDataAccess } from '@/lib/dataAccessAudit';

// Manager-only: pulls an already-owned lead back into the shared pool (e.g.
// an overloaded or underperforming agent). Gated the same way the admin
// bulk-transfer tool's "branch_manager"/"admin" categories are
// (src/app/api/admin/lead-pool/route.ts), via the shared role-check helpers
// rather than that route's own ad-hoc roleCat() so both stay consistent.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.update']);
  if (isAuthError(auth)) return auth;

  if (!isBranchManagerOrCeo(auth)) {
    return NextResponse.json({ error: 'Only a branch manager or above can release a lead to the pool' }, { status: 403 });
  }

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
        return NextResponse.json({ error: 'You can only release leads in your own branch' }, { status: 403 });
      }
    }

    const result = await releaseToPool({ leadId: id, actorId: auth.id, actorRole: auth.roleName || auth.type });
    if (!result.success) {
      const status = result.reason === 'not_found' ? 404 : 400;
      const message = result.reason === 'not_found' ? 'Lead not found' : 'This lead is already unassigned';
      return NextResponse.json({ error: message }, { status });
    }

    void logDataAccess({ userId: auth.id, entityType: 'lead', entityId: id, action: 'release_to_pool' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to release lead to pool:', error);
    captureError(error, { route: 'POST /api/admin/lead-pool/release' });
    return NextResponse.json({ error: 'Failed to release lead to pool' }, { status: 500 });
  }
}
