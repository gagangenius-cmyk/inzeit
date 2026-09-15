import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';
import { resolveVisaTypeBucket, VISA_TYPE_BUCKETS, type VisaTypeBucket } from '@/lib/opsVisaType';

const CLIENT_STATUSES = ['Active', 'Expired', 'Dormant but Active', 'Renewals', 'Refunds', 'Close'] as const;
type ClientStatus = typeof CLIENT_STATUSES[number];

const DORMANT_AFTER_DAYS = 90;

// crm_branch.branch holds the operating location, matching the dashboard's 5
// locations 1:1 except this org's India branch, which is always displayed as
// its actual city (Hyderabad) rather than the country name.
const toLocationLabel = (country: string | null) => (country === 'India' ? 'Hyderabad' : country || 'Unknown');

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
};

const emptyVisaRow = () => {
  const row: Record<string, number> = { total: 0 };
  VISA_TYPE_BUCKETS.forEach((v) => { row[v] = 0; });
  return row;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get('branch');

    const currentUserRole = String(auth.type || '').toLowerCase().replace(/[\s-]+/g, '_');
    const isProcessCoordinator = ['process_coordinator', 'case_officer'].includes(currentUserRole);
    // Process Coordinator/Team Leader/CPO/Assistant Branch Manager/Sr Branch
    // Co-ordinator get full, unrestricted Operations visibility per explicit
    // business request — see the matching change in
    // src/app/api/admin/operations/search/route.ts.
    const canViewAll =
      auth.role === 1 ||
      isCeo(auth) ||
      [
        'admin', 'administrator', 'super_admin', 'director_of_sales', 'director', 'dos', 'founder', 'director_of_operations', 'operation_manager',
        // 'area_manager' (the post-restructuring sibling of Team Leader) was
        // missing here - see the matching fix in
        // src/app/api/admin/operations/search/route.ts.
        'process_coordinator', 'team_leader', 'area_manager', 'cpo', 'assistant_branch_manager', 'sr_branch_coordinator',
      ].includes(currentUserRole);
    const isBranchScoped = !canViewAll && !isProcessCoordinator && ['branch_manager', 'bm', 'foe'].includes(currentUserRole);

    const clientWhere: string[] = [
      "(LOWER(COALESCE(o.status, '')) = 'won' OR LOWER(COALESCE(o.retentionStatus, '')) = 'approved' OR LOWER(COALESCE(l.status, '')) IN ('retained', 'client', 'converted'))",
    ];
    const replacements: Record<string, unknown> = {};

    if (isProcessCoordinator && !canViewAll) {
      clientWhere.push('l.case_officer = :caseOfficerId');
      replacements.caseOfficerId = auth.id;
    } else if (isBranchScoped) {
      clientWhere.push('l.branch = :userBranch');
      replacements.userBranch = auth.branch;
    }

    if (branchFilter) {
      clientWhere.push('l.branch = :branchFilter');
      replacements.branchFilter = Number.parseInt(branchFilter, 10);
    }

    // ---- Clients (won cases) ----
    const clientRows = await sequelize.query<{
      leadId: number;
      fname: string;
      lname: string;
      leadStatus: string | null;
      renDate: string | null;
      renExpiryDate: string | null;
      renew_type: string | null;
      last_updated: string | null;
      branch: number;
      branchCountry: string | null;
      service_interest: number | null;
      opportunityId: number;
      opportunityStatus: string | null;
      serviceType: string | null;
      serviceRequired: string | null;
      opportunityName: string | null;
      opportunityUpdatedAt: string | null;
      refundCount: number;
      rmsStageCount: number;
    }>(
      `SELECT
        l.id AS leadId,
        l.fname, l.lname,
        l.status AS leadStatus,
        l.renDate, l.renExpiryDate, l.renew_type, l.last_updated,
        l.branch,
        b.branch AS branchCountry,
        l.service_interest,
        o.id AS opportunityId,
        o.status AS opportunityStatus,
        o.serviceType, o.serviceRequired, o.opportunityName,
        o.updatedAt AS opportunityUpdatedAt,
        (SELECT COUNT(*) FROM crm_refunds r WHERE r.leadId = l.id) AS refundCount,
        (SELECT COUNT(*) FROM crm_operation_stage_data osd WHERE osd.leadId = l.id AND osd.module IN ('ops-rms-operations', 'rms-operations', 'rms')) AS rmsStageCount
      FROM crm_opportunities o
      INNER JOIN crm_forum_leads l ON l.id = o.leadId
      LEFT JOIN crm_branch b ON b.id = l.branch
      WHERE ${clientWhere.join(' AND ')}`,
      { replacements, type: QueryTypes.SELECT }
    );

    const now = Date.now();
    const clientMatrix: Record<ClientStatus, Record<string, number>> = {
      'Active': emptyVisaRow(),
      'Expired': emptyVisaRow(),
      'Dormant but Active': emptyVisaRow(),
      'Renewals': emptyVisaRow(),
      'Refunds': emptyVisaRow(),
      'Close': emptyVisaRow(),
    };

    const classifiedClients = clientRows.map((row) => {
      const visaType = resolveVisaTypeBucket({
        serviceId: row.service_interest,
        serviceName: row.serviceType || row.serviceRequired || row.opportunityName,
        hasRmsStage: Number(row.rmsStageCount) > 0,
      });

      let status: ClientStatus;
      const renExpiry = parseDate(row.renExpiryDate);
      const leadStatusLower = (row.leadStatus || '').toLowerCase();
      if (Number(row.refundCount) > 0) {
        status = 'Refunds';
      } else if ((row.opportunityStatus || '').toLowerCase() === 'closed' || ['closed', 'close'].includes(leadStatusLower)) {
        status = 'Close';
      } else if (renExpiry && renExpiry.getTime() < now) {
        status = 'Expired';
      } else if (row.renDate || row.renew_type) {
        status = 'Renewals';
      } else {
        const lastActivity = parseDate(row.last_updated) || parseDate(row.opportunityUpdatedAt);
        const daysSinceActivity = lastActivity ? (now - lastActivity.getTime()) / (1000 * 60 * 60 * 24) : null;
        status = daysSinceActivity !== null && daysSinceActivity > DORMANT_AFTER_DAYS ? 'Dormant but Active' : 'Active';
      }

      clientMatrix[status][visaType] += 1;
      clientMatrix[status].total += 1;

      return {
        leadId: row.leadId,
        opportunityId: row.opportunityId,
        name: [row.fname, row.lname].filter(Boolean).join(' ').trim(),
        branchId: row.branch,
        location: toLocationLabel(row.branchCountry),
        visaType,
        status,
      };
    });

    const visaTypeTotals: Record<string, number> = emptyVisaRow();
    CLIENT_STATUSES.forEach((status) => {
      VISA_TYPE_BUCKETS.forEach((visaType) => {
        visaTypeTotals[visaType] += clientMatrix[status][visaType];
      });
      visaTypeTotals.total += clientMatrix[status].total;
    });

    // ---- Tasks ----
    const taskWhere: string[] = [];
    const taskReplacements: Record<string, unknown> = {};
    if (isBranchScoped) {
      taskWhere.push('e.branch = :userBranch');
      taskReplacements.userBranch = auth.branch;
    }
    if (branchFilter) {
      taskWhere.push('e.branch = :branchFilter');
      taskReplacements.branchFilter = Number.parseInt(branchFilter, 10);
    }

    const taskRows = await sequelize.query<{ status: string; visa_type: string | null; branchId: number | null; branchCountry: string | null }>(
      `SELECT t.status, t.visa_type, e.branch AS branchId, b.branch AS branchCountry
       FROM crm_task t
       LEFT JOIN crm_employee e ON e.id = t.asignTo
       LEFT JOIN crm_branch b ON b.id = e.branch
       ${taskWhere.length ? `WHERE ${taskWhere.join(' AND ')}` : ''}`,
      { replacements: taskReplacements, type: QueryTypes.SELECT }
    );

    const isTaskCompleted = (status: string) => ['1', 'completed'].includes((status || '').toLowerCase());
    const taskMatrix: Record<string, { assigned: number; completed: number }> = {};
    VISA_TYPE_BUCKETS.forEach((v) => { taskMatrix[v] = { assigned: 0, completed: 0 }; });
    let taskTotal = 0;
    let taskCompleted = 0;
    let taskUnclassified = 0;

    taskRows.forEach((row) => {
      taskTotal += 1;
      const completed = isTaskCompleted(row.status);
      if (completed) taskCompleted += 1;
      const visaType = row.visa_type as VisaTypeBucket | null;
      if (visaType && taskMatrix[visaType]) {
        taskMatrix[visaType].assigned += 1;
        if (completed) taskMatrix[visaType].completed += 1;
      } else {
        taskUnclassified += 1;
      }
    });

    const taskMatrixOut: Record<string, { assigned: number; completed: number; pending: number; productivity: number }> = {};
    VISA_TYPE_BUCKETS.forEach((v) => {
      const { assigned, completed } = taskMatrix[v];
      taskMatrixOut[v] = {
        assigned,
        completed,
        pending: assigned - completed,
        productivity: assigned ? Math.round((completed / assigned) * 100) : 0,
      };
    });

    // ---- Staff ----
    const staffWhere: string[] = [];
    const staffReplacements: Record<string, unknown> = {};
    if (branchFilter) {
      staffWhere.push('b.id = :branchFilter');
      staffReplacements.branchFilter = Number.parseInt(branchFilter, 10);
    }
    const staffRows = await sequelize.query<{ id: number; country: string | null; staffCount: number }>(
      `SELECT b.id, b.branch AS country, COUNT(e.id) AS staffCount
       FROM crm_branch b
       LEFT JOIN crm_employee e ON e.branch = b.id AND e.status = 1
       ${staffWhere.length ? `WHERE ${staffWhere.join(' AND ')}` : ''}
       GROUP BY b.id, b.branch
       ORDER BY b.id`,
      { replacements: staffReplacements, type: QueryTypes.SELECT }
    );

    const staffByLocation = staffRows.map((row) => ({
      branchId: row.id,
      location: toLocationLabel(row.country),
      count: Number(row.staffCount),
    }));
    const staffTotal = staffByLocation.reduce((sum, r) => sum + r.count, 0);

    // ---- Clients & Tasks, by branch (same branch list as staff, so a branch
    // with zero clients/tasks still shows a 0 row instead of being omitted) ----
    const clientsByBranchMap = new Map<number, { branchId: number; location: string; statusTotals: Record<ClientStatus, number>; total: number }>();
    staffRows.forEach((b) => {
      clientsByBranchMap.set(b.id, {
        branchId: b.id,
        location: toLocationLabel(b.country),
        statusTotals: Object.fromEntries(CLIENT_STATUSES.map((s) => [s, 0])) as Record<ClientStatus, number>,
        total: 0,
      });
    });
    classifiedClients.forEach((c) => {
      if (!clientsByBranchMap.has(c.branchId)) {
        clientsByBranchMap.set(c.branchId, {
          branchId: c.branchId,
          location: c.location,
          statusTotals: Object.fromEntries(CLIENT_STATUSES.map((s) => [s, 0])) as Record<ClientStatus, number>,
          total: 0,
        });
      }
      const bucket = clientsByBranchMap.get(c.branchId)!;
      bucket.statusTotals[c.status as ClientStatus] += 1;
      bucket.total += 1;
    });
    const clientsByBranch = Array.from(clientsByBranchMap.values());

    const taskBranchMap = new Map<number, { branchId: number; location: string; assigned: number; completed: number }>();
    staffRows.forEach((b) => {
      taskBranchMap.set(b.id, { branchId: b.id, location: toLocationLabel(b.country), assigned: 0, completed: 0 });
    });
    taskRows.forEach((row) => {
      if (row.branchId == null) return;
      if (!taskBranchMap.has(row.branchId)) {
        taskBranchMap.set(row.branchId, { branchId: row.branchId, location: toLocationLabel(row.branchCountry), assigned: 0, completed: 0 });
      }
      const bucket = taskBranchMap.get(row.branchId)!;
      bucket.assigned += 1;
      if (isTaskCompleted(row.status)) bucket.completed += 1;
    });
    const tasksByBranch = Array.from(taskBranchMap.values()).map((b) => ({
      ...b,
      pending: b.assigned - b.completed,
      productivity: b.assigned ? Math.round((b.completed / b.assigned) * 100) : 0,
    }));

    const employeeWhere: string[] = ['e.status = 1'];
    const employeeReplacements: Record<string, unknown> = {};
    if (branchFilter) {
      employeeWhere.push('e.branch = :branchFilter');
      employeeReplacements.branchFilter = Number.parseInt(branchFilter, 10);
    }
    const employees = await sequelize.query<{ id: number; name: string; branch: number | null }>(
      `SELECT e.id, e.name, e.branch FROM crm_employee e WHERE ${employeeWhere.join(' AND ')} ORDER BY e.name LIMIT 500`,
      { replacements: employeeReplacements, type: QueryTypes.SELECT }
    );

    // ---- Calls ----
    const callWhere: string[] = [];
    const callReplacements: Record<string, unknown> = {};
    if (branchFilter) {
      callWhere.push('cr.branch_id = :branchFilter');
      callReplacements.branchFilter = Number.parseInt(branchFilter, 10);
    }
    const callRows = await sequelize.query<{
      branchId: number;
      country: string | null;
      status: string;
      is_high_escalation: number;
    }>(
      `SELECT cr.branch_id AS branchId, b.branch AS country, cr.status, cr.is_high_escalation
       FROM crm_call_requests cr
       LEFT JOIN crm_branch b ON b.id = cr.branch_id
       ${callWhere.length ? `WHERE ${callWhere.join(' AND ')}` : ''}`,
      { replacements: callReplacements, type: QueryTypes.SELECT }
    );

    const callsByBranch = new Map<number, { branchId: number; location: string; total: number; completed: number; highEscalation: number; pending: number }>();
    staffRows.forEach((b) => {
      callsByBranch.set(b.id, { branchId: b.id, location: toLocationLabel(b.country), total: 0, completed: 0, highEscalation: 0, pending: 0 });
    });
    callRows.forEach((row) => {
      if (!callsByBranch.has(row.branchId)) {
        callsByBranch.set(row.branchId, { branchId: row.branchId, location: toLocationLabel(row.country), total: 0, completed: 0, highEscalation: 0, pending: 0 });
      }
      const bucket = callsByBranch.get(row.branchId)!;
      bucket.total += 1;
      const completed = (row.status || '').toLowerCase() === 'completed';
      if (completed) bucket.completed += 1; else bucket.pending += 1;
      if (Number(row.is_high_escalation) === 1) bucket.highEscalation += 1;
    });

    const callsByLocation = Array.from(callsByBranch.values()).map((b) => ({
      ...b,
      productivity: b.total ? Math.round((b.completed / b.total) * 100) : 0,
    }));
    const callsTotal = {
      total: callsByLocation.reduce((s, b) => s + b.total, 0),
      completed: callsByLocation.reduce((s, b) => s + b.completed, 0),
      highEscalation: callsByLocation.reduce((s, b) => s + b.highEscalation, 0),
      pending: callsByLocation.reduce((s, b) => s + b.pending, 0),
    };

    return NextResponse.json({
      success: true,
      branches: staffRows.map((b) => ({ id: b.id, location: toLocationLabel(b.country) })),
      employees,
      clients: {
        total: visaTypeTotals.total,
        statusTotals: Object.fromEntries(CLIENT_STATUSES.map((s) => [s, clientMatrix[s].total])),
        matrix: clientMatrix,
        visaTypeTotals,
        rows: classifiedClients,
        byBranch: clientsByBranch,
      },
      tasks: {
        totalAssigned: taskTotal,
        completed: taskCompleted,
        pending: taskTotal - taskCompleted,
        productivity: taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0,
        unclassified: taskUnclassified,
        matrix: taskMatrixOut,
        byBranch: tasksByBranch,
      },
      staff: {
        total: staffTotal,
        byLocation: staffByLocation,
      },
      calls: {
        ...callsTotal,
        productivity: callsTotal.total ? Math.round((callsTotal.completed / callsTotal.total) * 100) : 0,
        byLocation: callsByLocation,
      },
    });
  } catch (error: any) {
    console.error('Ops dashboard summary failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to load operations dashboard' }, { status: 500 });
  }
}
