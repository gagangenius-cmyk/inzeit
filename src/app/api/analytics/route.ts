import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { unstable_cache } from 'next/cache';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { CACHE_TAGS } from '@/lib/reportCache';

let dbInitialized = false;
const ensureDB = async () => {
  if (!dbInitialized) { await connectDB(); dbInitialized = true; }
};

const n = (v: unknown) => Number(v || 0);

// Pulled out of the route handler so it can be wrapped in unstable_cache
// below - see src/app/api/admin/dashboard/route.ts's computeDashboardData
// for the full rationale (no caching layer existed anywhere in this app
// before this pass).
async function computeAnalyticsData(isBM: boolean, isCounselor: boolean, userBranch: number, userId: number, range: string) {
  await ensureDB();

  // Role WHERE clause for lead queries - every value below is bound as a
  // named replacement (:branch/:uid/:dateStr), never interpolated into the
  // SQL text. The previous version built these fragments with raw
  // string interpolation (`AND l.branch = '${userBranch}'`) - harmless
  // today only because userBranch/userId come from a verified JWT, not
  // request input, but it's the exact shape a real SQL-injection bug looks
  // like and inconsistent with every other query in this file.
  let leadWhere = '';
  let counselorJoinFilter = '';
  let branchJoinFilter = '';
  let paymentJoinClause = '';

  if (isBM && userBranch) {
    leadWhere = 'AND l.branch = :branch';
    branchJoinFilter = 'AND b.id = :branch';
    paymentJoinClause = 'JOIN crm_forum_leads l ON l.id = ph.leadId AND l.branch = :branch';
  } else if (isCounselor && userId) {
    leadWhere = 'AND (l.assignTo = :uid OR l.Counsilor = :uid)';
    counselorJoinFilter = 'AND (l.assignTo = :uid OR l.Counsilor = :uid)';
    paymentJoinClause = 'JOIN crm_forum_leads l ON l.id = ph.leadId AND (l.assignTo = :uid OR l.Counsilor = :uid)';
  }
  const employeeBranchFilter = isBM && userBranch ? 'AND e.branch = :branch' : '';

  // Build date filter
  const now = new Date();
  let startDate: Date | null = null;
  switch (range) {
    case 'week':    startDate = new Date(now.getTime() - 7   * 86400000); break;
    case 'month':   startDate = new Date(now.getTime() - 30  * 86400000); break;
    case 'quarter': startDate = new Date(now.getTime() - 90  * 86400000); break;
    case 'year':    startDate = new Date(now.getTime() - 365 * 86400000); break;
    default:        startDate = null;
  }

  const dateStr = startDate ? startDate.toISOString().slice(0, 10) : null;
  const dateFilter = dateStr ? 'AND l.regdate >= :dateStr' : '';
  // Role scoping (not the selected date range) applies to the fixed
  // 12-month trend and appointments queries below, matching
  // src/app/api/admin/dashboard/route.ts's roleOnlyWhere convention of
  // scoping trend charts by role without narrowing them by the dashboard's
  // own date-range picker.
  const rep = { branch: userBranch, uid: userId, dateStr };

  const [
    summaryRows,
    statusRows,
    monthlyRows,
    sourceRows,
    counselorRows,
    branchRows,
    appointmentRows,
    paymentTrendRows,
    recentLeadsRows,
  ] = await Promise.all([
    // ── Summary totals ──────────────────────────────────────────────────────
    sequelize.query<{
      total: number; new_leads: number; active: number; converted: number;
      revenue: number; paid: number; pending: number;
    }>(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN l.status IN ('New','new') THEN 1 ELSE 0 END) AS new_leads,
        SUM(CASE WHEN l.status NOT IN ('New','new','Converted','converted','Retained','retained','Client','client')
             AND (l.opportunity_status IS NULL OR l.opportunity_status <> 'won') THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN l.status IN ('Converted','converted','Retained','retained','Client','client')
             OR l.opportunity_status = 'won' THEN 1 ELSE 0 END) AS converted,
        COALESCE(SUM(l.payTotal),0) AS revenue,
        COALESCE(SUM(l.paidYet),0) AS paid,
        COALESCE(SUM(l.payBalance),0) AS pending
      FROM crm_forum_leads l
      WHERE 1=1 ${leadWhere} ${dateFilter}`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Leads by status ────────────────────────────────────────────────────
    sequelize.query<{ status: string; count: number }>(
      `SELECT
        CASE
          WHEN l.status IN ('Converted','converted','Retained','retained','Client','client')
            OR l.opportunity_status = 'won' THEN 'Client'
          WHEN l.status IN ('New','new') THEN 'New'
          WHEN l.status IS NULL OR l.status = '' THEN 'Unknown'
          ELSE l.status
        END AS status,
        COUNT(*) AS count
      FROM crm_forum_leads l
      WHERE 1=1 ${leadWhere} ${dateFilter}
      GROUP BY 1
      ORDER BY count DESC`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Monthly lead trend (last 12 months) ────────────────────────────────
    sequelize.query<{ month: string; total: number; converted: number }>(
      `SELECT
        DATE_FORMAT(l.regdate, '%Y-%m') AS month,
        COUNT(*) AS total,
        SUM(CASE WHEN l.status IN ('Converted','converted','Retained','retained','Client','client')
             OR l.opportunity_status = 'won' THEN 1 ELSE 0 END) AS converted
      FROM crm_forum_leads l
      WHERE l.regdate >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${leadWhere}
      GROUP BY month
      ORDER BY month ASC`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Leads by source ────────────────────────────────────────────────────
    sequelize.query<{ source: string; count: number }>(
      `SELECT
        COALESCE(ms.name, l.market_source, 'Unknown') AS source,
        COUNT(*) AS count
      FROM crm_forum_leads l
      LEFT JOIN crm_source ms ON ms.id = CAST(l.market_source AS UNSIGNED)
      WHERE l.market_source IS NOT NULL AND l.market_source <> '' ${leadWhere} ${dateFilter}
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Counselor performance ───────────────────────────────────────────────
    sequelize.query<{
      id: number; name: string; branch_name: string;
      total: number; converted: number; revenue: number; paid: number;
    }>(
      `SELECT
        e.id,
        e.name,
        COALESCE(b.branch, 'N/A') AS branch_name,
        COUNT(l.id) AS total,
        SUM(CASE WHEN l.status IN ('Converted','converted','Retained','retained','Client','client')
             OR l.opportunity_status = 'won' THEN 1 ELSE 0 END) AS converted,
        COALESCE(SUM(l.payTotal),0) AS revenue,
        COALESCE(SUM(l.paidYet),0) AS paid
      FROM crm_employee e
      LEFT JOIN crm_forum_leads l ON (l.assignTo = e.id OR l.Counsilor = e.id) ${dateFilter} ${leadWhere}
      LEFT JOIN crm_branch b ON b.id = e.branch
      WHERE e.status = 1 ${employeeBranchFilter}
      GROUP BY e.id, e.name, b.branch
      HAVING total > 0
      ORDER BY converted DESC, total DESC
      LIMIT 20`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Branch performance ──────────────────────────────────────────────────
    sequelize.query<{
      id: number; name: string; region_name: string;
      total: number; converted: number; revenue: number; paid: number;
    }>(
      `SELECT
        b.id,
        b.branch AS name,
        COALESCE(r.name, 'N/A') AS region_name,
        COUNT(l.id) AS total,
        SUM(CASE WHEN l.status IN ('Converted','converted','Retained','retained','Client','client')
             OR l.opportunity_status = 'won' THEN 1 ELSE 0 END) AS converted,
        COALESCE(SUM(l.payTotal),0) AS revenue,
        COALESCE(SUM(l.paidYet),0) AS paid
      FROM crm_branch b
      LEFT JOIN crm_region r ON r.id = b.region
      LEFT JOIN crm_forum_leads l ON l.branch = b.id ${dateFilter} ${counselorJoinFilter}
      WHERE b.status = 1 ${branchJoinFilter}
      GROUP BY b.id, b.branch, r.name
      ORDER BY total DESC`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Appointments ────────────────────────────────────────────────────────
    sequelize.query<{ total: number; completed: number; pending: number }>(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN done = 0 AND not_done = 0 THEN 1 ELSE 0 END) AS pending
      FROM appointments
      WHERE 1=1
        ${isBM && userBranch ? 'AND branch = :branch' : ''}
        ${isCounselor && userId ? 'AND counsilorid = :uid' : ''}`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Payment trend (last 6 months) ─────────────────────────────────────
    sequelize.query<{ month: string; collected: number }>(
      `SELECT
        DATE_FORMAT(ph.date, '%Y-%m') AS month,
        COALESCE(SUM(ph.amount),0) AS collected
      FROM crm_pay_history ph
      ${paymentJoinClause}
      WHERE ph.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND (ph.status IS NULL OR ph.status NOT IN ('cancelled','refund'))
      GROUP BY month
      ORDER BY month ASC`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),

    // ── Recent leads (last 10) ─────────────────────────────────────────────
    sequelize.query<{
      id: number; fname: string; lname: string; status: string;
      priority: string; branch_name: string; assigned_to: string; regdate: string;
    }>(
      `SELECT
        l.id,
        l.fname,
        l.lname,
        COALESCE(l.status, 'New') AS status,
        COALESCE(l.priority, '') AS priority,
        COALESCE(b.branch, 'N/A') AS branch_name,
        COALESCE(e.name, 'Unassigned') AS assigned_to,
        DATE_FORMAT(l.regdate, '%Y-%m-%d') AS regdate
      FROM crm_forum_leads l
      LEFT JOIN crm_branch b ON b.id = l.branch
      LEFT JOIN crm_employee e ON e.id = l.assignTo
      WHERE 1=1 ${leadWhere}
      ORDER BY l.id DESC
      LIMIT 10`,
      { replacements: rep, type: QueryTypes.SELECT }
    ),
  ]);

  const s = summaryRows[0] || {};
  const totalLeads = n(s.total);
  const converted = n(s.converted);

  // Employee count
  const [empCount] = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM crm_employee WHERE status = 1`,
    { type: QueryTypes.SELECT }
  );

  return {
    summary: {
      totalLeads,
      newLeads: n(s.new_leads),
      activeLeads: n(s.active),
      convertedLeads: converted,
      conversionRate: totalLeads > 0 ? parseFloat(((converted / totalLeads) * 100).toFixed(1)) : 0,
      totalRevenue: n(s.revenue),
      collectedAmount: n(s.paid),
      pendingAmount: n(s.pending),
      totalEmployees: n(empCount?.total),
      totalAppointments: n(appointmentRows[0]?.total),
      completedAppointments: n(appointmentRows[0]?.completed),
      pendingAppointments: n(appointmentRows[0]?.pending),
    },
    leadsByStatus: statusRows.map(r => ({ status: String(r.status), count: n(r.count) })),
    leadsByMonth: monthlyRows.map(r => ({
      month: r.month,
      total: n(r.total),
      converted: n(r.converted),
    })),
    leadsBySource: sourceRows.map(r => ({ source: String(r.source), count: n(r.count) })),
    counselorPerformance: counselorRows.map(r => ({
      id: r.id,
      name: r.name,
      branch: r.branch_name,
      totalLeads: n(r.total),
      convertedLeads: n(r.converted),
      conversionRate: n(r.total) > 0
        ? parseFloat(((n(r.converted) / n(r.total)) * 100).toFixed(1))
        : 0,
      revenue: n(r.revenue),
      collected: n(r.paid),
    })),
    branchPerformance: branchRows.map(r => ({
      id: r.id,
      name: r.name,
      region: r.region_name,
      totalLeads: n(r.total),
      convertedLeads: n(r.converted),
      conversionRate: n(r.total) > 0
        ? parseFloat(((n(r.converted) / n(r.total)) * 100).toFixed(1))
        : 0,
      revenue: n(r.revenue),
      collected: n(r.paid),
    })),
    paymentTrend: paymentTrendRows.map(r => ({
      month: r.month,
      collected: n(r.collected),
    })),
    recentLeads: recentLeadsRows,
  };
}

const getCachedAnalyticsData = unstable_cache(
  computeAnalyticsData,
  ['analytics'],
  { tags: [CACHE_TAGS.leads, CACHE_TAGS.appointments, CACHE_TAGS.payments, CACHE_TAGS.employees], revalidate: 60 },
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['analytics.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month'; // week | month | quarter | year | all

    // Role-based scope
    const userRole   = auth.role ?? 0;
    const userType   = String(auth.type || '').toLowerCase().replace(/[\s-]+/g, '_');
    const userBranch = auth.branch ?? 0;
    const userId     = auth.id ?? 0;

    const isAdmin = userRole === 1 || ['super_admin','admin','administrator','director','dos','director_of_sales','founder'].includes(userType);
    const isBM    = !isAdmin && ['branch_manager','bm'].includes(userType);
    const isCounselor = !isAdmin && !isBM;

    const data = await getCachedAnalyticsData(isBM, isCounselor, userBranch, userId, range);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[analytics] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
