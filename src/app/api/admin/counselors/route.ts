import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };
const n = (v: unknown) => Number(v || 0);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['counselors.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || '';
    const status = searchParams.get('status') || '';
    const today = new Date().toISOString().slice(0, 10);

    const conditions: string[] = [];
    const replacements: Record<string, unknown> = { today };
    // Branch Manager is clamped to their own branch regardless of ?branch= -
    // CEO and any other counselors.manage holder (finance/admin tier) may
    // pick any branch or leave it unset for all.
    const isBmScoped = isBranchManagerOrCeo(auth) && !isCeo(auth);
    if (isBmScoped) {
      conditions.push(`e.branch = :branch`);
      replacements.branch = Number(auth.branch || 0);
    } else if (branch) {
      conditions.push(`e.branch = :branch`);
      replacements.branch = Number(branch);
    }
    if (status === 'active') conditions.push(`e.status = 1`);
    else if (status === 'inactive') conditions.push(`e.status != 1`);
    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const rows = await sequelize.query<{
      id: number; name: string; email: string; mobile: string;
      type: string; branch_id: number; branch_name: string; region_name: string;
      department_name: string; status: number; photo: string; doj: string;
      total_leads: number; converted_leads: number;
      today_appts: number; pending_followups: number; wfh: number;
    }>(
      `SELECT
        e.id, e.name,
        COALESCE(e.email,'') AS email,
        COALESCE(e.mobile,'') AS mobile,
        COALESCE(r.name,'') AS type,
        COALESCE(e.branch,0) AS branch_id,
        COALESCE(b.branch,'N/A') AS branch_name,
        COALESCE(reg.name,'N/A') AS region_name,
        COALESCE(d.name,'') AS department_name,
        COALESCE(e.status,0) AS status,
        COALESCE(e.photo,'') AS photo,
        COALESCE(e.doj,'') AS doj,
        COALESCE(e.wfh,0) AS wfh,
        COUNT(DISTINCT l.id) AS total_leads,
        SUM(CASE WHEN l.status IN ('Converted','converted','Retained','retained','Client','client')
             OR l.opportunity_status='won' THEN 1 ELSE 0 END) AS converted_leads,
        (SELECT COUNT(*) FROM appointments a WHERE a.counsilorid=e.id AND DATE(a.date)=:today) AS today_appts,
        (SELECT COUNT(*) FROM crm_follow_up_reminders fu WHERE fu.user_id=e.id
           AND DATE(fu.reminder_date) <= :today AND (fu.status IS NULL OR fu.status='pending')) AS pending_followups
      FROM crm_employee e
      LEFT JOIN crm_role r ON r.id = e.role
      LEFT JOIN crm_branch b ON b.id = e.branch
      LEFT JOIN crm_region reg ON reg.id = e.region
      LEFT JOIN crm_department d ON d.id = e.department
      LEFT JOIN crm_forum_leads l ON (l.assignTo = e.id OR l.Counsilor = e.id)
      WHERE 1=1 ${where}
      GROUP BY e.id, e.name, e.email, e.mobile, r.name, e.branch, b.branch, reg.name, d.name, e.status, e.photo, e.doj, e.wfh
      ORDER BY total_leads DESC, e.name ASC`,
      { replacements, type: QueryTypes.SELECT }
    );

    const counselors = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      mobile: r.mobile,
      type: r.type,
      branchId: r.branch_id,
      branch: r.branch_name,
      region: r.region_name,
      department: r.department_name,
      status: n(r.status),
      photo: r.photo,
      doj: r.doj,
      wfh: n(r.wfh),
      totalLeads: n(r.total_leads),
      convertedLeads: n(r.converted_leads),
      conversionRate: n(r.total_leads) > 0
        ? parseFloat(((n(r.converted_leads) / n(r.total_leads)) * 100).toFixed(1))
        : 0,
      todayAppointments: n(r.today_appts),
      pendingFollowups: n(r.pending_followups),
    }));

    const total = counselors.length;
    const active = counselors.filter(c => c.status === 1).length;
    const avgConversion = total > 0
      ? parseFloat((counselors.reduce((s, c) => s + c.conversionRate, 0) / total).toFixed(1))
      : 0;
    const totalLeads = counselors.reduce((s, c) => s + c.totalLeads, 0);

    return NextResponse.json({
      counselors,
      summary: { total, active, avgConversion, totalLeads },
    });
  } catch (error: any) {
    console.error('[counselors] error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
