import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

// Narrow, read-only employee picker for the operations-rights panels (case
// transfer / access control target selection). Deliberately separate from
// /api/admin/employees, which requires the much broader employees.manage
// permission - Operations Managers shouldn't need full employee-CRUD access
// just to pick a transfer target.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, [
    'operations.case_transfer',
    'operations.task_reassign',
    'operations.access_control',
    'operations.manage',
    'operations.view',
    'operations.assign_activities',
  ]);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('search') || '').trim();
  if (search.length < 2) return NextResponse.json({ employees: [] });

  // Optional designation filter (e.g. "Case Officer,Team Leader") — narrows
  // results to employees whose role name matches one of the given
  // designations exactly. Used by the case-transfer picker so an assigner
  // can restrict the search to a specific designation before picking a
  // person; omitted entirely, behaviour is unchanged (search all roles).
  const rolesParam = (searchParams.get('roles') || '').trim();
  const roles = rolesParam ? rolesParam.split(',').map((r) => r.trim()).filter(Boolean) : [];

  const replacements: Record<string, unknown> = { search: `%${search}%` };
  let roleFilter = '';
  if (roles.length > 0) {
    roleFilter = ' AND LOWER(r.name) IN (:roles)';
    replacements.roles = roles.map((r) => r.toLowerCase());
  }

  const rows = await sequelize.query(
    `SELECT e.id, e.name, e.email, e.status, r.name AS roleName, d.name AS departmentName
     FROM crm_employee e
     LEFT JOIN crm_role r ON r.id = e.role
     LEFT JOIN crm_department d ON d.id = e.department
     WHERE (e.name LIKE :search OR e.email LIKE :search)${roleFilter}
     ORDER BY e.name ASC
     LIMIT 15`,
    { replacements, type: QueryTypes.SELECT }
  );

  return NextResponse.json({ employees: rows });
}
