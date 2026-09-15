import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

async function loadWorkflowData() {
  const [leads, opportunities, caseOfficers, overdueStages] = await Promise.all([
    sequelize.query(
      `SELECT id, fname, lname, email, phone, mobile, nationality, address, country_interest,
              service_interest, market_source, status, priority, regdate, assignTo,
              case_officer, Counsilor, branch, region, payTotal, paidYet, payBalance,
              created, created_by, type, campaign, no_of_applicants
       FROM crm_forum_leads
       ORDER BY created DESC
       LIMIT 100`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT id, leadId, opportunityNumber, opportunityName, opportunityType,
              estimatedValue, actualValue, priority, description, serviceRequired,
              status, stage, assignedTo, createdAt, updatedAt, conversionDate
       FROM crm_opportunities
       ORDER BY createdAt DESC
       LIMIT 100`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT id, name, email, mobile AS phone, branch, status
       FROM crm_employee
       WHERE status = 1
       ORDER BY name ASC`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT id, opportunityId, activityTitle, dueDate, status, assignedTo
       FROM crm_opportunity_activities
       WHERE dueDate IS NOT NULL AND dueDate < NOW() AND status <> 'completed'
       ORDER BY dueDate ASC
       LIMIT 100`,
      { type: QueryTypes.SELECT }
    ).catch(() => []),
  ]);

  const leadCount = (leads as any[]).length;
  const opportunityCount = (opportunities as any[]).length;
  const wonCount = (opportunities as any[]).filter((item: any) => ['won', 'retained'].includes(String(item.status || item.stage || '').toLowerCase())).length;

  return {
    leads,
    opportunities,
    caseOfficers,
    overdueStages,
    conversionStats: {
      totalLeads: leadCount,
      totalOpportunities: opportunityCount,
      conversionRate: leadCount > 0 ? (opportunityCount / leadCount) * 100 : 0,
    },
    workflowStats: {
      totalWorkflows: opportunityCount,
      completedWorkflows: wonCount,
      activeWorkflows: Math.max(opportunityCount - wonCount, 0),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'reports.view']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard-stats';

    if (action === 'dashboard-stats') {
      return NextResponse.json(await loadWorkflowData());
    }

    if (action === 'get-workflow') {
      const opportunityId = searchParams.get('opportunityId');
      if (!opportunityId) {
        return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
      }
      const activities = await sequelize.query(
        `SELECT * FROM crm_opportunity_activities WHERE opportunityId = ? ORDER BY activityDate DESC`,
        { replacements: [opportunityId], type: QueryTypes.SELECT }
      ).catch(() => []);
      return NextResponse.json({ success: true, workflow: { opportunityId, activities } });
    }

    if (action === 'get-operations-route') {
      const opportunityId = searchParams.get('opportunityId');
      if (!opportunityId) {
        return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
      }
      const rows = await sequelize.query<any>(
        `SELECT serviceRequired, serviceType FROM crm_opportunities WHERE id = ? LIMIT 1`,
        { replacements: [opportunityId], type: QueryTypes.SELECT }
      );
      const service = String(rows[0]?.serviceRequired || rows[0]?.serviceType || '').toLowerCase();
      const route = service.includes('student')
        ? '/admin/leads/student-visa-operations'
        : service.includes('visit')
          ? '/admin/leads/visit-visa-operations'
          : '/admin/operations-management';
      return NextResponse.json({ success: true, route });
    }

    if (action === 'case-officer-performance') {
      const caseOfficerId = Number(searchParams.get('caseOfficerId') || 0);
      if (!caseOfficerId) {
        return NextResponse.json({ error: 'Case Officer ID is required' }, { status: 400 });
      }
      const rows = await sequelize.query<any>(
        `SELECT
          COUNT(*) AS totalAssigned,
          SUM(CASE WHEN status IN ('client', 'converted', 'retained') THEN 1 ELSE 0 END) AS converted
         FROM crm_forum_leads
         WHERE case_officer = ? OR assignTo = ?`,
        { replacements: [caseOfficerId, caseOfficerId], type: QueryTypes.SELECT }
      );
      const totalAssigned = Number(rows[0]?.totalAssigned || 0);
      const converted = Number(rows[0]?.converted || 0);
      return NextResponse.json({
        success: true,
        performance: {
          caseOfficerId,
          totalAssigned,
          converted,
          conversionRate: totalAssigned > 0 ? (converted / totalAssigned) * 100 : 0,
        },
        workflows: [],
      });
    }

    return NextResponse.json({
      message: 'Available actions: dashboard-stats, get-workflow, get-operations-route, case-officer-performance',
    });
  } catch (error: any) {
    console.error('Error in workflow API:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'leads.update']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    if (body.action === 'assign-case-officer') {
      const { opportunityId, caseOfficerId } = body;
      if (!opportunityId || !caseOfficerId) {
        return NextResponse.json({ error: 'Opportunity ID and Case Officer ID are required' }, { status: 400 });
      }
      await sequelize.query(
        `UPDATE crm_opportunities SET assignedTo = ?, updatedAt = ? WHERE id = ?`,
        { replacements: [caseOfficerId, new Date(), opportunityId] }
      );
      return NextResponse.json({ success: true, message: 'Case officer assigned successfully' });
    }

    return NextResponse.json(
      { error: 'Use /api/lead-to-opportunity for live lead conversion.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in workflow API POST:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
