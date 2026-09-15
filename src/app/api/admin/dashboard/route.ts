import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { unstable_cache } from 'next/cache';
import { sequelize, connectDB } from '@/lib/sequelize';
import { getBranchTaxInfo } from '@/lib/branchTax';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { CACHE_TAGS } from '@/lib/reportCache';

let dbInitialized = false;
const ensureDBConnection = async () => {
  if (!dbInitialized) { await connectDB(); dbInitialized = true; }
};

const n = (v: unknown) => Number(v || 0);

// Determine the role category from the user's type string
function roleCategory(type: string) {
  const t = type.toLowerCase().replace(/[\s-]+/g, '_');
  if (['super_admin', 'admin', 'administrator', 'director', 'dos', 'director_of_sales', 'founder'].includes(t)) return 'admin';
  if (['branch_manager', 'bm'].includes(t)) return 'branch_manager';
  if (['hr'].includes(t)) return 'hr';
  if (['pro'].includes(t)) return 'pro';
  if (['finance', 'accounts'].includes(t)) return 'finance';
  if (['operations', 'ops'].includes(t)) return 'operations';
  if (['digital_marketing'].includes(t)) return 'marketing';
  return 'counselor'; // sales, employee, etc.
}

// The actual aggregation, pulled out of the route handler so it can be
// wrapped in Next.js's own data cache (unstable_cache) below - this used to
// recompute all ~20 queries from scratch on every single request, with no
// caching layer anywhere in the app at all. Cached per unique combination of
// role-scope/date-range args (Next.js keys unstable_cache by the arguments
// passed to the wrapped function), tagged so lead/payment writes
// (src/lib/leadDefaults.ts, leadRemarks.ts, the payment-creation routes) can
// invalidate it immediately via revalidateTag rather than waiting out the
// 60s safety-net window below.
async function computeDashboardData(
  cat: string,
  userBranch: number,
  userId: number,
  dateFromParam: string | null,
  dateToParam: string | null,
) {
  await ensureDBConnection();

  const today    = new Date().toISOString().split('T')[0];
  const weekAgo  = new Date(Date.now() -  7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const yearAgo  = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];

  const hasDateRange = Boolean(dateFromParam && dateToParam
    && !Number.isNaN(new Date(dateFromParam).getTime())
    && !Number.isNaN(new Date(dateToParam).getTime()));
  const dateRangeSql = hasDateRange ? 'DATE(COALESCE(l.created, l.regdate)) BETWEEN :dateFrom AND :dateTo' : '';
  const dateRangeReplacements = hasDateRange ? { dateFrom: dateFromParam, dateTo: dateToParam } : {};

  // ── Build WHERE clause for lead queries based on role ────────────────────
  const roleConditions: string[] = [];
  let leadReplacements: Record<string, unknown> = {};

  if (cat === 'branch_manager' && userBranch) {
    roleConditions.push('l.branch = :branch');
    leadReplacements = { branch: userBranch };
  } else if (cat === 'counselor' && userId) {
    roleConditions.push('(l.assignTo = :uid OR l.Counsilor = :uid)');
    leadReplacements = { uid: userId };
  }
  // admin / finance / operations / hr / pro: no role scoping — global summary stats.

  if (hasDateRange) {
    roleConditions.push(dateRangeSql);
    leadReplacements = { ...leadReplacements, ...dateRangeReplacements };
  }

  const leadWhere = roleConditions.length ? `WHERE ${roleConditions.join(' AND ')}` : '';

  // Role scoping only, no date range — the Monthly/Daily trend charts show
  // a longer history (year/30-day) regardless of the selected dashboard
  // period, so they intentionally don't get narrowed by dateFrom/dateTo.
  const roleOnlyConditions = roleConditions.filter((c) => c !== dateRangeSql);
  const roleOnlyWhere = roleOnlyConditions.length ? `WHERE ${roleOnlyConditions.join(' AND ')}` : '';
  const roleOnlyReplacements = cat === 'branch_manager' && userBranch
    ? { branch: userBranch }
    : cat === 'counselor' && userId
      ? { uid: userId }
      : {};

  // ── Appointment filter ───────────────────────────────────────────────────
  const apptEmployeeFilter = (cat === 'counselor' && userId)
    ? 'AND a.counsilorid = :uid'
    : '';
  const fuEmployeeFilter = (cat === 'counselor' && userId)
    ? 'AND r.user_id = :uid'
    : '';
  const apptBranchFilter = (cat === 'branch_manager' && userBranch)
    ? 'AND a.branch = :branch'
    : '';
  const apptReplacements = { today, uid: userId, branch: userBranch };

  // ── Lead Stats ───────────────────────────────────────────────────────────
  const [leadStats] = await sequelize.query<any>(`
    SELECT
      COUNT(*) AS totalLeads,
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) = :today THEN 1 ELSE 0 END) AS todayLeads,
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) >= :weekAgo THEN 1 ELSE 0 END) AS weekLeads,
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) >= :monthAgo THEN 1 ELSE 0 END) AS monthLeads,
      SUM(CASE WHEN LOWER(COALESCE(l.status, '')) IN ('converted', 'retained', 'client')
             OR LOWER(COALESCE(l.opportunity_status, '')) = 'won' THEN 1 ELSE 0 END) AS convertedLeads,
      SUM(CASE WHEN l.followupstat = 0 AND l.followup IS NOT NULL AND DATE(l.followup) <= :today THEN 1 ELSE 0 END) AS pendingFollowups,
      COALESCE(SUM(l.payTotal), 0) AS totalRevenue,
      COALESCE(SUM(l.paidYet), 0) AS totalPaidAmount,
      COALESCE(SUM(l.payBalance), 0) AS totalBalance
    FROM crm_forum_leads l
    ${leadWhere}
  `, { replacements: { today, weekAgo, monthAgo, ...leadReplacements }, type: QueryTypes.SELECT });

  // "Revenue" for a counselor should be the company's actual earnings, not
  // the VAT collected on the client's behalf and remitted to the
  // government - so back the branch's tax rate out of each lead's
  // payTotal (skipping leads flagged novat) rather than summing the raw,
  // tax-inclusive payment total.
  const revenueRows = await sequelize.query<any>(`
    SELECT l.payTotal, l.novat, b.branch AS branchName, b.address AS branchAddress
    FROM crm_forum_leads l
    LEFT JOIN crm_branch b ON b.id = l.branch
    ${leadWhere}
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });
  const totalRevenueExVat = (revenueRows as any[]).reduce((sum, row) => {
    const payTotal = Number(row.payTotal || 0);
    if (!payTotal) return sum;
    if (Number(row.novat) === 1) return sum + payTotal;
    const { rate } = getBranchTaxInfo(row.branchName || row.branchAddress);
    return sum + payTotal / (1 + rate);
  }, 0);

  // ── Appointment Stats ────────────────────────────────────────────────────
  const [appointmentStats] = await sequelize.query<any>(`
    SELECT
      COUNT(*) AS totalAppointments,
      SUM(CASE WHEN DATE(a.date) = :today THEN 1 ELSE 0 END) AS todayAppointments,
      SUM(CASE WHEN COALESCE(a.done, 0) = 0 AND COALESCE(a.not_done, 0) = 0 THEN 1 ELSE 0 END) AS pendingAppointments,
      SUM(CASE WHEN DATE(a.date) >= :today THEN 1 ELSE 0 END) AS upcomingAppointments
    FROM appointments a
    WHERE 1=1 ${apptEmployeeFilter} ${apptBranchFilter}
  `, { replacements: apptReplacements, type: QueryTypes.SELECT });

  // ── Month-over-month trend (this month vs last month, same scope as above) ─
  const monthNow = new Date();
  const thisMonthStart = new Date(monthNow.getFullYear(), monthNow.getMonth(), 1).toISOString().split('T')[0];
  const lastMonthStart = new Date(monthNow.getFullYear(), monthNow.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(monthNow.getFullYear(), monthNow.getMonth(), 0).toISOString().split('T')[0];

  const [leadTrendStats] = await sequelize.query<any>(`
    SELECT
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) >= :thisMonthStart THEN 1 ELSE 0 END) AS thisMonthLeads,
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) >= :thisMonthStart
             AND (LOWER(COALESCE(l.status, '')) IN ('converted','retained','client') OR LOWER(COALESCE(l.opportunity_status, '')) = 'won')
           THEN 1 ELSE 0 END) AS thisMonthConverted,
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) BETWEEN :lastMonthStart AND :lastMonthEnd THEN 1 ELSE 0 END) AS lastMonthLeads,
      SUM(CASE WHEN DATE(COALESCE(l.created, l.regdate)) BETWEEN :lastMonthStart AND :lastMonthEnd
             AND (LOWER(COALESCE(l.status, '')) IN ('converted','retained','client') OR LOWER(COALESCE(l.opportunity_status, '')) = 'won')
           THEN 1 ELSE 0 END) AS lastMonthConverted
    FROM crm_forum_leads l
    ${roleOnlyWhere}
  `, { replacements: { thisMonthStart, lastMonthStart, lastMonthEnd, ...roleOnlyReplacements }, type: QueryTypes.SELECT });

  const [apptTrendStats] = await sequelize.query<any>(`
    SELECT
      SUM(CASE WHEN DATE(a.date) >= :thisMonthStart THEN 1 ELSE 0 END) AS thisMonthAppointments,
      SUM(CASE WHEN DATE(a.date) BETWEEN :lastMonthStart AND :lastMonthEnd THEN 1 ELSE 0 END) AS lastMonthAppointments
    FROM appointments a
    WHERE 1=1 ${apptEmployeeFilter} ${apptBranchFilter}
  `, { replacements: { thisMonthStart, lastMonthStart, lastMonthEnd, uid: userId, branch: userBranch }, type: QueryTypes.SELECT });

  // ── Employee Stats ───────────────────────────────────────────────────────
  const [employeeStats] = await sequelize.query<any>(
    `SELECT COUNT(*) AS totalEmployees FROM crm_employee WHERE COALESCE(status, 1) = 1${
      cat === 'branch_manager' && userBranch ? ' AND branch = :branch' : ''}`,
    { replacements: { branch: userBranch }, type: QueryTypes.SELECT }
  );

  // ── Opportunity Stats ────────────────────────────────────────────────────
  const opportunityBranchFilter = cat === 'branch_manager' && userBranch ? 'AND branchId = :branch' : '';
  const [opportunityStats] = await sequelize.query<any>(`
    SELECT
      COUNT(*) AS totalOperations,
      SUM(CASE WHEN LOWER(COALESCE(status, '')) IN ('qualified','proposal','negotiation','in_progress') THEN 1 ELSE 0 END) AS activeOperations,
      SUM(CASE WHEN LOWER(COALESCE(status, '')) = 'won' THEN 1 ELSE 0 END) AS completedOperations
    FROM crm_opportunities
    WHERE 1=1 ${opportunityBranchFilter}
  `, { replacements: { branch: userBranch }, type: QueryTypes.SELECT });

  // ── Total Clients ──────────────────────────────────────────────────────────
  // Same definition the actual Clients page uses (src/app/api/admin/clients/route.ts):
  // a lead becomes a "Client" once its opportunity is won AND both finance
  // and compliance sign off on the workflow review — NOT just "any lead"
  // (the dashboard used to just relabel totalLeads as totalClients here).
  const clientRoleConditions: string[] = [];
  const clientReplacements: Record<string, unknown> = {};
  if (cat === 'branch_manager' && userBranch) {
    clientRoleConditions.push('l.branch = :branch');
    clientReplacements.branch = userBranch;
  } else if (cat === 'counselor' && userId) {
    clientRoleConditions.push('l.assignTo = :uid');
    clientReplacements.uid = userId;
  }
  if (hasDateRange) {
    clientRoleConditions.push('DATE(w.case_activated_at) BETWEEN :dateFrom AND :dateTo');
    Object.assign(clientReplacements, dateRangeReplacements);
  }
  const clientWhere = clientRoleConditions.length ? `AND ${clientRoleConditions.join(' AND ')}` : '';
  const [clientStats] = await sequelize.query<any>(`
    SELECT COUNT(DISTINCT w.lead_id) AS totalClients
    FROM crm_opportunity_workflow_reviews w
    INNER JOIN (
      SELECT wr.lead_id, MAX(wr.id) AS maxId
      FROM crm_opportunity_workflow_reviews wr
      JOIN crm_opportunities owr ON owr.id = wr.opportunity_id
      WHERE wr.finance_status = 'approved' AND wr.compliance_status = 'approved'
        AND TRIM(LOWER(COALESCE(owr.status, ''))) IN ('won', 'closed won', 'close won')
      GROUP BY lead_id
    ) latest ON latest.maxId = w.id
    JOIN crm_forum_leads l ON l.id = w.lead_id
    WHERE 1=1 ${clientWhere}
  `, { replacements: clientReplacements, type: QueryTypes.SELECT });

  // ── Branch count ─────────────────────────────────────────────────────────
  const [branchStats] = await sequelize.query<any>(
    `SELECT COUNT(*) AS totalBranches FROM crm_branch`,
    { type: QueryTypes.SELECT }
  );

  // ── Recent Leads ─────────────────────────────────────────────────────────
  const recentLeads = await sequelize.query<any>(`
    SELECT
      l.id, l.fname, l.lname, l.email, l.phone, l.status, l.priority,
      l.country_interest, l.service_interest, l.created, l.regdate,
      e.name AS assignedTo
    FROM crm_forum_leads l
    LEFT JOIN crm_employee e ON l.assignTo = e.id
    ${leadWhere}
    ORDER BY COALESCE(l.created, l.regdate) DESC
    LIMIT 10
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });

  // ── Today's Appointments ─────────────────────────────────────────────────
  const todayAppointments = await sequelize.query<any>(`
    SELECT
      a.id, a.date, a.appointtime, a.leadid, a.booked, a.done, a.not_done,
      a.meeting_status, a.meeting_verified,
      l.fname, l.lname, l.phone, l.mobile,
      e.name AS counselorName,
      b.branch AS branchName
    FROM appointments a
    LEFT JOIN crm_forum_leads l ON a.leadid = l.id
    LEFT JOIN crm_employee e ON a.counsilorid = e.id
    LEFT JOIN crm_branch b ON a.branch = b.id
    WHERE DATE(a.date) = :today ${apptEmployeeFilter} ${apptBranchFilter}
    ORDER BY a.appointtime ASC
    LIMIT 50
  `, { replacements: apptReplacements, type: QueryTypes.SELECT });

  // ── Today's Follow-ups ────────────────────────────────────────────────────
  const todayFollowUps = await sequelize.query<any>(`
    SELECT
      r.id, r.lead_id, r.user_id, r.reminder_date, r.message, r.status, r.priority,
      l.fname, l.lname, l.phone, l.mobile,
      e.name AS employeeName
    FROM crm_follow_up_reminders r
    LEFT JOIN crm_forum_leads l ON r.lead_id = l.id
    LEFT JOIN crm_employee e ON r.user_id = e.id
    WHERE DATE(r.reminder_date) = :today ${fuEmployeeFilter}
    ORDER BY r.reminder_date ASC
    LIMIT 50
  `, { replacements: { today, uid: userId }, type: QueryTypes.SELECT });

  // ── Recent Appointments ───────────────────────────────────────────────────
  const recentAppointments = await sequelize.query<any>(`
    SELECT
      a.id, a.date, a.appointtime, a.leadid,
      l.fname, l.lname, l.phone,
      e.name AS counselorName
    FROM appointments a
    LEFT JOIN crm_forum_leads l ON a.leadid = l.id
    LEFT JOIN crm_employee e ON a.counsilorid = e.id
    WHERE (a.date IS NULL OR DATE(a.date) >= :today)
      ${apptEmployeeFilter} ${apptBranchFilter}
    ORDER BY a.date ASC, a.appointtime ASC
    LIMIT 10
  `, { replacements: apptReplacements, type: QueryTypes.SELECT });

  // ── Status Breakdown ──────────────────────────────────────────────────────
  const statusBreakdownRows = await sequelize.query<any>(`
    SELECT COALESCE(l.status, 'Unknown') AS status, COUNT(*) AS count
    FROM crm_forum_leads l
    ${leadWhere}
    GROUP BY COALESCE(l.status, 'Unknown')
    ORDER BY count DESC
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });

  // ── Priority Breakdown (Prospect leads only) ──────────────────────────────
  // Scoped to status = 'Prospect' — previously missing, so this widget
  // silently included DNQ/Junk/Closed/etc. leads despite its "Prospect
  // Leads by Priority" title. Priority values also come from two
  // generations of the priority field (P1-P4 vs legacy free text like
  // Medium/Low/Hot/Cold) — bucket anything outside P1-P4 into "Other" so
  // the tiles' total always accounts for every matching lead instead of
  // silently dropping ~25% of them.
  const priorityWhere = leadWhere ? `${leadWhere} AND l.status = 'Prospect'` : `WHERE l.status = 'Prospect'`;
  const priorityBreakdown = await sequelize.query<any>(`
    SELECT
      CASE WHEN l.priority IN ('P1','P2','P3','P4') THEN l.priority ELSE 'Other' END AS name,
      COUNT(*) AS value
    FROM crm_forum_leads l
    ${priorityWhere}
    GROUP BY CASE WHEN l.priority IN ('P1','P2','P3','P4') THEN l.priority ELSE 'Other' END
    ORDER BY value DESC
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });

  // ── Source Breakdown ──────────────────────────────────────────────────────
  const sourceBreakdown = await sequelize.query<any>(`
    SELECT
      COALESCE(ms.name, l.market_source, 'Unknown') AS name,
      COUNT(*) AS value
    FROM crm_forum_leads l
    LEFT JOIN crm_source ms ON ms.id = CAST(l.market_source AS UNSIGNED)
    ${leadWhere}
    GROUP BY COALESCE(ms.name, l.market_source, 'Unknown')
    ORDER BY value DESC
    LIMIT 10
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });

  // ── Branch Performance ─────────────────────────────────────────────────────
  const branchPerformance = await sequelize.query<any>(`
    SELECT
      COALESCE(b.branch, 'Unassigned') AS branch,
      COUNT(l.id) AS leads,
      SUM(CASE WHEN LOWER(COALESCE(l.status, '')) IN ('converted','retained','client')
            OR LOWER(COALESCE(l.opportunity_status, '')) = 'won' THEN 1 ELSE 0 END) AS converted
    FROM crm_forum_leads l
    LEFT JOIN crm_branch b ON l.branch = b.id
    ${leadWhere}
    GROUP BY COALESCE(b.branch, 'Unassigned')
    ORDER BY leads DESC
    LIMIT 8
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });

  // ── Top Employees ──────────────────────────────────────────────────────────
  const topEmployees = await sequelize.query<any>(`
    SELECT
      COALESCE(e.name, 'Unassigned') AS name,
      COUNT(l.id) AS leads,
      SUM(CASE WHEN LOWER(COALESCE(l.status, '')) IN ('converted','retained','client')
            OR LOWER(COALESCE(l.opportunity_status, '')) = 'won' THEN 1 ELSE 0 END) AS converted
    FROM crm_forum_leads l
    LEFT JOIN crm_employee e ON l.assignTo = e.id
    ${leadWhere}
    GROUP BY COALESCE(e.name, 'Unassigned')
    ORDER BY leads DESC
    LIMIT 8
  `, { replacements: leadReplacements, type: QueryTypes.SELECT });

  // ── Monthly Trend ──────────────────────────────────────────────────────────
  const monthlyLeads = await sequelize.query<any>(`
    SELECT
      DATE_FORMAT(COALESCE(l.created, l.regdate), '%Y-%m') AS month,
      COUNT(*) AS count
    FROM crm_forum_leads l
    ${roleOnlyWhere ? roleOnlyWhere + ' AND' : 'WHERE'} DATE(COALESCE(l.created, l.regdate)) >= :yearAgo
    GROUP BY DATE_FORMAT(COALESCE(l.created, l.regdate), '%Y-%m')
    ORDER BY month ASC
  `, { replacements: { yearAgo, ...roleOnlyReplacements }, type: QueryTypes.SELECT });

  // ── Daily Trend (30 days) ──────────────────────────────────────────────────
  const leadTrend = await sequelize.query<any>(`
    SELECT
      DATE(COALESCE(l.created, l.regdate)) AS date,
      COUNT(*) AS leads
    FROM crm_forum_leads l
    ${roleOnlyWhere ? roleOnlyWhere + ' AND' : 'WHERE'} DATE(COALESCE(l.created, l.regdate)) >= :monthAgo
    GROUP BY DATE(COALESCE(l.created, l.regdate))
    ORDER BY date ASC
  `, { replacements: { monthAgo, ...roleOnlyReplacements }, type: QueryTypes.SELECT });

  // ── Compose response ──────────────────────────────────────────────────────
  const totalLeads    = n(leadStats?.totalLeads);
  const convertedLeads = n(leadStats?.convertedLeads);
  const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;
  const totalOperations    = n(opportunityStats?.totalOperations);
  const completedOperations = n(opportunityStats?.completedOperations);
  const completionRate = totalOperations > 0 ? Number(((completedOperations / totalOperations) * 100).toFixed(1)) : 0;

  const formattedRecentLeads = recentLeads.map((lead: any) => ({
    id: lead.id,
    fname: lead.fname,
    lname: lead.lname,
    name: `${lead.fname || ''} ${lead.lname || ''}`.trim() || 'Unknown',
    email: lead.email,
    phone: lead.phone,
    status: lead.status || 'New',
    priority: lead.priority || 'Medium',
    country_interest: lead.country_interest || 'Not specified',
    service_interest: lead.service_interest || 'Not specified',
    created: lead.created || lead.regdate,
    date: lead.created ? new Date(lead.created).toISOString().split('T')[0] : today,
    assignedTo: lead.assignedTo || 'Unassigned',
  }));

  const statusBreakdown = statusBreakdownRows.map((item: any) => ({
    status: item.status || 'Unknown',
    name: item.status || 'Unknown',
    count: n(item.count),
    value: n(item.count),
    percentage: totalLeads > 0 ? ((n(item.count) / totalLeads) * 100).toFixed(1) : '0',
  }));

  const statusDistributionColors = ['#35AE22','#289018','#50C835','#1C6B10','#B8DFB0','#0891b2'];

  const stats = {
    // Identity / role context
    roleCategory: cat,
    userBranch,
    dateRange: hasDateRange ? { from: dateFromParam, to: dateToParam, active: true } : { active: false },
    // Leads
    totalLeads,
    todayLeads: n(leadStats?.todayLeads),
    weekLeads: n(leadStats?.weekLeads),
    monthLeads: n(leadStats?.monthLeads),
    convertedLeads,
    pendingFollowups: n(leadStats?.pendingFollowups),
    followupLeads: n(leadStats?.pendingFollowups),
    // Appointments
    totalAppointments: n(appointmentStats?.totalAppointments),
    todayAppointments: n(appointmentStats?.todayAppointments),
    pendingAppointments: n(appointmentStats?.pendingAppointments),
    upcomingAppointments: n(appointmentStats?.upcomingAppointments),
    // People
    totalEmployees: n(employeeStats?.totalEmployees),
    totalBranches: n(branchStats?.totalBranches),
    totalClients: n(clientStats?.totalClients),
    // Finance
    totalRevenue: totalRevenueExVat,
    totalPayments: n(leadStats?.totalPaidAmount),
    totalPaidAmount: n(leadStats?.totalPaidAmount),
    totalBalance: n(leadStats?.totalBalance),
    // Opportunities
    totalOperations,
    activeOperations: n(opportunityStats?.activeOperations),
    completedOperations,
    pendingTasks: n(leadStats?.pendingFollowups) + n(appointmentStats?.pendingAppointments),
    recentActivities: formattedRecentLeads.length,
    conversionRate,
    completionRate,
    monthlyLeads: monthlyLeads.map((item: any) => ({ month: item.month, count: n(item.count) })),
    statusBreakdown: statusBreakdownRows.map((item: any) => ({ name: item.status || 'Unknown', value: n(item.count) })),
    priorityBreakdown: priorityBreakdown.map((item: any) => ({ name: item.name, value: n(item.value) })),
    sourceBreakdown: sourceBreakdown.map((item: any) => ({ name: item.name, value: n(item.value) })),
    recentLeads: formattedRecentLeads,
    branchPerformance: branchPerformance.map((item: any) => ({
      branch: item.branch,
      leads: n(item.leads),
      conversion: n(item.leads) > 0 ? `${((n(item.converted) / n(item.leads)) * 100).toFixed(1)}%` : '0%',
    })),
    topEmployees: topEmployees.map((item: any) => ({
      name: item.name,
      leads: n(item.leads),
      conversion: n(item.leads) > 0 ? `${((n(item.converted) / n(item.leads)) * 100).toFixed(1)}%` : '0%',
    })),
    todayCounselorAppointments: todayAppointments.length,
    todayCounselorFollowUps: todayFollowUps.length,
    // Month-over-month performance trend (used for the "achievement" view)
    monthTrend: {
      thisMonthLeads: n(leadTrendStats?.thisMonthLeads),
      lastMonthLeads: n(leadTrendStats?.lastMonthLeads),
      thisMonthConverted: n(leadTrendStats?.thisMonthConverted),
      lastMonthConverted: n(leadTrendStats?.lastMonthConverted),
      thisMonthAppointments: n(apptTrendStats?.thisMonthAppointments),
      lastMonthAppointments: n(apptTrendStats?.lastMonthAppointments),
    },
  };

  return {
    stats,
    recentLeads: formattedRecentLeads,
    recentAppointments,
    todayAppointments,
    todayFollowUps,
    statusBreakdown,
    graphData: {
      leadTrend: leadTrend.map((item: any) => ({
        date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
        leads: n(item.leads),
      })),
      statusDistribution: statusBreakdown.map((item: any, index: number) => ({
        name: item.status,
        value: item.count,
        color: statusDistributionColors[index % statusDistributionColors.length],
      })),
    },
  };
}

