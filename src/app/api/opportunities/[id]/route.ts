import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isFinanceAndComplianceApproved, APPROVAL_REQUIRED_ERROR } from '@/lib/opportunityApprovalGate';

async function createClientIfMissing(leadId: number, userId: number | null) {
  const [leadRows] = await sequelize.query(
    `SELECT id, fname, lname, email, dob, address, case_officer, assignTo, area, nationality
     FROM crm_forum_leads
     WHERE id = ?
     LIMIT 1`,
    { replacements: [leadId] },
  );
  const lead = (leadRows as any[])[0];
  if (!lead) return null;

  const [existingRows] = await sequelize.query(
    'SELECT id FROM crm_clients WHERE leadId = ? LIMIT 1',
    { replacements: [leadId] },
  );
  const existing = (existingRows as any[])[0];
  if (existing?.id) {
    await sequelize.query(
      `UPDATE crm_clients
       SET status = 1, accept = 1, is_deleted = 0, case_manager = COALESCE(NULLIF(case_manager, 0), ?), backend_person = COALESCE(NULLIF(backend_person, 0), ?)
       WHERE id = ?`,
      {
        replacements: [
          lead.case_officer || lead.assignTo || userId || 0,
          lead.assignTo || userId || 0,
          existing.id,
        ],
      },
    );
    return existing.id;
  }

  const [idRows] = await sequelize.query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM crm_clients');
  const clientId = Number((idRows as any[])[0]?.id || 0);
  await sequelize.query(
    `INSERT INTO crm_clients
      (id, leadId, first_name, last_name, email, image, dob, address, full_address, token, token_validity, verify, password, hash_password, status, accept, created, case_manager, backend_person, is_deleted, city, nationality)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, 1, NOW(), ?, ?, 0, ?, ?)`,
    {
      replacements: [
        clientId,
        leadId,
        lead.fname || '',
        lead.lname || '',
        lead.email || '',
        '',
        lead.dob || new Date('1970-01-01'),
        lead.address || '',
        lead.address || '',
        `CMG-${leadId}-${Date.now()}`,
        new Date(Date.now() + 90 * 86400000),
        '',
        '',
        lead.case_officer || lead.assignTo || userId || 0,
        lead.assignTo || userId || 0,
        lead.area || '',
        lead.nationality || '',
      ],
    },
  );
  return clientId;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request, ['leads.view']);
    if (isAuthError(auth)) return auth;

    const { id: opportunityId } = await params;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Get opportunity details
    const [opportunityResult] = await sequelize.query(`
      SELECT o.*, 
             l.fname, l.lname, l.email, l.mobile, l.phone, l.address, l.nationality,
             l.dob, l.id_number, l.id_expiry, l.service_interest, l.payTotal,
             fe.name as assignedEmployeeName, fe.email as assignedEmployeeEmail,
             be.name as branchName, be.address as branchAddress
      FROM crm_opportunities o
      LEFT JOIN crm_forum_leads l ON o.leadId = l.id
      LEFT JOIN crm_employee fe ON o.assignedTo = fe.id
      LEFT JOIN crm_branch be ON o.branchId = be.id
      WHERE o.id = ?
    `, {
      replacements: [opportunityId]
    });

    if (!opportunityResult || (opportunityResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    const opportunity = (opportunityResult as any[])[0];

    // Get opportunity payments
    const [paymentsResult] = await sequelize.query(`
      SELECT * FROM crm_opportunity_payments 
      WHERE opportunityId = ? 
      ORDER BY createdAt DESC
    `, {
      replacements: [opportunityId]
    });

    // Get opportunity agreements
    const [agreementsResult] = await sequelize.query(`
      SELECT * FROM crm_opportunity_agreements 
      WHERE opportunityId = ? 
      ORDER BY createdAt DESC
    `, {
      replacements: [opportunityId]
    });

    return NextResponse.json({
      success: true,
      data: {
        opportunity,
        payments: paymentsResult,
        agreements: agreementsResult
      }
    });

  } catch (error: any) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opportunity: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request, ['leads.view', 'leads.update']);
    if (isAuthError(auth)) return auth;

    const { id: opportunityId } = await params;
    const body = await request.json();

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    const actualValue = body.actualValue === undefined ? undefined : Number(body.actualValue);
    const probability = body.probability === undefined ? undefined : Number(body.probability);
    if (actualValue !== undefined && (!Number.isFinite(actualValue) || actualValue < 0)) {
      return NextResponse.json({ success: false, error: 'Actual value must be a non-negative number' }, { status: 422 });
    }
    if (probability !== undefined && (!Number.isFinite(probability) || probability < 0 || probability > 100)) {
      return NextResponse.json({ success: false, error: 'Probability must be between 0 and 100' }, { status: 422 });
    }
    if (body.actualCloseDate && Number.isNaN(new Date(body.actualCloseDate).getTime())) {
      return NextResponse.json({ success: false, error: 'Actual close date is invalid' }, { status: 422 });
    }
    if (body.retentionDate && Number.isNaN(new Date(body.retentionDate).getTime())) {
      return NextResponse.json({ success: false, error: 'Retention date is invalid' }, { status: 422 });
    }

    // Check if opportunity exists. branchId on crm_opportunities itself is
    // frequently left unset (see src/app/api/admin/opportunities/save/route.ts,
    // whose INSERT never populates it) - fall back to the parent lead's
    // branch, matching the same COALESCE pattern already used in
    // opportunity-payments/verify/route.ts.
    const [existingResult] = await sequelize.query(`
      SELECT o.id, o.leadId, COALESCE(l.branch, o.branchId) AS branch
      FROM crm_opportunities o
      LEFT JOIN crm_forum_leads l ON l.id = o.leadId
      WHERE o.id = ?
    `, {
      replacements: [opportunityId]
    });

    if (!existingResult || (existingResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Branch Manager may update opportunities in their own branch only; CEO
    // is unaffected. Mirrors the same check on PUT /api/leads/[id].
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const opportunityBranch = Number((existingResult as any[])[0].branch);
      if (opportunityBranch !== Number(auth.branch || 0)) {
        return NextResponse.json({ success: false, error: 'You can only update opportunities in your own branch' }, { status: 403 });
      }
    }

    // 'won' must never be settable purely by whoever is editing the
    // opportunity (any leads.update holder — effectively every counselor) —
    // the wizard's own "Close / Mark Won" button already disables itself
    // client-side until Accounts + Compliance approve, but that's only a UI
    // convenience; without this check, calling this endpoint directly (or
    // just re-enabling the button in devtools) creates a full crm_clients
    // account and grants client-portal access with zero real review.
    if (body.status === 'won') {
      const approved = await isFinanceAndComplianceApproved(Number(opportunityId));
      if (!approved) {
        return NextResponse.json({ success: false, error: APPROVAL_REQUIRED_ERROR }, { status: 409 });
      }
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    };

    // Update only provided fields
    if (body.status !== undefined) updateData.status = body.status;
    if (body.actualCloseDate !== undefined) updateData.actualCloseDate = body.actualCloseDate ? new Date(body.actualCloseDate) : null;
    if (actualValue !== undefined) updateData.actualValue = actualValue;
    if (body.retentionStatus !== undefined) updateData.retentionStatus = body.retentionStatus;
    if (body.retentionDate !== undefined) updateData.retentionDate = body.retentionDate ? new Date(body.retentionDate) : null;
    if (body.agreementGenerated !== undefined) updateData.agreementGenerated = body.agreementGenerated;
    if (body.agreementId !== undefined) updateData.agreementId = body.agreementId || null;
    if (body.agreementSent !== undefined) updateData.agreementSent = body.agreementSent;
    if (body.agreementSigned !== undefined) updateData.agreementSigned = body.agreementSigned;
    if (body.paymentReceived !== undefined) updateData.paymentReceived = body.paymentReceived;
    if (body.documentsVerified !== undefined) updateData.documentsVerified = body.documentsVerified;
    if (body.stage !== undefined) updateData.stage = body.stage;
    if (probability !== undefined) updateData.probability = probability;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo || null;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update opportunity
    await sequelize.query(`
      UPDATE crm_opportunities 
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE id = ?
    `, {
      replacements: [...Object.values(updateData), opportunityId]
    });

    // If status is 'won' or 'lost', update the associated lead
    if (body.status === 'won' || body.status === 'lost') {
      const leadStatus = body.status === 'won' ? 'retained' : 'lost';
      
      await sequelize.query(`
        UPDATE crm_forum_leads 
        SET status = ?, convet = ?, opportunity_status = ?, conversion_date = ?, 
            conversion_reason = ?, last_updated = ?, last_updtd_time = ?
        WHERE id = (SELECT leadId FROM crm_opportunities WHERE id = ?)
      `, {
        replacements: [
          leadStatus,
          body.status === 'won' ? 'Client' : 'Opportunity',
          body.status,
          new Date().toISOString().split('T')[0],
          body.status === 'won' ? 'Successfully converted and retained client' : 'Opportunity lost',
          new Date().toISOString().split('T')[0],
          new Date().toTimeString().split(' ')[0],
          opportunityId
        ]
      });

      if (body.status === 'won') {
        const existingOpportunity = (existingResult as any[])[0];
        await createClientIfMissing(Number(existingOpportunity.leadId), Number(auth.id || 0) || null);
      }
    }

    // Get updated opportunity
    const [updatedResult] = await sequelize.query(`
      SELECT o.*, l.fname, l.lname, l.email, l.mobile, l.phone
      FROM crm_opportunities o
      LEFT JOIN crm_forum_leads l ON o.leadId = l.id
      WHERE o.id = ?
    `, {
      replacements: [opportunityId]
    });

    const updatedOpportunity = (updatedResult as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Opportunity updated successfully',
      data: updatedOpportunity
    });

  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update opportunity: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { id: opportunityId } = await params;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Check if opportunity exists
    const [existingResult] = await sequelize.query(`
      SELECT id, leadId, status FROM crm_opportunities WHERE id = ?
    `, {
      replacements: [opportunityId]
    });

    if (!existingResult || (existingResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    const opportunity = (existingResult as any[])[0];

    // A lead that has already become a client (won + finance/compliance
    // approved, same definition the Leads page's Clients tab uses — see
    // CLIENT_STATUS_SQL in /api/leads) can't be reverted back to a plain
    // lead — this is only for undoing a conversion still sitting in
    // "Opportunity Drafts", before any real client relationship exists.
    const [clientCheckRows] = await sequelize.query(`
      SELECT 1
      FROM crm_forum_leads l
      WHERE l.id = ?
        AND (
          COALESCE(l.status,'') IN ('Retained','Client','converted','retained','client')
          OR COALESCE(l.opportunity_status,'') = 'won'
          OR EXISTS (SELECT 1 FROM crm_opportunities oc WHERE oc.leadId = l.id AND oc.status = 'won')
          OR EXISTS (
            SELECT 1 FROM crm_opportunities occ
            JOIN crm_opportunity_workflow_reviews wrc ON wrc.opportunity_id = occ.id
            WHERE occ.leadId = l.id AND wrc.finance_status = 'approved' AND wrc.compliance_status = 'approved'
          )
        )
      LIMIT 1
    `, {
      replacements: [opportunity.leadId]
    });

    if ((clientCheckRows as any[]).length > 0) {
      return NextResponse.json(
        { success: false, error: 'This lead has already been retained as a client and can no longer be reverted to a plain lead.' },
        { status: 409 }
      );
    }

    // Delete every child record this draft opportunity could have picked up
    // on its way through the flow (payment, agreement, uploaded documents,
    // activity log, discount/compliance approval requests, counselor
    // handover notes) so nothing is left orphaned once the opportunity row
    // itself is gone. All in one transaction so a failure partway through
    // doesn't leave the opportunity half-deleted.
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(`DELETE FROM crm_opportunity_payments WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_agreements WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_documents WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_activities WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_workflow_reviews WHERE opportunity_id = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_compliance_approvals WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_discount_approvals WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_handover_notes WHERE opportunity_id = ?`, { replacements: [opportunityId], transaction });
      await sequelize.query(`DELETE FROM crm_opportunity_quotations WHERE opportunityId = ?`, { replacements: [opportunityId], transaction });

      // Delete the opportunity
      await sequelize.query(`DELETE FROM crm_opportunities WHERE id = ?`, { replacements: [opportunityId], transaction });

      // Revert the lead back to a plain, unconverted lead.
      await sequelize.query(`
        UPDATE crm_forum_leads
        SET status = 'New', opportunity_status = NULL, opportunity_stage = NULL,
            opportunity_id = NULL, convet = NULL, stepComplete = 0,
            last_updated = ?, last_updtd_time = ?
        WHERE id = ?
      `, {
        replacements: [
          new Date().toISOString().split('T')[0],
          new Date().toTimeString().split(' ')[0],
          opportunity.leadId
        ],
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity reverted — the lead is no longer converted to an opportunity.'
    });

  } catch (error: any) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete opportunity: ' + error.message },
      { status: 500 }
    );
  }
}
