import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isBranchManagerOrCeo, isFinanceOrAccounts, isCounsellor } from '@/lib/roleChecks';
import { getSalesReportData } from '@/lib/salesReportData';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

type Scope =
  | { kind: 'full' }
  | { kind: 'branch'; branchId: number }
  | { kind: 'self'; counselorId: number };

// Server-side is authoritative: a Branch Manager or Counsellor's own
// branch/id always wins over whatever the client sends, so scope can't be
// widened by tampering with query params.
export function resolveSalesReportScope(user: any): Scope | null {
  if (user.permissions?.includes('all') || isCeo(user) || isFinanceOrAccounts(user)) {
    return { kind: 'full' };
  }
  if (isBranchManagerOrCeo(user)) {
    if (!user.branch) return null;
    return { kind: 'branch', branchId: Number(user.branch) };
  }
  if (isCounsellor(user)) {
    return { kind: 'self', counselorId: Number(user.id) };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage', 'sales.view']);
  if (isAuthError(auth)) return auth;

  const scope = resolveSalesReportScope(auth);
  if (!scope) {
    return NextResponse.json({ error: 'You do not have access to the sales report' }, { status: 403 });
  }

  try {
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    // Requested filters, then clamped by the resolved scope below.
    let branchId = Number(searchParams.get('branchId') || '') || null;
    let counselorId = Number(searchParams.get('counselorId') || '') || null;

    if (scope.kind === 'branch') branchId = scope.branchId;
    if (scope.kind === 'self') { counselorId = scope.counselorId; branchId = null; }

    // Dropdown options, scoped the same way as the report data itself so a
    // Branch Manager only ever sees their own branch's counselors, etc.
    // Exposed here (rather than via a separate /api/admin/counselors call)
    // because that endpoint requires counselors.manage, which Accountant/CEO
    // don't necessarily hold.
    const branchListPromise = scope.kind === 'full'
      ? sequelize.query<{ id: number; name: string }>(
          `SELECT id, branch AS name FROM crm_branch WHERE status = 1 ORDER BY branch ASC`,
          { type: QueryTypes.SELECT }
        )
      : Promise.resolve([]);

    const counselorListPromise = scope.kind === 'self'
      ? Promise.resolve([])
      : sequelize.query<{ id: number; name: string }>(
          `SELECT id, name FROM crm_employee WHERE status = 1 ${branchId ? 'AND branch = :branchId' : ''} ORDER BY name ASC`,
          { replacements: branchId ? { branchId } : {}, type: QueryTypes.SELECT }
        );

    const [report, branchList, counselorList] = await Promise.all([
      getSalesReportData({ dateFrom, dateTo, branchId, counselorId, search, page, limit }),
      branchListPromise,
      counselorListPromise,
    ]);

    return NextResponse.json({
      scope: scope.kind,
      currency: 'AED',
      summary: report.summary,
      data: report.data,
      pagination: { page, limit, total: report.total, totalPages: Math.ceil(report.total / limit) || 1 },
      filters: {
        branches: branchList.map((b) => ({ id: b.id, name: b.name })),
        counselors: counselorList.map((c) => ({ id: c.id, name: c.name })),
      },
    });
  } catch (error: any) {
    console.error('[sales-report] error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
