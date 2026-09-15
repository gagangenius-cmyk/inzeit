import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { unstable_cache } from 'next/cache';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { canViewAllBranches } from '@/lib/roleChecks';
import { CACHE_TAGS } from '@/lib/reportCache';

let dbInitialized = false;
const ensureDB = async () => {
  if (!dbInitialized) { await connectDB(); dbInitialized = true; }
};
const n = (v: unknown) => Number(v || 0);

// Pulled out of the route handler so it can be wrapped in unstable_cache
// below. This page already polls every 30s client-side
// (src/components/monitoring/ActivityMonitor.tsx) expecting genuinely live
// numbers, so its safety-net TTL is intentionally much shorter than the
// other dashboard/report caches (15s vs. 60s) - still meaningfully reduces
// repeat-viewer DB load without making the "live" feed noticeably staler
// than its own poll interval already tolerates.
async function computeMonitoringData(scopeToBranch: boolean, userBranch: number) {
  await ensureDB();

  const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const leadBranchFilter = scopeToBranch ? 'AND l.branch = :branch' : '';
    const bareLeadBranchFilter = scopeToBranch ? 'AND branch = :branch' : '';
    const employeeBranchFilter = scopeToBranch ? 'AND e.branch = :branch' : '';
    const apptTableBranchFilter = scopeToBranch ? 'AND a.branch = :branch' : '';
    const bareApptBranchFilter = scopeToBranch ? 'AND branch = :branch' : '';
    const branchRep = { branch: userBranch };

    const [
      kpis,
      recentLeadsRows,
      counselorActivityRows,
      todayApptRows,
      overdueFollowupRows,
      unassignedLeadsRow,
      statusChangeRows,
      appointmentSummaryRow,
    ] = await Promise.all([

      // ── KPI summary ─────────────────────────────────────────────────────────
      sequelize.query<{
        today_leads: number; week_leads: number;
        today_converted: number; week_converted: number;
        overdue_followups: number; pending_appts: number;
        unassigned: number; total_active: number;
      }>(
        `SELECT
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) = :today THEN 1 ELSE 0 END) AS today_leads,
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) >= :weekAgo THEN 1 ELSE 0 END) AS week_leads,
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) = :today
               AND (l.status IN ('Converted','converted','Retained','retained','Client','client') OR l.opportunity_status='won') THEN 1 ELSE 0 END) AS today_converted,
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) >= :weekAgo
               AND (l.status IN ('Converted','converted','Retained','retained','Client','client') OR l.opportunity_status='won') THEN 1 ELSE 0 END) AS week_converted,
          SUM(CASE WHEN l.followupstat=0 AND l.followup IS NOT NULL AND DATE(l.followup) < :today THEN 1 ELSE 0 END) AS overdue_followups,
          0 AS pending_appts,
          SUM(CASE WHEN (l.assignTo IS NULL OR l.assignTo=0) AND l.status NOT IN ('Converted','converted','Retained','retained','Client','client') THEN 1 ELSE 0 END) AS unassigned,
          SUM(CASE WHEN l.status NOT IN ('Converted','converted','Retained','retained','Client','client','Closed','closed') THEN 1 ELSE 0 END) AS total_active
        FROM crm_forum_leads l
        WHERE 1=1 ${leadBranchFilter}`,
        { replacements: { today, weekAgo, ...branchRep }, type: QueryTypes.SELECT }
      ),

      // ── Recent lead activity (last 24h) ─────────────────────────────────────
      sequelize.query<{
        id: number; fname: string; lname: string; status: string; priority: string;
        assigned_to: string; branch_name: string; created: string; regdate: string;
      }>(
        `SELECT
          l.id, l.fname, l.lname,
          COALESCE(l.status,'New') AS status,
          COALESCE(l.priority,'') AS priority,
          COALESCE(e.name,'Unassigned') AS assigned_to,
          COALESCE(b.branch,'N/A') AS branch_name,
          l.created, l.regdate
        FROM crm_forum_leads l
        LEFT JOIN crm_employee e ON e.id = l.assignTo
        LEFT JOIN crm_branch b ON b.id = l.branch
        WHERE DATE(COALESCE(l.created,l.regdate)) >= :yesterday ${leadBranchFilter}
        ORDER BY COALESCE(l.created,l.regdate) DESC
        LIMIT 30`,
        { replacements: { yesterday, ...branchRep }, type: QueryTypes.SELECT }
      ),

      // ── Counselor activity summary ───────────────────────────────────────────
      sequelize.query<{
        id: number; name: string; branch_name: string;
        today_leads: number; week_leads: number; week_converted: number;
        today_appts: number;
      }>(
        `SELECT
          e.id, e.name,
          COALESCE(b.branch,'N/A') AS branch_name,
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) = :today THEN 1 ELSE 0 END) AS today_leads,
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) >= :weekAgo THEN 1 ELSE 0 END) AS week_leads,
          SUM(CASE WHEN DATE(COALESCE(l.created,l.regdate)) >= :weekAgo
               AND (l.status IN ('Converted','converted','Retained','retained','Client','client') OR l.opportunity_status='won') THEN 1 ELSE 0 END) AS week_converted,
          (SELECT COUNT(*) FROM appointments a WHERE a.counsilorid=e.id AND DATE(a.date)=:today) AS today_appts
        FROM crm_employee e
        LEFT JOIN crm_branch b ON b.id = e.branch
        LEFT JOIN crm_forum_leads l ON (l.assignTo=e.id OR l.Counsilor=e.id)
        WHERE e.status=1 ${employeeBranchFilter}
        GROUP BY e.id, e.name, b.branch
        HAVING week_leads > 0 OR today_appts > 0
        ORDER BY week_leads DESC
        LIMIT 15`,
        { replacements: { today, weekAgo, ...branchRep }, type: QueryTypes.SELECT }
      ),

      // ── Today's appointments ─────────────────────────────────────────────────
      sequelize.query<{
        id: number; leadid: number; fname: string; lname: string;
        phone: string; appointtime: string; done: number; not_done: number;
        counselor_name: string; branch_name: string;
      }>(
        `SELECT
          a.id, a.leadid,
          l.fname, l.lname, COALESCE(l.phone,l.mobile,'') AS phone,
          a.appointtime,
          COALESCE(a.done,0) AS done,
          COALESCE(a.not_done,0) AS not_done,
          COALESCE(e.name,'Unassigned') AS counselor_name,
          COALESCE(b.branch,'N/A') AS branch_name
        FROM appointments a
        LEFT JOIN crm_forum_leads l ON l.id = a.leadid
        LEFT JOIN crm_employee e ON e.id = a.counsilorid
        LEFT JOIN crm_branch b ON b.id = a.branch
        WHERE DATE(a.date) = :today ${apptTableBranchFilter}
        ORDER BY a.appointtime ASC
        LIMIT 50`,
        { replacements: { today, ...branchRep }, type: QueryTypes.SELECT }
      ),

      // ── Overdue follow-ups ───────────────────────────────────────────────────
      sequelize.query<{
        id: number; lead_id: number; fname: string; lname: string;
        reminder_date: string; message: string; employee_name: string; priority: string;
      }>(
        `SELECT
          r.id, r.lead_id,
          l.fname, l.lname,
          r.reminder_date, r.message,
          COALESCE(e.name,'Unassigned') AS employee_name,
          COALESCE(r.priority,'medium') AS priority
        FROM crm_follow_up_reminders r
        LEFT JOIN crm_forum_leads l ON l.id = r.lead_id
        LEFT JOIN crm_employee e ON e.id = r.user_id
        WHERE DATE(r.reminder_date) < :today
          AND (r.status IS NULL OR r.status NOT IN ('completed','done','cancelled'))
          ${leadBranchFilter}
        ORDER BY r.reminder_date ASC
        LIMIT 20`,
        { replacements: { today, ...branchRep }, type: QueryTypes.SELECT }
      ),

      // ── Unassigned leads count ────────────────────────────────────────────────
      sequelize.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM crm_forum_leads
        WHERE (assignTo IS NULL OR assignTo=0)
          AND status NOT IN ('Converted','converted','Retained','retained','Client','client','Closed','closed')
          ${bareLeadBranchFilter}`,
        { replacements: branchRep, type: QueryTypes.SELECT }
      ),

      // ── Status change breakdown today ─────────────────────────────────────────
      sequelize.query<{ status: string; count: number }>(
        `SELECT COALESCE(status,'Unknown') AS status, COUNT(*) AS count
        FROM crm_forum_leads
        WHERE DATE(COALESCE(created,regdate)) = :today ${bareLeadBranchFilter}
        GROUP BY status
        ORDER BY count DESC`,
        { replacements: { today, ...branchRep }, type: QueryTypes.SELECT }
      ),

      // ── Appointment summary ────────────────────────────────────────────────────
      sequelize.query<{ total: number; done: number; not_done: number; pending: number }>(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN done=1 THEN 1 ELSE 0 END) AS done,
          SUM(CASE WHEN not_done=1 THEN 1 ELSE 0 END) AS not_done,
          SUM(CASE WHEN COALESCE(done,0)=0 AND COALESCE(not_done,0)=0 THEN 1 ELSE 0 END) AS pending
        FROM appointments
        WHERE DATE(date) = :today ${bareApptBranchFilter}`,
        { replacements: { today, ...branchRep }, type: QueryTypes.SELECT }
      ),
    ]);

    const k = kpis[0] || {};
    const apptSummary = appointmentSummaryRow[0] || {};

    // Build alerts
    const alerts: Array<{ type: string; title: string; message: string; severity: string }> = [];
    if (n(k.overdue_followups) > 0) {
      alerts.push({ type: 'follow_up', title: 'Overdue Follow-ups', message: `${n(k.overdue_followups)} follow-ups past due date`, severity: 'high' });
    }
    if (n(k.unassigned) > 5) {
      alerts.push({ type: 'unassigned', title: 'Unassigned Leads', message: `${n(k.unassigned)} leads have no counselor assigned`, severity: n(k.unassigned) > 20 ? 'high' : 'medium' });
    }
    if (n(apptSummary.not_done) > 0) {
      alerts.push({ type: 'appointment', title: 'Missed Appointments', message: `${n(apptSummary.not_done)} appointments marked not-done today`, severity: 'medium' });
    }

    return {
      kpis: {
        todayLeads: n(k.today_leads),
        weekLeads: n(k.week_leads),
        todayConverted: n(k.today_converted),
        weekConverted: n(k.week_converted),
        overdueFollowups: n(k.overdue_followups),
        unassignedLeads: n(k.unassigned),
        totalActiveLeads: n(k.total_active),
        todayAppointments: n(apptSummary.total),
        completedAppointments: n(apptSummary.done),
        pendingAppointments: n(apptSummary.pending),
        missedAppointments: n(apptSummary.not_done),
      },
      recentActivity: recentLeadsRows.map(r => ({
        id: r.id,
        name: `${r.fname} ${r.lname}`.trim(),
        status: r.status,
        priority: r.priority,
        assignedTo: r.assigned_to,
        branch: r.branch_name,
        timestamp: r.created || r.regdate,
      })),
      counselorActivity: counselorActivityRows.map(r => ({
        id: r.id,
        name: r.name,
        branch: r.branch_name,
        todayLeads: n(r.today_leads),
        weekLeads: n(r.week_leads),
        weekConverted: n(r.week_converted),
        conversionRate: n(r.week_leads) > 0 ? parseFloat(((n(r.week_converted) / n(r.week_leads)) * 100).toFixed(1)) : 0,
        todayAppointments: n(r.today_appts),
      })),
      todayAppointments: todayApptRows.map(r => ({
        id: r.id,
        leadId: r.leadid,
        client: `${r.fname || ''} ${r.lname || ''}`.trim() || `Lead #${r.leadid}`,
        phone: r.phone,
        time: r.appointtime ? String(r.appointtime).slice(0, 5) : '--:--',
        status: r.done === 1 ? 'Completed' : r.not_done === 1 ? 'Not Done' : 'Pending',
        counselor: r.counselor_name,
        branch: r.branch_name,
      })),
      overdueFollowups: overdueFollowupRows.map(r => ({
        id: r.id,
        leadId: r.lead_id,
        client: `${r.fname || ''} ${r.lname || ''}`.trim(),
        dueDate: r.reminder_date,
        message: r.message,
        assignedTo: r.employee_name,
        priority: r.priority,
      })),
      statusBreakdown: statusChangeRows.map(r => ({ status: r.status, count: n(r.count) })),
      alerts,
      generatedAt: new Date().toISOString(),
    };
}

const getCachedMonitoringData = unstable_cache(
  computeMonitoringData,
  ['monitoring'],
  { tags: [CACHE_TAGS.leads, CACHE_TAGS.appointments, CACHE_TAGS.employees], revalidate: 15 },
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['monitoring.view']);
  if (isAuthError(auth)) return auth;
  try {
    // Required auth, but applied zero branch scoping - every one of the 8
    // queries this used to run company-wide for any authenticated holder of
    // monitoring.view, so a Branch Manager (or anyone else without
    // canViewAllBranches) saw every branch's live activity feed and every
    // colleague's stats, not just their own branch.
    const scopeToBranch = !canViewAllBranches(auth);
    const userBranch = Number(auth.branch || 0);

    const data = await getCachedMonitoringData(scopeToBranch, userBranch);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[monitoring] error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
