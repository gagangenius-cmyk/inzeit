import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { notifyUser, notifyRole } from '@/lib/notify';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

const ensureTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_opportunity_compliance_approvals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      leadId INT NOT NULL,
      opportunityId INT NULL,
      signedAgreementUrl TEXT NOT NULL,
      clientSignature VARCHAR(255) NULL,
      signatureDate DATE NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      submittedBy INT NULL,
      reviewedBy VARCHAR(255) NULL,
      reviewerRole VARCHAR(80) NULL,
      reviewNotes TEXT NULL,
      submittedAt DATETIME NOT NULL,
      reviewedAt DATETIME NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      INDEX idx_compliance_lead (leadId),
      INDEX idx_compliance_status (status)
    )
  `);
};

function isComplianceReviewer(auth: any) {
  const role = String(auth?.roleName || auth?.type || auth?.roleType || '').toLowerCase();
  return isBranchManagerOrCeo(auth) || ['compliance', 'compliance_officer', 'crm_compliance', 'crm_compliance_officer', 'compliance_manager'].includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['agreements.view', 'documents.view']);
    if (isAuthError(auth)) return auth;

    await ensureTable();

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');
    const whereConditions: string[] = [];
    const replacements: any[] = [];

    if (leadId) {
      whereConditions.push('leadId = ?');
      replacements.push(leadId);
    }

    if (opportunityId) {
      whereConditions.push('opportunityId = ?');
      replacements.push(opportunityId);
    }

    if (status) {
      whereConditions.push('status = ?');
      replacements.push(status);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.map((condition) => `a.${condition}`).join(' AND ')}` : '';
    const rows = await sequelize.query(`
      SELECT
        a.*,
        CONCAT(COALESCE(l.fname, ''), ' ', COALESCE(l.lname, '')) AS clientName,
        l.email AS clientEmail,
        l.mobile AS clientPhone,
        COALESCE(counselor.name, assigned.name) AS counselorName,
        COALESCE(l.Counsilor, l.assignTo) AS counselorId,
        h.conversation_summary AS conversationSummary,
        h.client_commitments AS clientCommitments,
        h.next_action AS nextAction,
        p.paymentNumber,
        COALESCE(p.receiptNumber, p.paymentNumber) AS receiptNumber,
        p.paidAmount,
        p.totalAmount,
        p.currency,
        p.accountantStatus,
        p.accountantVerifiedAt,
        COALESCE(p.receiptUrl, doc.filePath) AS proofOfPaymentUrl,
        csheet.filePath AS counsellorSheetUrl
      FROM crm_opportunity_compliance_approvals a
      LEFT JOIN crm_forum_leads l ON l.id = a.leadId
      LEFT JOIN crm_employee counselor ON counselor.id = l.Counsilor
      LEFT JOIN crm_employee assigned ON assigned.id = l.assignTo
      LEFT JOIN (
        SELECT n1.*
        FROM crm_opportunity_handover_notes n1
        INNER JOIN (
          SELECT COALESCE(opportunity_id, 0) AS opportunity_id_key, lead_id, MAX(id) AS latestId
          FROM crm_opportunity_handover_notes
          GROUP BY COALESCE(opportunity_id, 0), lead_id
        ) latest ON latest.latestId = n1.id
      ) h ON h.lead_id = a.leadId AND (h.opportunity_id = a.opportunityId OR h.opportunity_id IS NULL OR a.opportunityId IS NULL)
      LEFT JOIN (
        SELECT p1.*
        FROM crm_opportunity_payments p1
        INNER JOIN (
          SELECT opportunityId, MAX(id) AS latestId
          FROM crm_opportunity_payments
          GROUP BY opportunityId
        ) latest ON latest.latestId = p1.id
      ) p ON p.opportunityId = a.opportunityId
      LEFT JOIN (
        SELECT d1.opportunityId, d1.filePath
        FROM crm_opportunity_documents d1
        INNER JOIN (
          SELECT opportunityId, MAX(id) AS latestId
          FROM crm_opportunity_documents
          WHERE documentType = 'proof_of_payment'
          GROUP BY opportunityId
        ) latest ON latest.opportunityId = d1.opportunityId AND latest.latestId = d1.id
      ) doc ON doc.opportunityId = a.opportunityId
      LEFT JOIN (
        SELECT d2.opportunityId, d2.filePath
        FROM crm_opportunity_documents d2
        INNER JOIN (
          SELECT opportunityId, MAX(id) AS latestId
          FROM crm_opportunity_documents
          WHERE documentType = 'counsellor_sheet'
          GROUP BY opportunityId
        ) latest2 ON latest2.opportunityId = d2.opportunityId AND latest2.latestId = d2.id
      ) csheet ON csheet.opportunityId = a.opportunityId
      ${whereClause}
      ORDER BY COALESCE(a.reviewedAt, a.updatedAt, a.createdAt) DESC, a.id DESC
    `, { replacements, type: QueryTypes.SELECT });

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching compliance approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance approvals: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['agreements.create']);
    if (isAuthError(auth)) return auth;

    await ensureTable();

    const body = await request.json();
    if (!body.leadId || !body.signedAgreementUrl) {
      return NextResponse.json(
        { success: false, error: 'Lead ID and signed agreement upload are required' },
        { status: 400 }
      );
    }

    // Duplicate-submission guard: the frontend already guards this well
    // (submittingCompliance state + status checks), but that's not airtight
    // against two near-simultaneous requests - block a second submission
    // while one for this lead is still pending review.
    const [pendingExisting] = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_opportunity_compliance_approvals WHERE leadId = ? AND status = 'pending' LIMIT 1`,
      { replacements: [body.leadId], type: QueryTypes.SELECT }
    );
    if (pendingExisting) {
      return NextResponse.json(
        { success: false, error: 'A compliance approval for this lead is already pending review.' },
        { status: 409 }
      );
    }

    const now = new Date();
    const [result] = await sequelize.query(`
      INSERT INTO crm_opportunity_compliance_approvals (
        leadId, opportunityId, signedAgreementUrl, clientSignature, signatureDate,
        status, submittedBy, submittedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        body.leadId,
        body.opportunityId || null,
        body.signedAgreementUrl,
        body.clientSignature || null,
        body.signatureDate || null,
        body.status || 'pending',
        body.submittedBy || null,
        now,
        now,
        now
      ]
    });

    // Record the counselor's conversation summary now, at submission time —
    // it's typed on the wizard's earlier Agreement stage, after the one point
    // (opportunity creation, at the Payment stage) where a handover note would
    // otherwise get saved, so without this it never reaches the DB at all.
    const conversationSummary = String(body.conversationSummary || '').trim();
    if (conversationSummary) {
      await sequelize.query(`
        INSERT INTO crm_opportunity_handover_notes
          (lead_id, opportunity_id, counselor_id, conversation_summary, client_commitments, next_action, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          body.leadId,
          body.opportunityId || null,
          body.submittedBy || null,
          conversationSummary,
          body.clientCommitments || null,
          body.nextAction || null,
          now,
        ]
      });
    }

    // There's no dedicated "compliance officer" role in crm_role — CEO is the
    // closest thing to a known reviewer audience for this gate today.
    const [leadRow] = await sequelize.query<{ fname: string; lname: string }>(
      `SELECT fname, lname FROM crm_forum_leads WHERE id = ? LIMIT 1`,
      { replacements: [body.leadId], type: QueryTypes.SELECT }
    );
    const clientName = leadRow ? `${(leadRow as any).fname || ''} ${(leadRow as any).lname || ''}`.trim() : `Lead #${body.leadId}`;
    await Promise.all(['compliance_manager', 'compliance_officer', 'crm_compliance', 'compliance', 'director'].map((roleType) =>
      notifyRole({
        roleType,
        type: 'compliance_submission',
        title: 'Signed agreement submitted for compliance review',
        message: `${clientName || `Lead #${body.leadId}`}'s signed agreement is awaiting compliance approval. Review the signed agreement, receipt proof, and counselor conversation summary before approval.`,
        priority: 'medium',
        link: `/admin/leads/${body.leadId}/edit`,
        relatedId: body.leadId,
        relatedType: 'lead',
      })
    ));

    return NextResponse.json({
      success: true,
      message: 'Signed agreement submitted for compliance approval',
      data: { id: (result as any).insertId }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating compliance approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create compliance approval: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    await ensureTable();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Compliance approval ID is required' },
        { status: 400 }
      );
    }

    // There's no dedicated "compliance officer" role/permission in this codebase
    // (see the POST handler's notifyRole comment above) — Branch Manager and CEO
    // are the documented fallback reviewers, so approve/reject is gated
    // server-side to BM/CEO rather than trusting the client-supplied reviewerRole field.
    if (['approved', 'rejected'].includes(body.status) && !isComplianceReviewer(auth)) {
      return NextResponse.json(
        { success: false, error: 'Only the branch manager, compliance manager, or CEO can approve or reject the signed agreement' },
        { status: 403 }
      );
    }

    // Branch Manager may only review a signed agreement for a lead in their
    // own branch; CEO (and any dedicated compliance-role reviewer, who isn't
    // branch-scoped) is unaffected.
    if (['approved', 'rejected'].includes(body.status) && isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const [approvalLeadRows] = await sequelize.query(
        `SELECT leadId FROM crm_opportunity_compliance_approvals WHERE id = ?`,
        { replacements: [id] }
      );
      const approvalLeadId = (approvalLeadRows as any[])[0]?.leadId;
      if (approvalLeadId) {
        const [leadBranchRows] = await sequelize.query(
          'SELECT branch FROM crm_forum_leads WHERE id = ? LIMIT 1',
          { replacements: [approvalLeadId] },
        );
        const leadBranch = (leadBranchRows as any[])[0]?.branch;
        if (leadBranch !== undefined && leadBranch !== null && Number(leadBranch) !== Number(auth.branch || 0)) {
          return NextResponse.json(
            { success: false, error: 'You can only review a signed agreement for a lead in your own branch' },
            { status: 403 },
          );
        }
      }
    }

    const now = new Date();
    await sequelize.query(`
      UPDATE crm_opportunity_compliance_approvals
      SET status = ?, reviewedBy = ?, reviewerRole = ?, reviewNotes = ?, reviewedAt = ?, updatedAt = ?
      WHERE id = ?
    `, {
      replacements: [
        body.status,
        body.reviewedBy || null,
        body.reviewerRole || null,
        body.reviewNotes || null,
        body.reviewedAt ? new Date(body.reviewedAt) : now,
        now,
        id
      ]
    });

    // Advance the compliance gate on crm_opportunity_workflow_reviews so the client
    // can surface in the Client List (src/app/api/admin/clients/route.ts reads
    // finance_status/compliance_status from there, not from this approvals table).
    if (['approved', 'rejected'].includes(body.status)) {
      const [approvalRows] = await sequelize.query(
        `SELECT opportunityId, leadId FROM crm_opportunity_compliance_approvals WHERE id = ?`,
        { replacements: [id] }
      );
      const approval = (approvalRows as any[])[0];

      // Notify whoever owns the lead — the compliance-approvals page promises
      // "counselor will be notified" on rejection, but nothing actually did
      // this before; the reviewer's notes are included so the counselor knows
      // what to fix, not just that it was rejected.
      if (approval?.leadId) {
        const [leadRow] = await sequelize.query<{ assignTo: number | null; Counsilor: number | null; fname: string; lname: string }>(
          `SELECT assignTo, Counsilor, fname, lname FROM crm_forum_leads WHERE id = ? LIMIT 1`,
          { replacements: [approval.leadId], type: QueryTypes.SELECT }
        );
        const clientName = leadRow ? `${leadRow.fname || ''} ${leadRow.lname || ''}`.trim() : `Lead #${approval.leadId}`;
        const counselorId = leadRow?.Counsilor || leadRow?.assignTo;
        await notifyUser({
          userId: counselorId,
          type: 'compliance_review',
          title: body.status === 'approved' ? 'Opportunity approved by compliance' : 'Compliance rejected the agreement',
          message: body.status === 'approved'
            ? `Congratulations. Compliance approved ${clientName}'s signed agreement after reviewing the receipt proof and counselor summary. You can now mark the opportunity as won and close the deal.`
            : `Compliance rejected the signed agreement for ${clientName}.${body.reviewNotes ? ` Remarks: ${body.reviewNotes}` : ''}`,
          priority: body.status === 'rejected' ? 'high' : 'medium',
          link: `/admin/leads/${approval.leadId}/edit`,
          relatedId: approval.leadId,
          relatedType: 'lead',
        });
      }

      if (approval?.opportunityId) {
        await sequelize.query(`
          UPDATE crm_opportunity_workflow_reviews
          SET compliance_status = ?,
              compliance_reviewed_at = ?,
              workflow_status = ?,
              case_activated_at = ?,
              updated_at = ?
          WHERE opportunity_id = ?
        `, {
          replacements: [
            body.status,
            now,
            body.status === 'approved' ? 'client' : 'compliance_review_failed',
            body.status === 'approved' ? now : null,
            now,
            approval.opportunityId,
          ]
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Compliance approval updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating compliance approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update compliance approval: ' + error.message },
      { status: 500 }
    );
  }
}
