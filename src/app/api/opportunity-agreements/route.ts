import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { CrmcOpportunities, CrmcOpportunityAgreements } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveBranchCurrency } from '@/lib/branchCurrency';
import { formatDocumentNumber } from '@/lib/documentNumbering';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['agreements.view']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');
    // Looked up by the Agreement Lookup box (opportunity-flow-wizard.tsx) —
    // was previously accepted by the frontend but silently ignored here,
    // so a lookup by number fell through to returning every agreement.
    const agreementNumber = searchParams.get('agreementNumber');
    // Used whenever the response isn't the opportunityId plain-array shape
    // (see below) — both the agreementNumber lookup and a fully unscoped,
    // admin-wide browse get real server-side pagination instead of the
    // entire table.
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));

    let whereClause: any = {};

    if (opportunityId) {
      whereClause.opportunityId = opportunityId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (agreementNumber) {
      whereClause.agreementNumber = agreementNumber;
    }

    const include = [
      {
        association: 'dmcOpportunity',
        attributes: ['id', 'opportunityName', 'estimatedValue', 'currency']
      },
      {
        association: 'createdEmployee',
        attributes: ['id', 'name']
      },
      {
        association: 'uploadedEmployee',
        attributes: ['id', 'name']
      }
    ];

    // opportunityId keeps the historical plain-array shape (existing callers
    // like opportunity-flow-wizard.tsx index straight into the response).
    // agreementNumber lookups fall through to the wrapped { data, pagination }
    // shape below, which the Agreement Lookup box already expects
    // (`Array.isArray(json.data) ? json.data[0] : ...`) but never got, since
    // this endpoint previously ignored agreementNumber entirely.
    if (opportunityId) {
      const agreements = await CrmcOpportunityAgreements.findAll({
        where: whereClause,
        include,
        order: [['createdAt', 'DESC']],
      });
      return NextResponse.json(agreements);
    }

    const { rows, count } = await CrmcOpportunityAgreements.findAndCountAll({
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
    console.error('Error fetching agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['agreements.create']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const opportunity = await CrmcOpportunities.findByPk(body.opportunityId);
    if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });

    // Resolved once, up front, and reused both for the branch-scope check
    // below and for document-numbering further down - the lead's own branch
    // is authoritative, not opportunity.branchId directly (see the comment
    // further down on why).
    const [leadBranchRow] = await sequelize.query<{ branch: number | null }>(
      'SELECT branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
      { replacements: { leadId: (opportunity as any).leadId }, type: QueryTypes.SELECT },
    );
    const resolvedBranchId = leadBranchRow?.branch || (opportunity as any).branchId;

    // Branch Manager may only generate an agreement for their own branch's
    // opportunity; CEO is unrestricted.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      if (resolvedBranchId !== undefined && resolvedBranchId !== null && Number(resolvedBranchId) !== Number(auth.branch || 0)) {
        return NextResponse.json({ error: 'You can only generate an agreement for an opportunity in your own branch' }, { status: 403 });
      }
    }

    // Duplicate-submission guard: the frontend already checks for an
    // existing agreement before calling this (GET-then-POST), but that's not
    // atomic - block a second agreement for the same opportunity here too.
    const existingAgreement = await CrmcOpportunityAgreements.findOne({ where: { opportunityId: body.opportunityId } });
    if (existingAgreement) {
      return NextResponse.json({ error: 'An agreement already exists for this opportunity.', agreementId: existingAgreement.id }, { status: 409 });
    }

    const agreementData = {
      ...body,
      currency: opportunity.currency,
      generatedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const agreement = await CrmcOpportunityAgreements.create(agreementData);

    // Override whatever placeholder number the client sent (it can't know its
    // own row id ahead of time) with the real AG/{branch}/{product}/{DDMMYYYY}/{seq}
    // number, e.g. AG/QTR/CAN/15072026/001, now that the id is known.
    //
    // The lead's own branch is authoritative here, not opportunity.branchId
    // directly — a lead-to-opportunity conversion used to stamp the
    // *counselor's* branch onto the opportunity instead of the lead's own,
    // so relying on opportunity.branchId alone could still generate an
    // agreement under the wrong branch's company details for any opportunity
    // that was created before that fix. (resolvedBranchId computed above.)
    const branchCurrency = await resolveBranchCurrency(resolvedBranchId);
    const agreementNumber = formatDocumentNumber({
      prefix: 'AG',
      branchName: branchCurrency?.branchName,
      branchAddress: branchCurrency?.branchAddress,
      branchAbbrv: branchCurrency?.branchAbbrv,
      product: (opportunity as any).serviceType || (opportunity as any).serviceRequired,
      sequenceId: agreement.id,
    });
    await agreement.update({ agreementNumber });

    return NextResponse.json(agreement, { status: 201 });
  } catch (error) {
    console.error('Error creating agreement:', error);
    return NextResponse.json(
      { error: 'Failed to create agreement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['agreements.update', 'agreements.create']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const body = await request.json();

    if (!id) return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });

    const agreement = await CrmcOpportunityAgreements.findByPk(id);
    if (!agreement) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });

    // Branch Manager may only edit an agreement belonging to their own
    // branch's opportunity; CEO is unrestricted. Raw SQL rather than the
    // Sequelize instance's own opportunityId getter - model instances in
    // this codebase use `public field!` class declarations that shadow the
    // ORM's attribute getters, making reads like `agreement.opportunityId`
    // straight after findByPk unreliable (see the isSignedUpload block below).
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const [agreementBranchRows] = await sequelize.query(
        `SELECT COALESCE(l.branch, o.branchId) AS branch
         FROM crm_opportunity_agreements a
         JOIN crm_opportunities o ON o.id = a.opportunityId
         LEFT JOIN crm_forum_leads l ON l.id = o.leadId
         WHERE a.id = ?`,
        { replacements: [id] },
      );
      const agreementBranch = (agreementBranchRows as any[])[0]?.branch;
      if (agreementBranch !== undefined && agreementBranch !== null && Number(agreementBranch) !== Number(auth.branch || 0)) {
        return NextResponse.json({ error: 'You can only update an agreement for an opportunity in your own branch' }, { status: 403 });
      }
    }

    const editableFields = [
      'agreementType', 'agreementTitle', 'title', 'description', 'duration',
      'startDate', 'endDate', 'amount', 'totalAmount', 'terms',
      'termsAndConditions', 'specialConditions', 'companyName', 'companyAddress',
      'status', 'documentUrl', 'clientSignature', 'signatureDate', 'uploadedToCrm',
      // Lets a not-yet-signed agreement's rendered HTML be refreshed (e.g. when
      // branchAgreementProfiles.ts's per-branch legal text is corrected after the
      // agreement was first generated) without touching any other field. Callers
      // must never set this once the agreement is signed/uploaded.
      'content',
    ] as const;
    const updates = Object.fromEntries(
      editableFields
        .filter((field) => body[field] !== undefined)
        .map((field) => [field, body[field]]),
    );

    // A signed-agreement upload sets status to 'uploaded' with a documentUrl —
    // that's the signal to also mark this lead's signed date.
    const isSignedUpload = body.status === 'uploaded' && Boolean(body.documentUrl);
    if (isSignedUpload) {
      updates.uploadedToCrm = true;
      updates.signedDate = body.signatureDate ? new Date(body.signatureDate) : new Date();
    }

    await agreement.update({ ...updates, updatedAt: new Date() });

    // Keep the legacy contract register (crm_forum_leads_contracts) in sync: once the
    // signed agreement is uploaded, the lead's contract record should flip from
    // unsigned to signed rather than staying stuck at its initial "generated" state.
    // Raw SQL joined off the URL's own `id` param (not the Sequelize instance) —
    // model instances in this codebase use `public field!` class declarations that
    // shadow the ORM's attribute getters, making reads like `agreement.opportunityId`
    // or `.get('leadId')` unreliable straight after findByPk/create.
    if (isSignedUpload) {
      const oppRows = await sequelize.query<{ leadId: number }>(
        `SELECT o.leadId AS leadId
         FROM crm_opportunity_agreements a
         JOIN crm_opportunities o ON o.id = a.opportunityId
         WHERE a.id = ? LIMIT 1`,
        { replacements: [id], type: QueryTypes.SELECT }
      );
      const leadId = oppRows[0]?.leadId;
      if (leadId) {
        await sequelize.query(
          `UPDATE crm_forum_leads_contracts
           SET contract = ?, verify = 1, verify_date = ?
           WHERE id = (SELECT id FROM (SELECT id FROM crm_forum_leads_contracts WHERE leadId = ? ORDER BY id DESC LIMIT 1) t)`,
          { replacements: [body.documentUrl, new Date(), leadId] }
        );
      }
    }

    return NextResponse.json({ success: true, data: agreement });
  } catch (error) {
    console.error('Error updating agreement:', error);
    return NextResponse.json({ error: 'Failed to update agreement' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });

    const agreement = await CrmcOpportunityAgreements.findByPk(id);
    if (!agreement) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });

    const opportunityId = agreement.opportunityId;
    await agreement.destroy();
    const latestAgreement = await CrmcOpportunityAgreements.findOne({
      where: { opportunityId },
      order: [['createdAt', 'DESC']],
    });

    if (latestAgreement) {
      await CrmcOpportunities.update({
        agreementId: latestAgreement.id,
        agreementGenerated: Boolean(latestAgreement.content),
        updatedAt: new Date(),
      }, { where: { id: opportunityId } });
    } else {
      await CrmcOpportunities.update(
        { agreementId: null, agreementGenerated: false, updatedAt: new Date() },
        { where: { id: opportunityId } },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agreement:', error);
    return NextResponse.json({ error: 'Failed to delete agreement' }, { status: 500 });
  }
}
