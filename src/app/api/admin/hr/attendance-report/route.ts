import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveModuleRoleKey } from '@/lib/modulePermissions';

const companyWideRoleKeys = ['super_admin', 'director', 'founder', 'hr', 'finance'];

// Branch/department-wise attendance visibility for Branch Manager, CEO, Accounts,
// and HR. Branch Manager is always scoped to their own branch server-side -
// the branch filter in the query string is ignored for that role.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.reports.attendance']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().slice(0, 10);
    const dateFrom = searchParams.get('date_from') || today;
    const dateTo = searchParams.get('date_to') || today;

    const roleKey = resolveModuleRoleKey({
      roleId: typeof auth.role === 'number' ? auth.role : Number(auth.role) || undefined,
      roleName: auth.roleName,
      roleType: auth.type,
    });

    const isCompanyWide = companyWideRoleKeys.includes(roleKey);
    const branchId = isCompanyWide
      ? (searchParams.get('branch_id') ? Number(searchParams.get('branch_id')) : null)
      : (auth.branch || null);
    const departmentId = searchParams.get('department_id') ? Number(searchParams.get('department_id')) : null;

    const report = await HRService.getAttendanceReport({ branchId, departmentId, dateFrom, dateTo });

    return NextResponse.json({ ...report, scope: isCompanyWide ? 'company' : 'branch', date_from: dateFrom, date_to: dateTo });
  } catch (error) {
    console.error('Failed to fetch attendance report:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance report' }, { status: 500 });
  }
}
