// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { models, sequelize } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { branchCurrencyError, resolveBranchCurrency } from '@/lib/branchCurrency';
import { formatDocumentNumber, formatReceiptNumber } from '@/lib/documentNumbering';
import { notifyRole } from '@/lib/notify';
import { getAdminFeeAmount } from '@/lib/receiptTemplate';
import { ensurePayHistoryAdminFeeColumns } from '@/lib/ensurePayHistoryAdminFeeColumns';
import { ensureClientActualNameColumn } from '@/lib/ensureClientActualNameColumn';
import { ensurePayHistoryProofColumn } from '@/lib/ensurePayHistoryProofColumn';

export async function POST(request: NextRequest) {
  // 'sales.create' is included so a counsellor can record a balance payment
  // against their own opportunity from Balance Payments — the finer-grained
  // check below still restricts re-editing an existing receipt to BM/CEO.
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const loggedInUser = auth;
  const permissions = loggedInUser.permissions || [];
  const hasAnyPermission = (required: string[]) =>
    permissions.includes('all') || required.some((permission) => permissions.includes(permission));
  const hasPaymentPermission = hasAnyPermission(['payments.view', 'payments.create', 'finance.view', 'finance.manage', 'sales.create']);

  if (!hasPaymentPermission && !isBranchManagerOrCeo(loggedInUser as any)) {
    return NextResponse.json({ error: 'You do not have permission to record payments' }, { status: 403 });
  }

  await Promise.all([ensurePayHistoryProofColumn(), ensurePayHistoryAdminFeeColumns(), ensureClientActualNameColumn()]);
  const transaction = await sequelize.transaction();
  try {
    const body = await request.json();
    const {
      leadId,
      opportunityId,
      paymentData,
      receiptData,
      generateAgreement = false,
      agreementData
    } = body;

    const paidAmountInput = Number(paymentData?.paidAmount ?? paymentData?.amount ?? 0);
    if (!Number.isFinite(paidAmountInput) || paidAmountInput <= 0) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 422 });
    }
    const proofOfPaymentUrl = String(paymentData?.proofOfPaymentUrl || paymentData?.paymentProofUrl || '').trim();
    if (!proofOfPaymentUrl) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Proof of payment is required before submitting a payment.' }, { status: 422 });
    }

    // Step 1: Validate lead exists
    const [leadRows] = await sequelize.query(`
      SELECT l.id, l.fname, l.lname, l.client_actual_name, l.email, l.phone, l.mobile, l.address,
             l.service_interest, l.assignTo, l.Counsilor, l.branch, l.payTotal, l.paidYet,
             l.payBalance, e.name AS assignedEmployeeName, s.name AS serviceInterestName
      FROM crm_forum_leads l
      LEFT JOIN crm_employee e ON e.id = l.assignTo
      LEFT JOIN crm_service s ON s.id = l.service_interest
      WHERE l.id = ?
      LIMIT 1
    `, { replacements: [leadId] });
    const lead = (leadRows as any[])[0];

    if (!lead) {
      await transaction.rollback();
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Step 2: Validate opportunity exists if provided
    let opportunity = null;
    if (opportunityId) {
      opportunity = await models.CrmcOpportunities.findByPk(opportunityId);
      if (!opportunity) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'Opportunity not found' },
          { status: 404 }
        );
      }

      // A receipt already exists for this exact payment tag (e.g. re-submitting
      // the P1 deposit) — that's a re-generation/edit of what the client was
      // already given, not a new balance/installment payment, so it's
      // restricted to Branch Manager/CEO. Genuinely new payment tags (P2, P3,
      // balance instalments, etc.) are a normal part of the multi-payment
      // flow and must NOT be blocked here.
      const paymentTagForCheck = body.paymentTag || 'P1';
      const existingReceiptCount = await models.CrmcOpportunityPayments.count({
        where: { opportunityId, paymentNumber: { [Op.like]: `%-${paymentTagForCheck}` } },
        transaction,
      });
      if (existingReceiptCount > 0 && !isBranchManagerOrCeo(loggedInUser as any)) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'A receipt already exists for this payment. Only Branch Manager or CEO can edit it.' },
          { status: 403 }
        );
      }
    }

    // The lead's own branch is authoritative for document generation -
    // agreements/receipts must reflect where the client actually is, not a
    // possibly-stale/mis-set opportunity.branchId (a lead-to-opportunity
    // conversion used to stamp the *counselor's* branch here instead of the
    // lead's, so a Dubai-based counselor's Abu Dhabi lead would silently get
    // Dubai's company details on every receipt/agreement). o.branchId is
    // only a fallback for the rare case a lead's own branch is unset.
    const [accessRows] = await sequelize.query(`
      SELECT
        o.id AS opportunityId,
        COALESCE(l.branch, o.branchId) AS branchId,
        o.assignedTo,
        o.createdBy,
        l.assignTo,
        l.Counsilor
      FROM crm_forum_leads l
      LEFT JOIN crm_opportunities o ON o.id = ? AND o.leadId = l.id
      WHERE l.id = ?
      LIMIT 1
    `, { replacements: [opportunityId || null, leadId], transaction });
    const accessContext = (accessRows as any[])[0] || null;

    if (opportunityId && !accessContext?.opportunityId) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Opportunity does not belong to this lead' }, { status: 422 });
    }

    const userId = Number(loggedInUser.id || 0);
    const branchIdForAccess = Number(accessContext?.branchId || lead.branch || 0);
    const ownsPaymentContext = [accessContext?.assignTo, accessContext?.Counsilor, accessContext?.assignedTo, accessContext?.createdBy]
      .some((ownerId) => Number(ownerId || 0) === userId);
    const hasGlobalPaymentAccess = permissions.includes('all') || hasAnyPermission(['finance.view', 'finance.manage']) || isCeo(loggedInUser as any);

    if (!hasGlobalPaymentAccess) {
      if (isBranchManagerOrCeo(loggedInUser as any)) {
        const userBranch = Number(loggedInUser.branch || 0);
        if (!userBranch || branchIdForAccess !== userBranch) {
          await transaction.rollback();
          return NextResponse.json({ error: 'Branch Manager can only record payments for their own branch' }, { status: 403 });
        }
      } else if (!ownsPaymentContext) {
        await transaction.rollback();
        return NextResponse.json({ error: 'You can only record payments for your own opportunities' }, { status: 403 });
      }
    }

    const branchId = Number(branchIdForAccess || loggedInUser?.branch || 0) || null;
    const branchCurrency = await resolveBranchCurrency(branchId);
    if (!branchCurrency) {
      await transaction.rollback();
      return NextResponse.json({ error: branchCurrencyError(branchId) }, { status: 422 });
    }

    // Look up any agreement already linked to this opportunity, so the
    // receipt response can carry its agreement number even when this request
    // isn't the one generating the agreement.
    const [agRows] = await sequelize.query(
      `SELECT agreementNumber FROM crm_opportunity_agreements WHERE opportunityId = ? ORDER BY createdAt DESC LIMIT 1`,
      { replacements: [opportunityId || null] }
    );
    const existingAgreementNumber = (agRows as any[])[0]?.agreementNumber || '';

    // Step 3: Create receipt record — RCP-{branch}-{YYYYMM}-{seq}, e.g.
    // RCP-QTR-202607-001. The id is pre-allocated (below) so it can be used
    // as the sequence number before the row is even inserted.
    const [receiptIdRows] = await sequelize.query(`
      SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM crm_opportunity_payments
    `, { transaction });
    const receiptId = Number((receiptIdRows as any[])[0]?.nextId || 0);
    if (!receiptId) throw new Error('Could not allocate a receipt ID');
    const receiptNumber = formatReceiptNumber({
      branchName: branchCurrency.branchName,
      branchAddress: branchCurrency.branchAddress,
      branchAbbrv: branchCurrency.branchAbbrv,
      sequenceId: receiptId,
    });
    const paidAmount = Number(paymentData.paidAmount || paymentData.amount || 0);
    const totalAmount = Number(paymentData.totalAmount || paymentData.amount || lead.payTotal || 0);
    const taxAmount = Number(receiptData.taxAmount || 0);
    const discountAmount = Number(receiptData.discountAmount || 0);
    // Admin fee amount is always derived server-side from the branch, never
    // trusted from the client — only whether the counselor checked the box.
    const adminFeeIncluded = Boolean(paymentData.adminFeeIncluded);
    const adminFeeAmount = adminFeeIncluded
      ? getAdminFeeAmount(branchCurrency.branchName, branchCurrency.branchAddress, branchCurrency.currencyCode)
      : 0;

    // Duplicate-submission guard: paymentTag/paymentNumber are minted fresh
    // per submission (BAL${Date.now()} on the client, RC/.../{seq} here), so
    // neither can catch a resubmit on its own - the existing paymentTag check
    // above only protects a re-edit of an *existing* tag, not a first-time
    // double-click. Block an identical (opportunity, amount) payment created
    // in the last minute instead, matching the same guard already applied to
    // /api/opportunity-payments.
    if (opportunityId) {
      const recentDuplicate = await models.CrmcOpportunityPayments.findOne({
        where: {
          opportunityId,
          totalAmount,
          paidAmount,
          createdAt: { [Op.gte]: new Date(Date.now() - 60_000) },
        },
        transaction,
      });
      if (recentDuplicate) {
        await transaction.rollback();
        return NextResponse.json(
          { error: 'A matching payment for this opportunity was already recorded a moment ago.' },
          { status: 409 }
        );
      }
    }

    const receipt = await models.CrmcOpportunityPayments.create({
      id: receiptId,
      opportunityId: opportunityId || null,
      paymentNumber: receiptNumber,
      paymentStructure: paymentData.paymentStructure || 'full',
      paymentType: normalizePaymentType(paymentData.paymentType),
      totalAmount,
      amount: paymentData.amount || paidAmount,
      currency: branchCurrency.currencyCode,
      status: 'paid',
      paymentMethod: paymentData.paymentMethod || 'cash',
      transactionId: paymentData.transactionId || null,
      paymentDate: paymentData.paymentDate || new Date(),
      dueDate: paymentData.dueDate || new Date(),
      description: receiptData.description || `Payment receipt for ${lead.fname} ${lead.lname}`,
      paidAmount,
      remainingBalance: Math.max(totalAmount - paidAmount, 0),
      balanceAmount: Math.max(totalAmount - paidAmount, 0),
      createdBy: loggedInUser?.id || paymentData.createdBy || lead.assignTo,
      notes: receiptData.notes || '',
      receiptNumber,
      receiptType: receiptData.receiptType || 'payment',
      clientName: lead.client_actual_name || `${lead.fname} ${lead.lname}`,
      clientEmail: lead.email,
      clientPhone: lead.mobile || lead.phone,
      clientAddress: lead.address || '',
      serviceName: lead.serviceInterestName || lead.service_interest || '',
      branchName: branchCurrency.branchName,
      consultantName: lead.assignedEmployeeName || '',
      taxAmount,
      discountAmount,
      receiptUrl: proofOfPaymentUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction });

    // Step 4: Update lead payment information
    // lead.paidYet/payTotal come back as strings from the raw SQL SELECT (DECIMAL
    // columns via mysql2), so `+`/`-` without Number() silently concatenates instead
    // of adding (e.g. "3000.00" + 1000 => "3000.001000").
    const newPaidYet = Number(lead.paidYet || 0) + Number(paymentData.paidAmount || paymentData.amount || 0);
    const newPayBalance = Number(lead.payTotal || 0) - newPaidYet;

    // Use a focused SQL update here because legacy installations can lack
    // optional columns that are present in the Sequelize lead model.
    // demandAmt tracks the outstanding balance (same value as payBalance);
    // dueDate/demdRemark only overwrite when the Payment stage actually sent
    // a balance-due-date/remark — otherwise leave whatever was already there
    // (e.g. the quotation stage's own dueDate) untouched.
    await sequelize.query(`
      UPDATE crm_forum_leads
      SET paidYet = ?, payBalance = ?, demandAmt = ?, dueDate = COALESCE(?, dueDate), demdRemark = COALESCE(?, demdRemark),
          last_updated = ?, last_updtd_time = ?, status = ?, status_date = ?
      WHERE id = ?
    `, {
      replacements: [
        newPaidYet,
        newPayBalance,
        newPayBalance,
        paymentData.dueDate ? new Date(paymentData.dueDate) : null,
        paymentData.remark || null,
        new Date().toLocaleDateString(),
        new Date().toTimeString().split(' ')[0],
        newPayBalance <= 0 ? 'fully_paid' : 'partially_paid',
        new Date(),
        lead.id,
      ],
      transaction,
    });

    // Step 5: Record in crm_pay_history
    const totalPaidSoFar = newPaidYet;
    const proofUrl = proofOfPaymentUrl;
    await sequelize.query(`
      INSERT INTO crm_pay_history
        (leadId, amount, counselor_receipt, tabby, date, payMethod, payoption, paycardoption,
         payNextDate, payBalance, tax, payCategory, payment_remarks, remark, status, proof_url,
         admin_fee_included, admin_fee_amount,
         thirdPartyAmt, dmAmt, dmTax, dmRefundAmt, curValue, refNumber,
         created_by, stage, totaltillnow)
      VALUES
        (:leadId, :amount, :receiptNumber, 0, :payDate, :payMethod, :payoption, '',
         :payNextDate, :payBalance, 0, :payCategory, :remarks, :remark, 1, :proofUrl,
         :adminFeeIncluded, :adminFeeAmount,
         0, :amount, 0, 0, 0, :refNumber,
         :createdBy, 'payment', :totalPaidSoFar)
    `, {
      replacements: {
        leadId,
        amount: paidAmount,
        receiptNumber,
        proofUrl,
        payDate: paymentData.paymentDate || new Date(),
        payMethod: paymentData.paymentMethod || 'cash',
        payoption: paymentData.paymentStructure || 'full',
        payNextDate: paymentData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        payBalance: Math.max(totalAmount - totalPaidSoFar, 0),
        payCategory: receiptData.receiptType || 'payment',
        remarks: receiptData.description || `Receipt ${receiptNumber}`,
        remark: paymentData.remark || null,
        adminFeeIncluded: adminFeeIncluded ? 1 : 0,
        adminFeeAmount,
        refNumber: paymentData.transactionId || receiptNumber,
        createdBy: loggedInUser?.id || lead.assignTo || 1,
        totalPaidSoFar,
      },
      transaction,
    });

    // Step 6: Update opportunity if exists
    if (opportunity) {
      await opportunity.update({
        updatedAt: new Date()
      }, { transaction });

      // Create opportunity activity
      await models.CrmcOpportunityActivities.create({
        opportunityId: Number(opportunityId),
        activityType: 'payment_received',
        activityTitle: 'Payment received',
        description: `Payment of ${branchCurrency.currencyCode} ${paidAmount} received`,
        activityDate: new Date(),
        assignedTo: loggedInUser?.id || paymentData.createdBy || lead.assignTo,
        createdBy: loggedInUser?.id || paymentData.createdBy || lead.assignTo,
        status: 'completed',
        priority: 'medium',
        notes: `Receipt ${receiptNumber} generated.`,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction });
    }

    // Step 7: Generate agreement if requested
    let agreement = null;
    let agreementId = 0;
    let agreementNumber = '';
    const agreementStartDate = new Date();
    const agreementEndDate = new Date(agreementStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (generateAgreement && agreementData) {
      const [agreementIdRows] = await sequelize.query(`
        SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM crm_opportunity_agreements
      `, { transaction });
      agreementId = Number((agreementIdRows as any[])[0]?.nextId || 0);
      if (!agreementId) throw new Error('Could not allocate an agreement ID');
      // AG/{branch}/{product}/{DDMMYYYY}/{seq}, e.g. AG/QTR/CAN/15072026/001.
      agreementNumber = formatDocumentNumber({
        prefix: 'AG',
        branchName: branchCurrency.branchName,
        branchAddress: branchCurrency.branchAddress,
        branchAbbrv: branchCurrency.branchAbbrv,
        product: agreementData.serviceType || lead.service_interest,
        sequenceId: agreementId,
      });
      agreement = await models.CrmcOpportunityAgreements.create({
        id: agreementId,
        opportunityId: opportunityId || null,
        agreementNumber,
        agreementType: agreementData.agreementType || 'service_agreement',
        templateId: agreementData.templateId || null,
        status: 'draft',
        title: agreementData.title || `Service Agreement - ${lead.fname} ${lead.lname}`,
        description: agreementData.description || `Service agreement for ${lead.service_interest}`,
        termsAndConditions: agreementData.termsAndConditions || '',
        totalAmount: agreementData.totalAmount || lead.payTotal || 0,
        currency: branchCurrency.currencyCode,
        startDate: agreementData.startDate || agreementStartDate,
        endDate: agreementData.endDate || agreementEndDate,
        signedDate: null,
        clientName: lead.client_actual_name || `${lead.fname} ${lead.lname}`,
        clientEmail: lead.email,
        clientPhone: lead.mobile || lead.phone,
        companyName: agreementData.companyName || branchCurrency.branchName || '',
        companyAddress: agreementData.companyAddress || branchCurrency.branchAddress || '',
        createdBy: loggedInUser?.id || agreementData.createdBy || lead.assignTo,
        uploadedBy: loggedInUser?.id || agreementData.createdBy || lead.assignTo,
        generatedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction });

      // Legacy contract register: give this lead a contract number (CNT-#####)
      // alongside the modern crm_opportunity_agreements row.
      await models.CrmcForumLeadsContracts.create({
        leadId: lead.id,
        contract: agreementData.documentUrl || `${agreementNumber}.pdf`,
        unsigned_contract: `unsigned_${agreementNumber}.pdf`,
        ar_contract: `ar_${agreementNumber}.pdf`,
        new_contract: agreementData.documentUrl || null,
        garys: null,
        remarks: `Auto-created from receipt/agreement generation. Agreement number: ${agreementNumber}`,
        verify: 0,
        verify_by: 0,
        verify_date: null,
        batch_id: 0,
        wp_batch_id: 0,
        vendor_id: 0,
        employer_id: 0,
        old_crm_ag_id: 0,
        payment_status: paidAmount > 0 ? 1 : 0,
      }, { transaction });

      // Update lead status to reflect agreement generation
      // lead is a plain object from raw SQL — use a direct UPDATE query.
      await sequelize.query(
        `UPDATE crm_forum_leads SET status='agreement_generated', convet='Agreement', stepComplete=3, status_date=? WHERE id=?`,
        { replacements: [new Date(), lead.id], transaction }
      );
    }

    await transaction.commit();

    // Let Accounts know a new payment is waiting on their queue — without
    // this, verification only happens if someone thinks to check the
    // Payment Verification page on their own.
    await notifyRole({
      roleType: 'accountant',
      branchId,
      type: 'payment_submission',
      title: 'Payment submitted for verification',
      message: `Receipt ${receiptNumber} (${branchCurrency.currencyCode} ${paidAmount}) for ${lead.fname} ${lead.lname} is awaiting accounts verification.`,
      priority: 'medium',
      link: `/admin/leads/${lead.id}/edit`,
      relatedId: lead.id,
      relatedType: 'lead',
    });

    // Step 8: Return complete receipt and agreement data
    return NextResponse.json({
      success: true,
      message: 'Receipt generated successfully' + (generateAgreement ? ' and agreement created' : ''),
      data: {
        receipt: {
          id: receiptId,
          receiptNumber,
          paymentNumber: receiptNumber,
          amount: Number(paymentData.amount || paidAmount),
          totalAmount,
          status: 'paid',
          paymentDate: paymentData.paymentDate || new Date(),
          clientName: lead.client_actual_name || `${lead.fname} ${lead.lname}`,
          serviceName: lead.serviceInterestName || lead.service_interest || '',
          branchName: branchCurrency.branchName,
          branchAddress: branchCurrency.branchAddress,
          currency: branchCurrency.currencyCode,
          consultantName: lead.assignedEmployeeName || '',
          agreementNumber: agreementNumber || existingAgreementNumber || null,
          // Always 'pending' at this point — this payment was just inserted
          // in this same transaction, before any accountant has reviewed it.
          accountantStatus: 'pending',
          adminFeeIncluded,
          adminFeeAmount,
        },
        agreement: agreement ? {
          id: agreementId,
          agreementNumber,
          title: agreementData.title || `Service Agreement - ${lead.fname} ${lead.lname}`,
          status: 'draft',
          totalAmount: Number(agreementData.totalAmount || lead.payTotal || 0),
          currency: branchCurrency.currencyCode,
          startDate: agreementData.startDate || agreementStartDate,
          endDate: agreementData.endDate || agreementEndDate
        } : null,
        lead: {
          id: lead.id,
          name: `${lead.fname} ${lead.lname}`,
          status: lead.status,
          paidYet: newPaidYet,
          payBalance: newPayBalance,
          payTotal: lead.payTotal
        }
      }
    });

  } catch (error: any) {
    await transaction.rollback();
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate receipt',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function normalizePaymentType(paymentType?: string): 'deposit' | 'installment' | 'final' | 'refund' {
  if (paymentType === 'installment' || paymentType === 'final' || paymentType === 'refund') {
    return paymentType;
  }
  return 'deposit';
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'finance.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const opportunityId = searchParams.get('opportunityId');
    const receiptNumber = searchParams.get('receiptNumber');
    // Only meaningful (and only applied) when none of the scoping filters
    // above are present — a specific lead/opportunity/receipt's own rows are
    // naturally few, so those paths keep returning a plain array unchanged.
    // Unscoped (admin-wide browse) gets real server-side pagination instead
    // of the entire table.
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));

    let whereClause: any = {};

    if (leadId) {
      // Get receipts for a specific lead
      const opportunities = await models.CrmcOpportunities.findAll({
        where: { leadId },
        attributes: ['id']
      });
      
      if (opportunities.length > 0) {
        whereClause.opportunityId = opportunities.map((opp: any) => opp.id);
      }
    }

    if (opportunityId) {
      whereClause.opportunityId = opportunityId;
    }

    if (receiptNumber) {
      whereClause.paymentNumber = receiptNumber;
    }

    const include = [
      {
        association: 'dmcOpportunity',
        attributes: ['id', 'opportunityName', 'leadId'],
        include: [
          {
            association: 'dmcForumLead',
            attributes: ['id', 'fname', 'lname', 'email', 'mobile']
          }
        ]
      },
      {
        association: 'createdEmployee',
        attributes: ['id', 'name']
      }
    ];

    const isScoped = Boolean(leadId || opportunityId || receiptNumber);
    if (isScoped) {
      const receipts = await models.CrmcOpportunityPayments.findAll({
        where: whereClause,
        include,
        order: [['createdAt', 'DESC']],
      });
      return NextResponse.json(receipts);
    }

    const { rows, count } = await models.CrmcOpportunityPayments.findAndCountAll({
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

  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch receipts', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
