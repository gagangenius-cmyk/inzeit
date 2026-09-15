import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { previewLeadAssignment, resolveLeadAssignment } from '@/lib/assignmentRuleEngine';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isFoeOrBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { recordLeadAssignment } from '@/lib/leadRemarks';
import { ensureEmployeeAttendanceTable, CHECKED_IN_TODAY_SQL } from '@/lib/employeeAttendanceTable';
import { HRService } from '@/services/hr-service';

interface LeadAttributes {
  branch: number | null;
  market_source: number | null;
  priority: string | null;
  lead_quality: string | null;
  country_interest: number | null;
  service_interest: number | null;
}

async function loadLeadAttributes(leadId: number | null): Promise<LeadAttributes | null> {
  if (!leadId) return null;
  const [row] = await sequelize.query<LeadAttributes>(
    'SELECT branch, market_source, priority, lead_quality, country_interest, service_interest FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
    { replacements: { leadId }, type: QueryTypes.SELECT }
  );
  return row || null;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const leadId = Number.parseInt(searchParams.get('leadId') || '', 10) || null;
    const leadAttrs = await loadLeadAttributes(leadId);
    const branchId = Number.parseInt(searchParams.get('branchId') || '', 10) || leadAttrs?.branch || 1;
    // This is a preview for the admin UI. Do not consume a turn until a lead is actually assigned.
    const assignment = await previewLeadAssignment({
      branchId,
      sourceId: leadAttrs?.market_source ?? null,
      priority: leadAttrs?.priority ?? null,
      leadQuality: leadAttrs?.lead_quality ?? null,
      countryInterestId: leadAttrs?.country_interest ?? null,
      serviceInterestId: leadAttrs?.service_interest ?? null,
    });

    await Promise.all([ensureEmployeeAttendanceTable(), HRService.ensureAttendanceRecordTable()]);
    const candidates = await sequelize.query(
      `SELECT
          e.id,
          e.name,
          e.email,
          e.branch,
          COUNT(l.id) AS openLeadCount
        FROM crm_employee e
        LEFT JOIN crm_forum_leads l
          ON l.assignTo = e.id
          AND COALESCE(l.status, '') NOT IN ('Converted', 'Closed', 'Lost', 'client', 'retained')
        WHERE e.status = 1 AND e.branch = :branchId
          AND ${CHECKED_IN_TODAY_SQL}
        GROUP BY e.id, e.name, e.email, e.branch
        ORDER BY openLeadCount ASC, e.name ASC`,
      {
        replacements: { branchId: assignment.branchId },
        type: QueryTypes.SELECT,
      }
    );

    return NextResponse.json({ success: true, assignment, candidates });
  } catch (error: any) {
    console.error('Lead auto-assignment lookup failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve lead assignment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  if (!isFoeOrBranchManagerOrCeo(auth)) {
    return NextResponse.json({ success: false, error: 'Only FOE, Branch Manager, or CEO can assign leads' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const leadId = Number.parseInt(String(body.leadId || ''), 10);
    const branchId = Number.parseInt(String(body.branchId || body.branch || '1'), 10);

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const [existing] = await sequelize.query<{ assignTo: number | null; branch: number | null }>(
      'SELECT assignTo, branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    // FOE/Branch Manager may only auto-assign within their own branch - the
    // caller-supplied branchId (used to be trusted outright) and the lead's
    // own current branch must both match auth.branch. CEO is unrestricted.
    if (!isCeo(auth)) {
      if (Number(auth.branch || 0) !== branchId) {
        return NextResponse.json({ success: false, error: 'You can only auto-assign leads within your own branch' }, { status: 403 });
      }
      if (existing && existing.branch !== null && Number(existing.branch) !== Number(auth.branch || 0)) {
        return NextResponse.json({ success: false, error: 'You can only auto-assign leads in your own branch' }, { status: 403 });
      }
    }

    const leadAttrs = await loadLeadAttributes(leadId);
    const assignment = await resolveLeadAssignment({
      branchId,
      forceAutoAssign: true,
      roundRobin: true,
      sourceId: leadAttrs?.market_source ?? null,
      priority: leadAttrs?.priority ?? null,
      leadQuality: leadAttrs?.lead_quality ?? null,
      countryInterestId: leadAttrs?.country_interest ?? null,
      serviceInterestId: leadAttrs?.service_interest ?? null,
    });
    const oldAssignTo = existing?.assignTo !== null && existing?.assignTo !== undefined ? Number(existing.assignTo) : null;

    await sequelize.query(
      `UPDATE crm_forum_leads
       SET assignTo = :employeeId,
           Counsilor = :employeeId,
           branch = :branchId,
           last_updated = :updatedDate,
           last_updtd_time = :updatedTime
       WHERE id = :leadId`,
      {
        replacements: {
          employeeId: assignment.assignedEmployeeId,
          branchId: assignment.branchId,
          leadId,
          updatedDate: new Date().toISOString().split('T')[0],
          updatedTime: new Date().toTimeString().split(' ')[0],
        },
      }
    );

    await recordLeadAssignment({
      leadId,
      oldAssignTo,
      newAssignTo: assignment.assignedEmployeeId ?? null,
      actorId: auth.id,
      actorRole: auth.roleName || auth.type,
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    console.error('Lead auto-assignment update failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to auto assign lead' },
      { status: 500 }
    );
  }
}
