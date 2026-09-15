import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveLeadAssignment } from '@/lib/assignmentRuleEngine';
import { resolveLeadReferenceId } from '@/lib/leadReferenceResolver';
import { recordLeadAssignment } from '@/lib/leadRemarks';
import { checkForDuplicate } from '@/lib/duplicateLeadCheck';
import { buildDefaultLeadData, insertLeadRecord } from '@/lib/leadDefaults';
import { captureError } from '@/lib/errorTracking';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const requiredFields = ['name', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const [firstName, ...lastParts] = String(data.name).trim().split(/\s+/);
    const branchId = Number(data.branch || data.branchId || 4);

    // This is a public webhook (Facebook/Instagram/LinkedIn/website-form
    // leads - see WebhookIntegrations.tsx) so most callers never name an
    // owner, and reference fields (country/program/source) arrive as free
    // text rather than resolved ids. Resolve what we can; an unrecognized
    // value falls back to null rather than rejecting a real customer lead.
    let resolvedMarketSource: number | null = null;
    let resolvedCountryInterest: number | null = null;
    let resolvedServiceInterest: number | null = null;
    try {
      resolvedMarketSource = await resolveLeadReferenceId('market_source', data.source || data.market_source || null);
    } catch { resolvedMarketSource = null; }
    try {
      resolvedCountryInterest = await resolveLeadReferenceId('country_interest', data.country || data.countryInterest || null);
    } catch { resolvedCountryInterest = null; }
    try {
      resolvedServiceInterest = await resolveLeadReferenceId('service_interest', data.program || data.service || data.serviceInterest || null);
    } catch { resolvedServiceInterest = null; }

    let assignToId: number | null = data.assignTo ? Number(data.assignTo) : null;
    let counselorId: number | null = data.counselorId ? Number(data.counselorId) : null;
    if (!assignToId) {
      try {
        const assignment = await resolveLeadAssignment({
          branchId,
          forceAutoAssign: true,
          roundRobin: true,
          sourceId: resolvedMarketSource,
          priority: data.priority || 'medium',
          countryInterestId: resolvedCountryInterest,
          serviceInterestId: resolvedServiceInterest,
        });
        assignToId = assignment.assignedEmployeeId;
        counselorId = assignment.counselorId;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (!message.includes('No active employees are available')) throw error;
        // Leave the lead unassigned in the branch's pool rather than
        // rejecting an inbound customer lead because the office is empty.
      }
    }

    // Flags the duplicate/duplicate_count columns for staff visibility -
    // never blocks creation, since a webhook must never reject a real
    // inbound customer lead.
    const duplicateCheck = await checkForDuplicate({ phone: data.mobile || data.phone, email: data.email });

    // Shared with /api/leads (src/lib/leadDefaults.ts) so this endpoint gets
    // the same complete set of crm_forum_leads columns - this route used to
    // hand-write its own short INSERT covering only ~22 of the table's ~85
    // columns, which 500'd ("Field '...' doesn't have a default value") on
    // any payload beyond the bare minimum required fields.
    const leadData = buildDefaultLeadData({
      data: {
        fname: firstName || '',
        lname: lastParts.join(' '),
        email: data.email,
        phone: data.phone,
        mobile: data.mobile || data.phone,
        nationality: data.nationality,
        address: data.address,
        enquiry: data.message,
        lead_remark: data.message,
        priority: data.priority,
        created_by: data.createdBy,
        region: data.region,
        case_officer: data.caseOfficer ? Number(data.caseOfficer) : undefined,
      },
      assignment: assignToId ? { assignedEmployeeId: assignToId, counselorId: counselorId ?? assignToId, branchId } : null,
      resolvedCountryInterest,
      resolvedServiceInterest,
      resolvedMarketSource,
      requestedBranchId: branchId,
      duplicateCheck,
    });

    const leadId = await insertLeadRecord(leadData);
    if (leadId && assignToId) {
      await recordLeadAssignment({ leadId, oldAssignTo: null, newAssignTo: assignToId, actorId: null, actorRole: 'System (lead intake)' });
    }
    return NextResponse.json({
      success: true,
      leadId,
      assignedTo: assignToId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error processing lead intake:', error);
    captureError(error, { route: '/api/lead-intake' });
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Unlike POST/PUT (a genuinely public lead-intake webhook — see
  // WebhookIntegrations.tsx, which documents this endpoint as the receiver for
  // Facebook/Instagram/LinkedIn/website-form leads), GET returns internal data
  // (counselor names/emails/phones, allocation rules, system stats) that has
  // no public use case and must require auth.
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'counselors') {
      const rows = await sequelize.query(
        `SELECT id, name, email, mobile AS phone, branch, status
         FROM crm_employee
         WHERE status = 1
         ORDER BY name ASC`,
        { type: QueryTypes.SELECT }
      );
      return NextResponse.json(rows);
    }

    if (action === 'rules') {
      const rows = await sequelize.query(
        `SELECT id, branch_id, counsilors, status, created
         FROM crm_counsilor_allocations
         ORDER BY created DESC`,
        { type: QueryTypes.SELECT }
      );
      return NextResponse.json(rows);
    }

    if (action === 'system-stats') {
      const [stats] = await sequelize.query<any>(
        `SELECT
          (SELECT COUNT(*) FROM crm_employee WHERE status = 1) AS activeCounselors,
          (SELECT COUNT(*) FROM crm_forum_leads) AS totalLeads,
          (SELECT COUNT(*) FROM crm_forum_leads WHERE DATE(created) = CURDATE()) AS leadsToday,
          (SELECT COUNT(*) FROM crm_counsilor_allocations WHERE status = 1) AS activeRules`,
        { type: QueryTypes.SELECT }
      );
      return NextResponse.json(stats || {});
    }

    return NextResponse.json({ message: 'Available actions: system-stats, counselors, rules' });
  } catch (error: any) {
    console.error('Error in lead intake GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
