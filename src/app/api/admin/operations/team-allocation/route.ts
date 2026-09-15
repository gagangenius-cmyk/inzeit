import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

// The operations case-management tier this page manages — kept as an
// explicit type list (not a free role picker) so this narrowly-scoped
// endpoint can never be used to reassign branch/region for employees outside
// this tier (e.g. Directors, HR, Finance) even by someone who only holds
// operations.team_allocation rather than the much broader employees.manage.
const ALLOCATABLE_ROLE_TYPES = [
  'process_coordinator',
  'team_leader',
  'cpo',
  'assistant_branch_manager',
  'sr_branch_coordinator',
];

const REQUIRED_PERMISSIONS = ['operations.team_allocation', 'operations.manage', 'employees.manage'];

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, REQUIRED_PERMISSIONS);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const roleType = searchParams.get('roleType') || '';
    const branch = searchParams.get('branch') || '';
    const region = searchParams.get('region') || '';
    const status = searchParams.get('status') || '';

    const conditions: string[] = ['r.type IN (:roleTypes)'];
    const replacements: Record<string, unknown> = { roleTypes: ALLOCATABLE_ROLE_TYPES };

    if (search) {
      conditions.push('(e.name LIKE :search OR e.email LIKE :search OR e.mobile LIKE :search)');
      replacements.search = `%${search}%`;
    }
    if (roleType) {
      conditions.push('r.type = :roleType');
      replacements.roleType = roleType;
    }
    if (branch) {
      conditions.push('e.branch = :branch');
      replacements.branch = Number(branch);
    }
    if (region) {
      conditions.push('e.region = :region');
      replacements.region = Number(region);
    }
    if (status === 'active') conditions.push('e.status = 1');
    else if (status === 'inactive') conditions.push('e.status != 1');

    const where = `WHERE ${conditions.join(' AND ')}`;

    const employees = await sequelize.query(
      `SELECT e.id, e.name, COALESCE(e.email,'') AS email, COALESCE(e.mobile,'') AS mobile,
              e.role, r.name AS roleName, r.type AS roleType,
              e.branch, b.branch AS branchName,
              e.region, rg.name AS regionName,
              e.status
       FROM crm_employee e
       INNER JOIN crm_role r ON r.id = e.role
       LEFT JOIN crm_branch b ON b.id = e.branch
       LEFT JOIN crm_region rg ON rg.id = e.region
       ${where}
       ORDER BY e.name ASC`,
      { replacements, type: QueryTypes.SELECT }
    );

    // Filter option lists — kept scoped to this endpoint (rather than making
    // the page depend on /api/admin/branches, which requires the much
    // broader branches.manage) so a Team Leader-tier permission is enough to
    // load the whole page.
    const [roles, branches, regions] = await Promise.all([
      sequelize.query(
        `SELECT id, name, type FROM crm_role WHERE type IN (:roleTypes) ORDER BY name ASC`,
        { replacements: { roleTypes: ALLOCATABLE_ROLE_TYPES }, type: QueryTypes.SELECT }
      ),
      sequelize.query(`SELECT id, branch AS name FROM crm_branch ORDER BY branch ASC`, { type: QueryTypes.SELECT }),
      sequelize.query(`SELECT id, name FROM crm_region ORDER BY name ASC`, { type: QueryTypes.SELECT }),
    ]);

    return NextResponse.json({ data: employees, filters: { roles, branches, regions } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching team allocation list:', message);
    return NextResponse.json({ error: 'Failed to fetch team allocation list' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, REQUIRED_PERMISSIONS);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const body = await request.json().catch(() => ({}));
    const employeeIds = Array.isArray(body.employeeIds)
      ? body.employeeIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];
    const hasBranch = body.branch !== undefined && body.branch !== null && body.branch !== '';
    const hasRegion = body.region !== undefined && body.region !== null && body.region !== '';

    if (!employeeIds.length) {
      return NextResponse.json({ error: 'employeeIds is required' }, { status: 400 });
    }
    if (!hasBranch && !hasRegion) {
      return NextResponse.json({ error: 'branch or region is required' }, { status: 400 });
    }

    // Scope guard: only ever touch employees who actually hold one of the
    // allocatable operations roles, regardless of what ids were posted.
    const eligible = await sequelize.query<{ id: number }>(
      `SELECT e.id FROM crm_employee e
       INNER JOIN crm_role r ON r.id = e.role
       WHERE e.id IN (:employeeIds) AND r.type IN (:roleTypes)`,
      { replacements: { employeeIds, roleTypes: ALLOCATABLE_ROLE_TYPES }, type: QueryTypes.SELECT }
    );
    const eligibleIds = eligible.map((row) => row.id);
    if (!eligibleIds.length) {
      return NextResponse.json({ error: 'None of the selected employees are in an allocatable operations role' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const replacements: Record<string, unknown> = { employeeIds: eligibleIds };
    if (hasBranch) { setClauses.push('branch = :branch'); replacements.branch = Number(body.branch); }
    if (hasRegion) { setClauses.push('region = :region'); replacements.region = Number(body.region); }

    await sequelize.query(
      `UPDATE crm_employee SET ${setClauses.join(', ')} WHERE id IN (:employeeIds)`,
      { replacements }
    );

    return NextResponse.json({ success: true, updated: eligibleIds.length, skipped: employeeIds.length - eligibleIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating team allocation:', message);
    return NextResponse.json({ error: 'Failed to update team allocation' }, { status: 500 });
  }
}
