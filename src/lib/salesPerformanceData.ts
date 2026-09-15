import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

export interface SalesPerformanceParams {
  branchId?: number | null;
  counselorId?: number | null;
  months?: number;
}

export interface MonthlyPoint {
  month: string;
  monthLabel: string;
  leadsCount: number;
  wonCount: number;
  revenueAed: number;
  avgSaleAed: number;
  conversionRate: number;
}

export interface BreakdownRow {
  label: string;
  count: number;
  percent: number;
}

export interface EntityPerformanceRow {
  id: number;
  name: string;
  branchId?: number | null;
  branchName?: string | null;
  branchManagerName?: string | null;
  leadsCount: number;
  wonCount: number;
  revenueAed: number;
  avgSaleAed: number;
  conversionRate: number;
}

const n = (v: unknown) => Number(v || 0);
const round2 = (v: number) => Math.round(v * 100) / 100;

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// AED-normalization joins, mirrored from src/lib/salesReportData.ts so both
// reports convert local-currency lead fees to AED the same way.
const REVENUE_JOIN = `
      LEFT JOIN crm_forum_leads l ON l.id = o.leadId
      LEFT JOIN crm_branch_exchange_rate_map bm ON bm.branch_id = o.branchId
      LEFT JOIN crm_exchange_rate er ON er.id = bm.exchange_rate_id AND er.status = 1`;
const REVENUE_EXPR = `COALESCE(SUM(COALESCE(l.payTotal,0) * COALESCE(er.rate_to_aed,1)), 0)`;

function deriveMonthly(
  leadsByMonth: Map<string, number>,
  wonByMonth: Map<string, { count: number; revenue: number }>,
  months: number,
): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const leadsCount = leadsByMonth.get(key) || 0;
    const won = wonByMonth.get(key) || { count: 0, revenue: 0 };
    points.push({
      month: key,
      monthLabel: monthLabel(key),
      leadsCount,
      wonCount: won.count,
      revenueAed: round2(won.revenue),
      avgSaleAed: won.count > 0 ? round2(won.revenue / won.count) : 0,
      conversionRate: leadsCount > 0 ? round2((won.count / leadsCount) * 100) : 0,
    });
  }
  return points;
}

/**
 * Company-wide (or branch/counselor-scoped) monthly sales trend: leads
 * created, won deals, AED revenue, avg sale value and conversion rate for
 * each of the last `months` calendar months (default 3).
 */
export async function getMonthlyTrend(params: SalesPerformanceParams): Promise<MonthlyPoint[]> {
  const months = Math.min(24, Math.max(1, params.months || 3));
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - (months - 1));
  const startDateStr = startDate.toISOString().slice(0, 10);

  const leadConditions = ['l.regdate >= :startDate'];
  const wonConditions = ["LOWER(COALESCE(o.status,'')) = 'won'", 'o.createdAt >= :startDate'];
  const replacements: Record<string, unknown> = { startDate: startDateStr };

  if (params.branchId) {
    leadConditions.push('l.branch = :branchId');
    wonConditions.push('o.branchId = :branchId');
    replacements.branchId = params.branchId;
  }
  if (params.counselorId) {
    leadConditions.push('l.Counsilor = :counselorId');
    wonConditions.push('o.assignedTo = :counselorId');
    replacements.counselorId = params.counselorId;
  }

  const [leadRows, wonRows] = await Promise.all([
    sequelize.query<{ month: string; leadsCount: number }>(
      `SELECT DATE_FORMAT(l.regdate, '%Y-%m') AS month, COUNT(*) AS leadsCount
       FROM crm_forum_leads l
       WHERE ${leadConditions.join(' AND ')}
       GROUP BY DATE_FORMAT(l.regdate, '%Y-%m')`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query<{ month: string; wonCount: number; revenueAed: number }>(
      `SELECT DATE_FORMAT(o.createdAt, '%Y-%m') AS month, COUNT(*) AS wonCount, ${REVENUE_EXPR} AS revenueAed
       FROM crm_opportunities o
       ${REVENUE_JOIN}
       WHERE ${wonConditions.join(' AND ')}
       GROUP BY DATE_FORMAT(o.createdAt, '%Y-%m')`,
      { replacements, type: QueryTypes.SELECT }
    ),
  ]);

  const leadsByMonth = new Map(leadRows.map((r) => [r.month, n(r.leadsCount)]));
  const wonByMonth = new Map(wonRows.map((r) => [r.month, { count: n(r.wonCount), revenue: n(r.revenueAed) }]));

  return deriveMonthly(leadsByMonth, wonByMonth, months);
}