// 60s safety-net TTL: covers appointment/opportunity/employee-count changes
// that aren't wired to an explicit revalidateTag call. Lead and payment
// writes invalidate immediately (see the comment above computeDashboardData).
const getCachedDashboardData = unstable_cache(
  computeDashboardData,
  ['admin-dashboard'],
  { tags: [CACHE_TAGS.leads, CACHE_TAGS.appointments, CACHE_TAGS.payments, CACHE_TAGS.employees], revalidate: 60 },
);

export async function GET(request: NextRequest) {
  // This is the single API backing the CEO, Branch Manager, Counselor, and
  // Digital Marketing dashboards (see each dashboard component's fetch call)
  // and used to have no auth check at all - a bare, unauthenticated request
  // got full company-wide totals/revenue/branch performance/top-employee
  // leaderboard, and a `?employeeId=<id>` query param (never actually sent
  // by any real caller - grepped every fetch site) let anyone view any
  // specific employee's personal pipeline with zero ownership check. Removed
  // the employeeId override entirely and now always derive identity from the
  // verified session token.
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const userId   = auth.id;
    const userRole = auth.role ?? 0;
    const userType = String(auth.type || '');
    const userBranch = auth.branch ?? 0;
    const cat = userRole === 1 ? 'admin' : roleCategory(userType);

    // ── Optional date-range filter (e.g. "this month") ────────────────────────
    // Absent by default (all-time) — the dashboard UI passes an explicit
    // dateFrom/dateTo (defaulting itself to the 1st-to-last-day of the current
    // month), but the API stays unscoped when neither is given so any other
    // caller keeps today's lifetime-totals behavior.
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const data = await getCachedDashboardData(cat, userBranch, userId, dateFromParam, dateToParam);

    return NextResponse.json({
      ...data.stats,
      success: true,
      data,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
