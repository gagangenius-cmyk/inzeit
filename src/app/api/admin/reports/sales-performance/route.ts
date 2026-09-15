import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveSalesReportScope } from '@/app/api/admin/accounts/sales-report/route';
import { getMonthlyTrend, getBranchPerformance, getCounselorPerformance, getLeadStatusBreakdown, getLeadSourceBreakdown, getSourcePerformance } from '@/lib/salesPerformanceData';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage', 'sales.view', 'reports.view']);
  if (isAuthError(auth)) return auth;

  const scope = resolveSalesReportScope(auth);
  if (!scope) {
    return NextResponse.json({ error: 'You do not have access to the sales performance report' }, { status: 403 });
  }

  try {
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const months = Math.min(12, Math.max(3, parseInt(searchParams.get('months') || '3', 10) || 3));

    // Requested filters, then clamped by the resolved scope — same
    // server-is-authoritative rule as the transaction-level sales report.
    let branchId = Number(searchParams.get('branchId') || '') || null;
    let counselorId = Number(searchParams.get('counselorId') || '') || null;
    if (scope.kind === 'branch') branchId = scope.branchId;
    if (scope.kind === 'self') { counselorId = scope.counselorId; branchId = null; }

    // Dropdown options, scoped the same way as the data itself (a Branch
    // Manager only ever sees their own branch's counselor list, etc.) —
    // mirrors /api/admin/accounts/sales-report's filter-options handling.
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

    const [trend, branchList, counselorList, leadStatusBreakdown, leadSourceBreakdown, sourcePerformance] = await Promise.all([
      getMonthlyTrend({ branchId, counselorId, months }),
      branchListPromise,
      counselorListPromise,
      getLeadStatusBreakdown({ branchId, counselorId, months }),
      getLeadSourceBreakdown({ branchId, counselorId, months }),
      getSourcePerformance({ branchId, counselorId, months }),
    ]);

    // Branch/counselor breakdown tables are a company/branch-wide view — a
    // Counsellor scoped to "self" only sees their own trend numbers above,
    // not other people's breakdown rows.
    const [branchPerformance, counselorPerformance] = scope.kind === 'self'
      ? [[], []]
      : await Promise.all([
          scope.kind === 'full' && !branchId ? getBranchPerformance({ months }) : Promise.resolve([]),
          getCounselorPerformance({ months, branchId }),
        ]);

    const thisMonth = trend[trend.length - 1] || null;
    const lastMonth = trend[trend.length - 2] || null;
    const pctChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : (curr > 0 ? 100 : 0));

    const momComparison = thisMonth && lastMonth ? {
      thisMonth,
      lastMonth,
      salesChangePct: pctChange(thisMonth.revenueAed, lastMonth.revenueAed),
      leadsChangePct: pctChange(thisMonth.leadsCount, lastMonth.leadsCount),
      wonChangePct: pctChange(thisMonth.wonCount, lastMonth.wonCount),
      avgSaleChangePct: pctChange(thisMonth.avgSaleAed, lastMonth.avgSaleAed),
      conversionChangePts: Math.round((thisMonth.conversionRate - lastMonth.conversionRate) * 10) / 10,
    } : null;

    return NextResponse.json({
      scope: scope.kind,
      currency: 'AED',
      trend,
      momComparison,
      branchPerformance,
      counselorPerformance,
      leadStatusBreakdown,
      leadSourceBreakdown,
      sourcePerformance,
      appliedFilters: { branchId, counselorId, months },
      filters: {
        branches: branchList.map((b) => ({ id: b.id, name: b.name })),
        counselors: counselorList.map((c) => ({ id: c.id, name: c.name })),
      },
    });
  } catch (error) {
    console.error('[sales-performance] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}