/**
 * Per-branch rollup (leads, won deals, revenue, avg sale, conversion rate)
 * for the given window, with each branch's Branch Manager attached.
 */
export async function getBranchPerformance(params: { months?: number } = {}): Promise<EntityPerformanceRow[]> {
  const months = Math.min(24, Math.max(1, params.months || 3));
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - (months - 1));
  const startDateStr = startDate.toISOString().slice(0, 10);

  const rows = await sequelize.query<{
    id: number; branchName: string; branchManagerName: string | null;
    leadsCount: number; wonCount: number; revenueAed: number;
  }>(
    `SELECT
       b.id, b.branch AS branchName,
       (SELECT e2.name FROM crm_employee e2 JOIN crm_role r2 ON r2.id = e2.role
        WHERE r2.name IN ('Team Leader', 'Area Manager') AND e2.branch = b.id AND e2.status = 1 LIMIT 1) AS branchManagerName,
       COALESCE(lc.leadsCount, 0) AS leadsCount,
       COALESCE(oc.wonCount, 0) AS wonCount,
       COALESCE(oc.revenueAed, 0) AS revenueAed
     FROM crm_branch b
     LEFT JOIN (
       SELECT branch AS branchId, COUNT(*) AS leadsCount
       FROM crm_forum_leads
       WHERE regdate >= :startDate
       GROUP BY branch
     ) lc ON lc.branchId = b.id
     LEFT JOIN (
       SELECT o.branchId, COUNT(*) AS wonCount, ${REVENUE_EXPR} AS revenueAed
       FROM crm_opportunities o
       ${REVENUE_JOIN}
       WHERE LOWER(COALESCE(o.status,'')) = 'won' AND o.createdAt >= :startDate
       GROUP BY o.branchId
     ) oc ON oc.branchId = b.id
     WHERE b.status = 1
     ORDER BY revenueAed DESC, leadsCount DESC`,
    { replacements: { startDate: startDateStr }, type: QueryTypes.SELECT }
  );

  return rows.map((r) => {
    const leadsCount = n(r.leadsCount);
    const wonCount = n(r.wonCount);
    const revenueAed = round2(n(r.revenueAed));
    return {
      id: r.id,
      name: r.branchName,
      branchManagerName: r.branchManagerName || 'Unassigned',
      leadsCount,
      wonCount,
      revenueAed,
      avgSaleAed: wonCount > 0 ? round2(revenueAed / wonCount) : 0,
      conversionRate: leadsCount > 0 ? round2((wonCount / leadsCount) * 100) : 0,
    };
  });
}

/**
 * Per-counselor rollup, restricted to employees who actually have at least
 * one lead or won deal in the window (rather than dumping every employee).
 */
