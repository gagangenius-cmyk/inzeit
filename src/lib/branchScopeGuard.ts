import { NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

type ScopeActor = {
  id: number;
  branch?: string | number | null;
  roleName?: string | null;
  type?: string | null;
};

/**
 * Branch Manager may only write to a client/lead in their own branch; CEO
 * (and every other role - e.g. a counselor editing their own lead) is
 * unaffected. Returns a ready-to-return 403 NextResponse if the write should
 * be blocked, or null if it may proceed. Callers with the lead row already
 * in hand (e.g. PUT /api/leads/[id]) should compare branches inline instead
 * of calling this - it exists for callers (like the client-portal action
 * routes) that only have a leadId and would otherwise need a fresh query.
 */
export async function checkLeadBranchScope(auth: ScopeActor, leadId: number): Promise<NextResponse | null> {
  if (!isBranchManagerOrCeo(auth) || isCeo(auth)) return null;

  const [row] = await sequelize.query<{ branch: number | null }>(
    'SELECT branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  if (row && Number(row.branch) !== Number(auth.branch || 0)) {
    return NextResponse.json({ error: 'You can only update clients in your own branch' }, { status: 403 });
  }
  return null;
}
