import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveBranchCurrency } from '@/lib/branchCurrency';
import { formatDocumentNumber } from '@/lib/documentNumbering';
import { isFinanceAndComplianceApproved, APPROVAL_REQUIRED_ERROR } from '@/lib/opportunityApprovalGate';

// Only these columns are allowed in the dynamic UPDATE to prevent accidental overwrites.
const ALLOWED_LEAD_UPDATE_COLS = new Set([
  'service_interest', 'payTotal', 'priority', 'stepComplete',
  'demandAmt', 'dueDate', 'paidYet', 'payBalance', 'feeAgreeDate',
  'agreeDate', 'status', 'last_updated', 'last_updtd_time',
]);

export async function POST(request: NextRequest) {
  try {
    // Called on every stage transition of the opportunity flow wizard by
    // whichever counselor/staff member is currently working the opportunity —
    // auth-only (no specific permission) rather than a narrow permission that
    // could break a legitimate stage save.
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { leadId, stage, data, completeFlow = false } = body;

    if (!leadId) {
      return NextResponse.json({ message: 'Lead ID is required' }, { status: 400 });
    }

    const [leadResult] = await sequelize.query(
      `SELECT * FROM crm_forum_leads WHERE id = ?`,
      { replacements: [leadId], type: QueryTypes.SELECT }
    );

    if (!leadResult) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    const lead = leadResult as any;

    if (completeFlow && stage === 'retained') {
      return await handleCompleteFlow(leadId, data, lead);
    }

    const updateData: Record<string, unknown> = {
      last_updated: new Date().toISOString().split('T')[0],
      last_updtd_time: new Date().toTimeString().split(' ')[0],
    };

    if (stage === 'prospect') {
      if (data.estimatedValue !== undefined && data.estimatedValue !== null && data.estimatedValue !== '') {
        const estimatedValue = parseFloat(data.estimatedValue);
        if (!Number.isFinite(estimatedValue) || estimatedValue <= 0) {
          return NextResponse.json({ message: 'estimatedValue must be a positive number' }, { status: 422 });
        }
        updateData.payTotal = estimatedValue;
      } else {
        updateData.payTotal = lead.payTotal;
      }
      if (data.serviceId !== undefined && data.serviceId !== null && data.serviceId !== '') {
        const serviceInterestId = parseInt(data.serviceId, 10);
        if (!Number.isFinite(serviceInterestId)) {
          return NextResponse.json({ message: 'serviceId must be a valid integer' }, { status: 422 });
        }
        updateData.service_interest = serviceInterestId;
      } else {
        updateData.service_interest = lead.service_interest;
      }
      updateData.priority = data.priority || lead.priority;
      updateData.stepComplete = 1;
    } else if (stage === 'quotation') {
      // payTotal starts as a rough Prospect-stage estimate, but from here on
      // everything downstream (Payment stage's Total Amount display, and the
      // payBalance = payTotal - paidYet math in /api/receipts) treats payTotal
      // as the authoritative amount owed — so the Quotation stage's finalized
      // total (post-discount, VAT-inclusive) must overwrite it, not just sit
      // in demandAmt. demandAmt itself gets repurposed as "balance remaining"
      // the moment a payment is recorded (see /api/receipts Step 4), so it
      // can't be read back later as "the quotation total" either.
      const finalTotal = Number(data.total);
      if (Number.isFinite(finalTotal) && finalTotal > 0) {
        updateData.payTotal = finalTotal;
      }
      updateData.demandAmt = data.total || lead.demandAmt;
      updateData.dueDate = data.validUntil ? new Date(data.validUntil) : lead.dueDate;
      updateData.stepComplete = 1;
    } else if (stage === 'payment') {
      updateData.paidYet = data.paidAmount || lead.paidYet;
      updateData.payBalance = data.remainingBalance || lead.payBalance;
      if (data.paymentDate) updateData.feeAgreeDate = new Date(data.paymentDate);
      updateData.stepComplete = 2;
    } else if (stage === 'documents') {
      updateData.stepComplete = 2;
    } else if (stage === 'agreement') {
      updateData.agreeDate = data.startDate ? new Date(data.startDate) : lead.agreeDate;
      updateData.stepComplete = 2;

      // The Counselor Conversation Summary is typed on this stage, but until
      // now nothing here persisted it — compliance-approvals then had nothing
      // to show. Save it as soon as this stage completes rather than relying
      // on a later, conditional step (signed-agreement submission) to carry it.
      const conversationSummary = String(data.counselorConversationSummary || '').trim();
      if (conversationSummary) {
        await sequelize.query(
          `INSERT INTO crm_opportunity_handover_notes
             (lead_id, opportunity_id, counselor_id, conversation_summary, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              leadId,
              lead.opportunity_id || null,
              lead.Counsilor || lead.assignTo || null,
              conversationSummary,
              new Date(),
            ],
          }
        );
      }
    } else if (stage === 'retained') {
      // data.retentionStatus is caller-supplied and 'Converted' is one of the
      // values CLIENT_STATUS_SQL (src/app/api/leads/route.ts) treats as a
      // fully retained Client on its own — so honoring 'approved' here
      // without checking the real Accounts/Compliance sign-off would let any
      // authenticated user (this route only requires plain auth, see above)
      // grant client status to any lead by simply posting that string.
      let retentionApproved = data.retentionStatus === 'approved';
      if (retentionApproved) {
        const [linkedOpportunity] = await sequelize.query<{ id: number }>(
          'SELECT id FROM crm_opportunities WHERE leadId = :leadId ORDER BY id DESC LIMIT 1',
          { replacements: { leadId }, type: QueryTypes.SELECT },
        );
        retentionApproved = await isFinanceAndComplianceApproved(linkedOpportunity?.id);
        if (!retentionApproved && data.retentionStatus === 'approved') {
          return NextResponse.json({ message: APPROVAL_REQUIRED_ERROR }, { status: 409 });
        }
      }
      updateData.stepComplete = retentionApproved ? 3 : 2;
      updateData.status = retentionApproved ? 'Converted' : 'In Progress';
    }

    // Filter to only whitelisted columns before building the SET clause.
    const safeKeys = Object.keys(updateData).filter(k => ALLOWED_LEAD_UPDATE_COLS.has(k));
    if (safeKeys.length > 0) {
      await sequelize.query(
        `UPDATE crm_forum_leads SET ${safeKeys.map(k => `\`${k}\` = ?`).join(', ')} WHERE id = ?`,
        { replacements: [...safeKeys.map(k => updateData[k]), leadId] }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Stage ${stage} saved successfully`,
      lead: { ...lead, ...updateData },
    });
  } catch (error: any) {
    console.error('Opportunity save error:', error);
    return NextResponse.json(
      { message: 'Failed to save opportunity stage: ' + error.message },
      { status: 500 }
    );
  }
}

async function handleCompleteFlow(leadId: number, data: any, lead: any) {
  const t = await sequelize.transaction();
  try {
    // Create opportunity record
    const [oppMeta] = await sequelize.query(
      `INSERT INTO crm_opportunities (
        leadId, opportunityNumber, opportunityName, description, serviceType,
        estimatedValue, currency, status, priority, assignedTo, createdBy,
        source, conversionDate, leadSource, expectedCloseDate, probability,
        stage, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          leadId,
          `OPP-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
          data.opportunityName || `${lead.fname} ${lead.lname} - ${lead.service_interest}`,
          data.description || `Opportunity created for lead: ${lead.fname} ${lead.lname}`,
          lead.service_interest,
          data.estimatedValue || lead.payTotal || 0,
          'AED',
          'qualified',
          data.priority || 'Medium',
          lead.assignTo,
          data.createdBy || lead.assignTo,
          'lead_conversion',
          new Date(),
          lead.market_source,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          75,
          'qualified',
          new Date(),
          new Date(),
        ],
        transaction: t,
      }
    ) as any;

    const opportunityId = (oppMeta as any)?.insertId;
    if (!opportunityId) throw new Error('Failed to create opportunity record — insertId missing');

    // Create payment record
    await sequelize.query(
      `INSERT INTO crm_opportunity_payments (
        opportunityId, paymentNumber, paymentType, amount, currency,
        status, paymentMethod, paymentDate, dueDate, description,
        paidAmount, balanceAmount, createdBy, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          opportunityId,
          `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          'initial_deposit',
          data.totalAmount || lead.payTotal || 0,
          'AED',
          'pending',
          data.paymentMethod || 'cash',
          new Date(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          'Initial payment for opportunity',
          data.paidAmount || 0,
          (data.totalAmount || lead.payTotal || 0) - (data.paidAmount || 0),
          data.createdBy || lead.assignTo,
          data.notes || '',
          new Date(),
          new Date(),
        ],
        transaction: t,
      }
    );

    // Create agreement record. Insert with a placeholder number first (the
    // real AG/{branch}/{product}/{DDMMYYYY}/{seq} number - the same format
    // every other agreement-creation path in the app uses - needs this row's
    // own auto-increment id, which only exists after insert). Leaving this as
    // the raw `AGR-timestamp-random` placeholder, as it was before, produced
    // agreement numbers in a different format from every other creation path,
    // which is exactly the kind of mismatch that makes a later manual number
    // lookup ("Agreement not found") fail.
    const [agreementMeta] = await sequelize.query(
      `INSERT INTO crm_opportunity_agreements (
        opportunityId, agreementNumber, agreementType, templateId, status,
        title, description, termsAndConditions, totalAmount, currency,
        startDate, endDate, signedDate, clientName, clientEmail, clientPhone,
        companyName, companyAddress, createdBy, uploadedBy, generatedDate,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          opportunityId,
          `AGR-PENDING-${Date.now()}`,
          'service_agreement',
          null,
          'draft',
          data.agreementTitle || `Service Agreement - ${lead.client_actual_name || `${lead.fname} ${lead.lname}`}`,
          data.description || `Service agreement for ${lead.service_interest}`,
          data.terms || '',
          data.totalAmount || lead.payTotal || 0,
          'AED',
          data.startDate ? new Date(data.startDate) : new Date(),
          data.endDate ? new Date(data.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          null,
          lead.client_actual_name || `${lead.fname} ${lead.lname}`,
          lead.email,
          lead.mobile || lead.phone,
          data.companyName || '',
          data.companyAddress || lead.address || '',
          data.createdBy || lead.assignTo,
          data.createdBy || lead.assignTo,
          new Date(),
          new Date(),
          new Date(),
        ],
        transaction: t,
      }
    ) as any;

    const agreementId = (agreementMeta as any)?.insertId;
    if (!agreementId) throw new Error('Failed to create agreement record — insertId missing');

    const branchCurrency = await resolveBranchCurrency(lead.branch);
    const agreementNumber = formatDocumentNumber({
      prefix: 'AG',
      branchName: branchCurrency?.branchName,
      branchAddress: branchCurrency?.branchAddress,
      branchAbbrv: branchCurrency?.branchAbbrv,
      product: lead.service_interest,
      sequenceId: agreementId,
    });
    await sequelize.query(
      `UPDATE crm_opportunity_agreements SET agreementNumber = ? WHERE id = ?`,
      { replacements: [agreementNumber, agreementId], transaction: t }
    );

    // Update lead status
    await sequelize.query(
      `UPDATE crm_forum_leads
       SET status = 'opportunity_created', convet = 'Opportunity',
           opportunity_id = ?, opportunity_status = 'qualified',
           stepComplete = 3, last_updated = ?, last_updtd_time = ?
       WHERE id = ?`,
      {
        replacements: [
          opportunityId,
          new Date().toISOString().split('T')[0],
          new Date().toTimeString().split(' ')[0],
          leadId,
        ],
        transaction: t,
      }
    );

    await t.commit();

    return NextResponse.json({
      success: true,
      message: 'Lead successfully converted to opportunity with complete flow data',
      data: {
        opportunityId,
        agreementId,
        agreementNumber,
        leadStatus: 'opportunity_created',
      },
    });
  } catch (error: any) {
    await t.rollback();
    console.error('Complete flow error:', error);
    return NextResponse.json(
      { message: 'Failed to complete opportunity flow: ' + error.message },
      { status: 500 }
    );
  }
}
