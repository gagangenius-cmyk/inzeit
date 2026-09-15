import { NextRequest, NextResponse } from 'next/server';
import { Op, QueryTypes } from 'sequelize';
import { CrmcOpportunityQuotations } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');
    // Only meaningful (and only applied) when opportunityId is absent — a
    // single opportunity's own quotations are naturally few, so that path
    // keeps returning every matching row as a plain array unchanged.
    // Unscoped (admin-wide browse) gets real server-side pagination instead
    // of the entire table.
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));

    let whereClause: any = {};

    if (opportunityId) {
      whereClause.opportunityId = opportunityId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Visibility: CEO sees every opportunity's quotations, Branch Manager
    // their own branch, everyone else only ones they're involved in -
    // leads.view alone (required above) is held by most sales staff.
    if (!isCeo(auth)) {
      if (opportunityId) {
        const [row] = await sequelize.query<{ branch: number | null; assignedTo: number | null; createdBy: number | null; leadAssignTo: number | null; leadCounsilor: number | null }>(
          `SELECT COALESCE(l.branch, o.branchId) AS branch, o.assignedTo, o.createdBy, l.assignTo AS leadAssignTo, l.Counsilor AS leadCounsilor
           FROM crm_opportunities o LEFT JOIN crm_forum_leads l ON l.id = o.leadId WHERE o.id = :opportunityId`,
          { replacements: { opportunityId }, type: QueryTypes.SELECT },
        );
        if (row) {
          if (isBranchManagerOrCeo(auth)) {
            if (row.branch !== null && Number(row.branch) !== Number(auth.branch || 0)) {
              return NextResponse.json({ error: 'You do not have permission to view these quotations' }, { status: 403 });
            }
          } else {
            const owns = [row.assignedTo, row.createdBy, row.leadAssignTo, row.leadCounsilor].some((id) => Number(id || 0) === Number(auth.id));
            if (!owns) {
              return NextResponse.json({ error: 'You do not have permission to view these quotations' }, { status: 403 });
            }
          }
        }
      } else {
        const scopeCondition = isBranchManagerOrCeo(auth)
          ? 'COALESCE(l.branch, o.branchId) = :userBranch'
          : '(o.assignedTo = :userId OR o.createdBy = :userId OR l.assignTo = :userId OR l.Counsilor = :userId)';
        const scopeReplacements = isBranchManagerOrCeo(auth) ? { userBranch: auth.branch || 0 } : { userId: auth.id };
        const scopedOpportunities = await sequelize.query<{ id: number }>(
          `SELECT o.id FROM crm_opportunities o LEFT JOIN crm_forum_leads l ON l.id = o.leadId WHERE ${scopeCondition}`,
          { replacements: scopeReplacements, type: QueryTypes.SELECT },
        );
        const ids = scopedOpportunities.map((r) => r.id);
        whereClause.opportunityId = { [Op.in]: ids.length ? ids : [-1] };
      }
    }

    const include = [
      {
        association: 'dmcOpportunity',
        attributes: ['id', 'opportunityName', 'estimatedValue', 'currency']
      },
      {
        association: 'createdEmployee',
        attributes: ['id', 'name']
      }
    ];

    if (opportunityId) {
      const quotations = await CrmcOpportunityQuotations.findAll({
        where: whereClause,
        include,
        order: [['createdAt', 'DESC']],
      });
      return NextResponse.json(quotations);
    }

    const { rows, count } = await CrmcOpportunityQuotations.findAndCountAll({
      where: whereClause,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'leads.create']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();

    if (body.total !== undefined && body.total !== null && body.total !== '') {
      const total = Number(body.total);
      if (!Number.isFinite(total) || total < 0) {
        return NextResponse.json({ error: 'total must be a non-negative number' }, { status: 422 });
      }
    }

    const quotationData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const quotation = await CrmcOpportunityQuotations.create(quotationData);

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}