export async function getCounselorPerformance(params: { months?: number; branchId?: number | null } = {}): Promise<EntityPerformanceRow[]> {
  const months = Math.min(24, Math.max(1, params.months || 3));
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - (months - 1));
  const startDateStr = startDate.toISOString().slice(0, 10);

  const branchFilter = params.branchId ? 'AND e.branch = :branchId' : '';
  const replacements: Record<string, unknown> = { startDate: startDateStr };
  if (params.branchId) replacements.branchId = params.branchId;

  const rows = await sequelize.query<{
    id: number; name: string; branchId: number | null; branchName: string | null;
    leadsCount: number; wonCount: number; revenueAed: number;
  }>(
    `SELECT
       e.id, e.name, e.branch AS branchId, b.branch AS branchName,
       COALESCE(lc.leadsCount, 0) AS leadsCount,
       COALESCE(oc.wonCount, 0) AS wonCount,
       COALESCE(oc.revenueAed, 0) AS revenueAed
     FROM crm_employee e
     LEFT JOIN crm_branch b ON b.id = e.branch
     LEFT JOIN (
       SELECT Counsilor AS empId, COUNT(*) AS leadsCount
       FROM crm_forum_leads
       WHERE regdate >= :startDate
       GROUP BY Counsilor
     ) lc ON lc.empId = e.id
     LEFT JOIN (
       SELECT o.assignedTo AS empId, COUNT(*) AS wonCount, ${REVENUE_EXPR} AS revenueAed
       FROM crm_opportunities o
       ${REVENUE_JOIN}
       WHERE LOWER(COALESCE(o.status,'')) = 'won' AND o.createdAt >= :startDate
       GROUP BY o.assignedTo
     ) oc ON oc.empId = e.id
     WHERE e.status = 1 ${branchFilter} AND (COALESCE(lc.leadsCount,0) > 0 OR COALESCE(oc.wonCount,0) > 0)
     ORDER BY revenueAed DESC, leadsCount DESC`,
    { replacements, type: QueryTypes.SELECT }
  );

  return rows.map((r) => {
    const leadsCount = n(r.leadsCount);
    const wonCount = n(r.wonCount);
    const revenueAed = round2(n(r.revenueAed));
    return {
      id: r.id,
      name: r.name,
      branchId: r.branchId,
      branchName: r.branchName || 'N/A',
      leadsCount,
      wonCount,
      revenueAed,
      avgSaleAed: wonCount > 0 ? round2(revenueAed / wonCount) : 0,
      conversionRate: leadsCount > 0 ? round2((wonCount / leadsCount) * 100) : 0,
    };
  });
}

function windowStart(months: number) {
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - (Math.min(24, Math.max(1, months)) - 1));
  return startDate.toISOString().slice(0, 10);
}

