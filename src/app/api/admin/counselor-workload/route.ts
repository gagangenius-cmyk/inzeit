import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isFoeOrCeo, isCounsellor } from '@/lib/roleChecks';

// crm_employee has no per-counselor quota column yet - this is the daily default
// the workload sidebar's progress bar is measured against until one exists.
// Week/month/all periods scale it up (7x/30x/30x) as a rough approximation
// rather than comparing a week's (or all-time's) worth of leads against one
// day's capacity - 'all' reuses the month multiplier for lack of a better number.
const DAILY_CAPACITY = 20;
const CAPACITY_MULTIPLIER: Record<string, number> = { today: 1, yesterday: 1, week: 7, month: 30, all: 30 };

const LEAD_DATE_COL = 'COALESCE(l.created, l.regdate)';

// Fixed, whitelisted SQL fragments only - `period` never reaches the query
// string directly, so this can't be used for injection regardless of input.
function periodCondition(period: string): string {
  switch (period) {
    case 'today': return `DATE(${LEAD_DATE_COL}) = CURDATE()`;
    case 'yesterday': return `DATE(${LEAD_DATE_COL}) = CURDATE() - INTERVAL 1 DAY`;
    case 'week': return `YEARWEEK(${LEAD_DATE_COL}, 1) = YEARWEEK(CURDATE(), 1)`;
    case 'month': return `YEAR(${LEAD_DATE_COL}) = YEAR(CURDATE()) AND MONTH(${LEAD_DATE_COL}) = MONTH(CURDATE())`;
    default: return '1=1';
  }
}

// Backs the FOE/CEO "Counselor Workload" sidebar - FOE gets branch-scoped
// counts (mirrors roleCat() in /api/admin/lead-pool), CEO sees every branch.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const user = auth;

  if (!isFoeOrCeo(user)) {
    return NextResponse.json({ error: 'You do not have permission to view this' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || 'all';
    const period = ['today', 'yesterday', 'week', 'month'].includes(periodParam) ? periodParam : 'all';
    const leadPeriodClause = periodCondition(period);
    const capacity = DAILY_CAPACITY * (CAPACITY_MULTIPLIER[period] || 30);

    const branchScoped = !isCeo(user);
    const userBranch = Number(user.branch || 0);
    const applyBranchFilter = branchScoped && userBranch > 0;

    const replacements: Record<string, unknown> = applyBranchFilter ? { userBranch } : {};

    // The period filter lives in the LEFT JOIN's ON clause, not WHERE - so a
    // counselor with zero leads in the selected period still shows up (at 0)
    // instead of being dropped by the join.
    const counselorRows = await sequelize.query<{
      id: number; name: string; branchName: string;
      roleName: string | null; roleType: string | null; assignedLeads: number;
    }>(
      `SELECT e.id, e.name, COALESCE(b.branch,'') AS branchName,
        r.name AS roleName, r.type AS roleType,
        COUNT(DISTINCT l.id) AS assignedLeads
      FROM crm_employee e
      LEFT JOIN crm_branch b ON e.branch = b.id
      LEFT JOIN crm_role r ON r.id = e.role
      LEFT JOIN crm_forum_leads l ON (l.assignTo = e.id OR l.Counsilor = e.id) AND ${leadPeriodClause}
      WHERE e.status = 1 ${applyBranchFilter ? 'AND e.branch = :userBranch' : ''}
      GROUP BY e.id, e.name, b.branch, r.name, r.type
      ORDER BY assignedLeads DESC, e.name ASC
      LIMIT 300`,
      { replacements, type: QueryTypes.SELECT }
    );

    const counselors = counselorRows
      .filter((row) => isCounsellor({ roleName: row.roleName, type: row.roleType }))
      .map((row) => ({
        id: String(row.id),
        name: row.name,
        branch: row.branchName,
        assignedLeads: Number(row.assignedLeads || 0),
        capacity,
      }));

    const [unassignedRow] = await sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM crm_forum_leads l
       WHERE (l.assignTo IS NULL OR l.assignTo = 0)
         AND ${leadPeriodClause}
         ${applyBranchFilter ? 'AND l.branch = :userBranch' : ''}`,
      { replacements, type: QueryTypes.SELECT }
    );

    return NextResponse.json({
      period,
      counselors,
      unassignedLeads: Number(unassignedRow?.total || 0),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Counselor workload GET error:', msg);
    return NextResponse.json({ error: 'Failed to load counselor workload', details: msg }, { status: 500 });
  }
}
