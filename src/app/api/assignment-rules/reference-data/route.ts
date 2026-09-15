import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

// One-shot bundle of everything the Assignment Rules admin UI needs to
// populate its condition builder (branches, sources) and queue picker
// (active employees with their branch, for at-a-glance queue composition) -
// self-contained under the same 'transfers.manage' gate as the rest of this
// feature, rather than depending on branches.manage/employees.manage too.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const [branches, sources, employees] = await Promise.all([
      sequelize.query('SELECT id, name, abbrv FROM crm_branch WHERE status = 1 ORDER BY name ASC', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT id, name FROM crm_source WHERE status = 1 ORDER BY name ASC', { type: QueryTypes.SELECT }),
      sequelize.query(
        `SELECT e.id, e.name, e.branch, b.name AS branchName
         FROM crm_employee e
         LEFT JOIN crm_branch b ON b.id = e.branch
         WHERE e.status = 1
         ORDER BY e.name ASC`,
        { type: QueryTypes.SELECT }
      ),
    ]);
    return NextResponse.json({ success: true, branches, sources, employees });
  } catch (error) {
    console.error('Error fetching assignment-rule reference data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reference data' }, { status: 500 });
  }
}
