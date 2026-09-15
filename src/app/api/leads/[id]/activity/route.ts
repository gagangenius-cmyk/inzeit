import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getRecordVisibilityScope } from '@/lib/roleChecks';

let dbInitialized = false;

const ensureDBConnection = async () => {
  if (!dbInitialized) {
    await connectDB();
    dbInitialized = true;
  }
};

const numberValue = (value: unknown) => Number(value || 0);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDBConnection();
    const { id } = await params;
    const leadId = Number(id);

    if (!leadId) {
      return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });
    }

    // Branch/region-scoped roles must not be able to pull another branch's
    // appointment/follow-up/remark history just by knowing a lead ID - this
    // route previously had no ownership check at all (see the leaked AUH
    // appointment surfaced to a Dubai branch manager via this endpoint).
    const scope = getRecordVisibilityScope(auth);
    if (scope !== 'all') {
      const [leadRow] = await sequelize.query<{ branch: number | null; region: number | null; assignTo: number | null; Counsilor: number | null }>(`
        SELECT branch, region, assignTo, Counsilor
        FROM crm_forum_leads
        WHERE id = :leadId
        LIMIT 1
      `, {
        replacements: { leadId },
        type: QueryTypes.SELECT
      });

      if (!leadRow) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      const allowed = scope === 'branch'
        ? Number(leadRow.branch) === Number(auth.branch)
        : scope === 'region'
          ? Number(leadRow.region) === Number(auth.region)
          : Number(leadRow.Counsilor) === Number(auth.id) || Number(leadRow.assignTo) === Number(auth.id);

      if (!allowed) {
        return NextResponse.json({ error: 'You do not have access to this lead' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    // Callers that only need one section (e.g. the opportunity flow's remarks
    // panel, which only cares about activityLog) can skip the rest via
    // ?sections=activityLog. No `sections` param = every section, same as
    // before, so existing callers (LeadManagement's activity modal) are unaffected.
    const sectionsParam = searchParams.get('sections');
    const sections = sectionsParam ? new Set(sectionsParam.split(',').map((s) => s.trim())) : null;
    const wants = (name: string) => !sections || sections.has(name);

    // Paginated crm_remarks — defaults (50/0) match the old unconditional
    // LIMIT 50 so callers that don't pass these params see no change.
    const remarksLimit = Math.min(Math.max(Number(searchParams.get('remarksLimit')) || 50, 1), 200);
    const remarksOffset = Math.max(Number(searchParams.get('remarksOffset')) || 0, 0);

    const appointments = wants('appointments') ? await sequelize.query<any>(`
      SELECT
        a.id,
        a.leadid,
        a.date,
        a.appointtime,
        a.counsilorid,
        a.booked,
        a.done,
        a.not_done,
        a.screenshot,
        e.name AS counselorName,
        b.branch AS branchName,
        r.name AS regionName
      FROM appointments a
      LEFT JOIN crm_employee e ON e.id = a.counsilorid
      LEFT JOIN crm_branch b ON b.id = a.branch
      LEFT JOIN crm_region r ON r.id = a.region
      WHERE a.leadid = :leadId
      ORDER BY a.date DESC, a.appointtime DESC
      LIMIT 20
    `, {
      replacements: { leadId },
      type: QueryTypes.SELECT
    }) : [];

    const followUps = wants('followUps') ? await sequelize.query<any>(`
      SELECT
        r.id,
        r.lead_id,
        r.user_id,
        r.reminder_date,
        r.message,
        r.status,
        r.priority,
        r.completed_at,
        e.name AS employeeName
      FROM crm_follow_up_reminders r
      LEFT JOIN crm_employee e ON e.id = r.user_id
      WHERE r.lead_id = :leadId
      ORDER BY r.reminder_date DESC
      LIMIT 20
    `, {
      replacements: { leadId },
      type: QueryTypes.SELECT
    }) : [];

    const remarks = wants('remarks') ? await sequelize.query<any>(`
      SELECT
        rm.id,
        rm.\`lead\`,
        rm.\`date\`,
        rm.created,
        rm.remark,
        rm.emp,
        rm.\`status\`,
        e.name AS employeeName
      FROM crm_forum_leads_remarks rm
      LEFT JOIN crm_employee e ON e.id = rm.emp
      WHERE rm.\`lead\` = :leadId
      ORDER BY rm.\`date\` DESC, rm.created DESC, rm.id DESC
      LIMIT 30
    `, {
      replacements: { leadId },
      type: QueryTypes.SELECT
    }) : [];

    let activityLog: any[] = [];
    let activityLogTotal = 0;
    if (wants('activityLog')) {
      activityLog = await sequelize.query<any>(`
        SELECT
          ar.id,
          ar.lead_id,
          ar.action,
          ar.remark,
          ar.previous_value,
          ar.new_value,
          ar.actor_id,
          ar.actor_role,
          ar.created_at,
          e.name AS actorName
        FROM crm_remarks ar
        LEFT JOIN crm_employee e ON e.id = ar.actor_id
        WHERE ar.lead_id = :leadId
        ORDER BY ar.created_at DESC, ar.id DESC
        LIMIT ${remarksLimit} OFFSET ${remarksOffset}
      `, {
        replacements: { leadId },
        type: QueryTypes.SELECT
      });

      const [countRow] = await sequelize.query<{ total: number }>(`
        SELECT COUNT(*) AS total FROM crm_remarks WHERE lead_id = :leadId
      `, {
        replacements: { leadId },
        type: QueryTypes.SELECT
      });
      activityLogTotal = Number(countRow?.total || 0);
    }

    return NextResponse.json({
      appointments,
      followUps,
      remarks,
      activityLog,
      activityLogTotal,
      summary: {
        appointments: appointments.length,
        fixedAppointments: appointments.filter((item) => numberValue(item.booked) === 1 && numberValue(item.done) === 0 && numberValue(item.not_done) === 0).length,
        completedAppointments: appointments.filter((item) => numberValue(item.done) === 1).length,
        followUps: followUps.length,
        pendingFollowUps: followUps.filter((item) => String(item.status || '').toLowerCase() === 'pending').length,
        remarks: remarks.length,
        activityLog: activityLog.length
      }
    });
  } catch (error) {
    console.error('Error fetching lead activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead activity' },
      { status: 500 }
    );
  }
}