function toBreakdown(rows: Array<{ label: string | null; count: number }>, fallbackLabel = 'Unspecified'): BreakdownRow[] {
  const total = rows.reduce((sum, r) => sum + n(r.count), 0);
  return rows
    .map((r) => ({
      label: r.label?.trim() || fallbackLabel,
      count: n(r.count),
      percent: total > 0 ? round2((n(r.count) / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Lead status distribution (New, Contacted, Qualified, etc.) for the window/scope. */
export async function getLeadStatusBreakdown(params: SalesPerformanceParams): Promise<BreakdownRow[]> {
  const conditions = ['l.regdate >= :startDate'];
  const replacements: Record<string, unknown> = { startDate: windowStart(params.months || 3) };
  if (params.branchId) { conditions.push('l.branch = :branchId'); replacements.branchId = params.branchId; }
  if (params.counselorId) { conditions.push('l.Counsilor = :counselorId'); replacements.counselorId = params.counselorId; }

  const rows = await sequelize.query<{ label: string | null; count: number }>(
    `SELECT l.status AS label, COUNT(*) AS count
     FROM crm_forum_leads l
     WHERE ${conditions.join(' AND ')}
     GROUP BY l.status`,
    { replacements, type: QueryTypes.SELECT }
  );
  return toBreakdown(rows, 'No status');
}

/** Lead source distribution (Facebook, Google, Referral, etc.) for the window/scope. */
export async function getLeadSourceBreakdown(params: SalesPerformanceParams): Promise<BreakdownRow[]> {
  const conditions = ['l.regdate >= :startDate'];
  const replacements: Record<string, unknown> = { startDate: windowStart(params.months || 3) };
  if (params.branchId) { conditions.push('l.branch = :branchId'); replacements.branchId = params.branchId; }
  if (params.counselorId) { conditions.push('l.Counsilor = :counselorId'); replacements.counselorId = params.counselorId; }

  const rows = await sequelize.query<{ label: string | null; count: number }>(
    `SELECT COALESCE(s.name, l.market_source) AS label, COUNT(*) AS count
     FROM crm_forum_leads l
     LEFT JOIN crm_source s ON s.id = CAST(l.market_source AS UNSIGNED)
     WHERE ${conditions.join(' AND ')}
     GROUP BY COALESCE(s.name, l.market_source)`,
    { replacements, type: QueryTypes.SELECT }
  );
  return toBreakdown(rows, 'Unknown source');
}

export interface SourcePerformanceRow {
  source: string;
  leadsCount: number;
  wonCount: number;
  revenueAed: number;
  avgSaleAed: number;
  conversionRate: number;
}

/**
 * Leads vs won-conversion performance grouped by lead source, for the
 * window/scope — "which channels actually convert", not just lead volume.
 */
export async function getSourcePerformance(params: SalesPerformanceParams): Promise<SourcePerformanceRow[]> {
  const startDate = windowStart(params.months || 3);
  const leadConditions = ['l.regdate >= :startDate'];
  const wonConditions = ["LOWER(COALESCE(o.status,'')) = 'won'", 'o.createdAt >= :startDate'];
  const replacements: Record<string, unknown> = { startDate };

  if (params.branchId) {
    leadConditions.push('l.branch = :branchId');
    wonConditions.push('o.branchId = :branchId');
    replacements.branchId = params.branchId;
  }
  if (params.counselorId) {
    leadConditions.push('l.Counsilor = :counselorId');
    wonConditions.push('o.assignedTo = :counselorId');
    replacements.counselorId = params.counselorId;
  }

  const [leadRows, wonRows] = await Promise.all([
    sequelize.query<{ source: string | null; leadsCount: number }>(
      `SELECT COALESCE(s.name, l.market_source) AS source, COUNT(*) AS leadsCount
       FROM crm_forum_leads l
       LEFT JOIN crm_source s ON s.id = CAST(l.market_source AS UNSIGNED)
       WHERE ${leadConditions.join(' AND ')}
       GROUP BY COALESCE(s.name, l.market_source)`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query<{ source: string | null; wonCount: number; revenueAed: number }>(
      `SELECT COALESCE(s.name, l.market_source) AS source, COUNT(*) AS wonCount, ${REVENUE_EXPR} AS revenueAed
       FROM crm_opportunities o
       ${REVENUE_JOIN}
       LEFT JOIN crm_source s ON s.id = CAST(l.market_source AS UNSIGNED)
       WHERE ${wonConditions.join(' AND ')}
       GROUP BY COALESCE(s.name, l.market_source)`,
      { replacements, type: QueryTypes.SELECT }
    ),
  ]);

  const wonBySource = new Map(wonRows.map((r) => [r.source?.trim() || 'Unknown source', { count: n(r.wonCount), revenue: n(r.revenueAed) }]));
  const sources = new Map<string, number>();
  leadRows.forEach((r) => sources.set(r.source?.trim() || 'Unknown source', n(r.leadsCount)));
  wonBySource.forEach((_, key) => { if (!sources.has(key)) sources.set(key, 0); });

  return Array.from(sources.entries())
    .map(([source, leadsCount]) => {
      const won = wonBySource.get(source) || { count: 0, revenue: 0 };
      const revenueAed = round2(won.revenue);
      return {
        source,
        leadsCount,
        wonCount: won.count,
        revenueAed,
        avgSaleAed: won.count > 0 ? round2(revenueAed / won.count) : 0,
        conversionRate: leadsCount > 0 ? round2((won.count / leadsCount) * 100) : 0,
      };
    })
    .sort((a, b) => b.revenueAed - a.revenueAed || b.leadsCount - a.leadsCount);
}
