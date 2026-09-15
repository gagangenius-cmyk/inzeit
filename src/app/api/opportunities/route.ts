// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { CrmcOpportunities } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    // Only meaningful (and only applied) when leadId is absent — a single
    // lead's own opportunities are naturally few, so that path keeps
    // returning every matching row as a plain array unchanged for its
    // existing callers (LeadManagement.tsx). Unscoped (admin-wide browse)
    // gets real server-side pagination instead of the entire table.
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));

    let whereClause: any = {};
    
    if (leadId) {
      whereClause.leadId = leadId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (assignedTo) {
      whereClause.assignedTo = assignedTo;
    }

    const whereParts: string[] = [];
    const replacements: Record<string, string> = {};

    if (whereClause.leadId) {
      whereParts.push('o.leadId = :leadId');
      replacements.leadId = whereClause.leadId;
    }

    if (whereClause.status) {
      whereParts.push('o.status = :status');
      replacements.status = whereClause.status;
    }

    if (whereClause.assignedTo) {
      whereParts.push('o.assignedTo = :assignedTo');
      replacements.assignedTo = whereClause.assignedTo;
    }

    // Visibility: CEO sees everything, Branch Manager is scoped to their own
    // branch, everyone else sees only opportunities they're actually
    // involved in - a company-wide unscoped browse otherwise leaked every
    // branch's deal amounts to any leads.view holder (which is most sales
    // staff), and a single opportunity could be pulled up by leadId/id from
    // outside its owner's branch just by knowing the id.
    if (!isCeo(auth)) {
      if (isBranchManagerOrCeo(auth)) {
        whereParts.push('COALESCE(l.branch, o.branchId) = :userBranch');
        replacements.userBranch = String(auth.branch || 0);
      } else {
        whereParts.push('(o.assignedTo = :userId OR o.createdBy = :userId OR l.assignTo = :userId OR l.Counsilor = :userId)');
        replacements.userId = String(auth.id);
      }
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // leadId-scoped: unchanged plain-array behavior (see param comment
    // above). Unscoped (admin-wide browse): real server-side pagination.
    let total = 0;
    if (!leadId) {
      const [{ total: countTotal }] = await sequelize.query<{ total: number }>(`
        SELECT COUNT(*) AS total
        FROM crm_opportunities o
        ${whereSql}
      `, {
        replacements,
        type: QueryTypes.SELECT
      });
      total = Number(countTotal) || 0;
    }

    const rows = await sequelize.query<any>(`
      SELECT
        o.*,
        l.id AS lead_id,
        l.fname AS lead_fname,
        l.lname AS lead_lname,
        l.email AS lead_email,
        l.mobile AS lead_mobile,
        l.nationality AS lead_nationality,
        l.country_interest AS lead_country_interest,
        l.service_interest AS lead_service_interest,
        l.market_source AS lead_market_source,
        COALESCE(cp.name, l.country_interest) AS lead_country_interest_label,
        COALESCE(s.name, pt.type, l.service_interest) AS lead_service_interest_label,
        COALESCE(ms.name, l.market_source) AS lead_market_source_label,
        ae.id AS assigned_employee_id,
        ae.name AS assigned_employee_name,
        ce.id AS created_employee_id,
        ce.name AS created_employee_name
      FROM crm_opportunities o
      LEFT JOIN crm_forum_leads l ON o.leadId = l.id
      LEFT JOIN crm_country_proces cp ON cp.id = CAST(l.country_interest AS UNSIGNED)
      LEFT JOIN crm_service s ON s.id = CAST(l.service_interest AS UNSIGNED)
      LEFT JOIN crm_program_type pt ON pt.id = CAST(l.service_interest AS UNSIGNED)
      LEFT JOIN crm_source ms ON ms.id = CAST(l.market_source AS UNSIGNED)
      LEFT JOIN crm_employee ae ON o.assignedTo = ae.id
      LEFT JOIN crm_employee ce ON o.createdBy = ce.id
      ${whereSql}
      ORDER BY o.createdAt DESC
      ${leadId ? '' : 'LIMIT :limit OFFSET :offset'}
    `, {
      replacements: leadId ? replacements : { ...replacements, limit, offset: (page - 1) * limit },
      type: QueryTypes.SELECT
    });

    const opportunities = rows.map((row) => ({
      ...row,
      dmcForumLead: row.lead_id ? {
        id: row.lead_id,
        fname: row.lead_fname,
        lname: row.lead_lname,
        email: row.lead_email,
        mobile: row.lead_mobile,
        nationality: row.lead_nationality,
        country_interest: row.lead_country_interest,
        country_interest_label: row.lead_country_interest_label,
        service_interest: row.lead_service_interest,
        service_interest_label: row.lead_service_interest_label,
        market_source: row.lead_market_source,
        market_source_label: row.lead_market_source_label
      } : null,
      assignedEmployee: row.assigned_employee_id ? {
        id: row.assigned_employee_id,
        name: row.assigned_employee_name
      } : null,
      createdEmployee: row.created_employee_id ? {
        id: row.created_employee_id,
        name: row.created_employee_name
      } : null
    }));

    if (leadId) {
      return NextResponse.json(opportunities);
    }
    return NextResponse.json({
      data: opportunities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'leads.create', 'leads.update']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();

    if (body.estimatedValue !== undefined && body.estimatedValue !== null && body.estimatedValue !== '') {
      const estimatedValue = Number(body.estimatedValue);
      if (!Number.isFinite(estimatedValue) || estimatedValue <= 0) {
        return NextResponse.json({ error: 'estimatedValue must be a positive number' }, { status: 422 });
      }
    }

    const opportunityData = {
      ...body,
      opportunityNumber: `OPP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const opportunity = await CrmcOpportunities.create(opportunityData);

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'leads.update']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (body.estimatedValue !== undefined && body.estimatedValue !== null && body.estimatedValue !== '') {
      const estimatedValue = Number(body.estimatedValue);
      if (!Number.isFinite(estimatedValue) || estimatedValue <= 0) {
        return NextResponse.json({ error: 'estimatedValue must be a positive number' }, { status: 422 });
      }
    }

    const opportunity = await CrmcOpportunities.findByPk(id);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    await opportunity.update(body);

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}
