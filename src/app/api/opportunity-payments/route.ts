import { NextRequest, NextResponse } from 'next/server';
import { Op, QueryTypes } from 'sequelize';
import { CrmcOpportunityPayments } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');
    const accountantStatus = searchParams.get('accountantStatus');
    // Only meaningful (and only applied) when opportunityId is absent — a
    // single opportunity's own payments are naturally few, so that path
    // keeps returning every matching row as a plain array unchanged, for
    // every existing opportunityId-scoped caller (receipt page, wizard).
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));
    const search = searchParams.get('search')?.trim();

    let whereClause: any = {};

    if (opportunityId) {
      whereClause.opportunityId = opportunityId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (accountantStatus) {
      whereClause.accountantStatus = accountantStatus;
    }

    if (!opportunityId && search) {
      whereClause[Op.or] = [
        { clientName: { [Op.like]: `%${search}%` } },
        { receiptNumber: { [Op.like]: `%${search}%` } },
        { paymentNumber: { [Op.like]: `%${search}%` } },
        { serviceName: { [Op.like]: `%${search}%` } },
      ];
    }

    const canViewAllPayments = auth.permissions?.includes('all')
      || auth.permissions?.includes('payments.view')
      || auth.permissions?.includes('finance.view');

    if (!canViewAllPayments) {
      if (!opportunityId) {
        return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 });
      }

      const [accessRow] = await sequelize.query<{ id: number }>(
        `SELECT o.id
         FROM crm_opportunities o
         LEFT JOIN crm_forum_leads l ON l.id = o.leadId
         WHERE o.id = :opportunityId
           AND (o.assignedTo = :userId OR o.createdBy = :userId OR l.assignTo = :userId OR l.Counsilor = :userId)
         LIMIT 1`,
        { replacements: { opportunityId, userId: auth.id }, type: QueryTypes.SELECT },
      );

      if (!accessRow) {
        return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 });
      }
    }

    // Branch Manager holds payments.view (canViewAllPayments above is true for
    // them), which would otherwise show every branch's receipts - restrict to
    // their own branch here, same exemption pattern (CEO unrestricted) used
    // throughout the rest of this app's branch-scoping.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      if (opportunityId) {
        const [row] = await sequelize.query<{ branch: number | null }>(
          `SELECT COALESCE(l.branch, o.branchId) AS branch
           FROM crm_opportunities o
           LEFT JOIN crm_forum_leads l ON l.id = o.leadId
           WHERE o.id = :opportunityId`,
          { replacements: { opportunityId }, type: QueryTypes.SELECT },
        );
        if (row && row.branch !== null && Number(row.branch) !== Number(auth.branch || 0)) {
          return NextResponse.json({ error: 'You can only view payments for an opportunity in your own branch' }, { status: 403 });
        }
      } else {
        const branchOpportunities = await sequelize.query<{ id: number }>(
          `SELECT o.id
           FROM crm_opportunities o
           LEFT JOIN crm_forum_leads l ON l.id = o.leadId
           WHERE COALESCE(l.branch, o.branchId) = :branch`,
          { replacements: { branch: auth.branch || 0 }, type: QueryTypes.SELECT },
        );
        const ids = branchOpportunities.map((r) => r.id);
        whereClause.opportunityId = { [Op.in]: ids.length ? ids : [-1] };
      }
    }

    const include = [
      {
        association: 'dmcOpportunity',
        attributes: ['id', 'opportunityName', 'estimatedValue', 'currency', 'leadId']
      },
      {
        association: 'createdEmployee',
        attributes: ['id', 'name']
      }
    ];

    // opportunityId-scoped: unchanged plain-array behavior (see param comment
    // above). Unscoped (admin-wide browse): real server-side pagination.
    let payments;
    let total = 0;
    if (opportunityId) {
      payments = await CrmcOpportunityPayments.findAll({
        where: whereClause,
        include,
        order: [['createdAt', 'DESC']],
      });
    } else {
      const result = await CrmcOpportunityPayments.findAndCountAll({
        where: whereClause,
        include,
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        distinct: true,
      });
      payments = result.rows;
      total = result.count;
    }

    // Attach each payment's opportunity's latest agreement number so printed
    // receipts can reference it (an opportunity's agreement is shared across
    // all of its payments, so one lookup per distinct opportunityId suffices).
    // Read via .get({ plain: true }) rather than direct property access — model
    // classes in this codebase declare `public field!: Type`, which shadows
    // Sequelize's attribute getters and makes direct reads unreliable.
    const plainPayments = payments.map((p) => p.get({ plain: true }) as any);
    const opportunityIds = Array.from(new Set(plainPayments.map((p) => p.opportunityId).filter(Boolean)));
    let agreementByOpportunity: Record<number, string> = {};
    let branchByOpportunity: Record<number, { branchName: string | null; branchAddress: string | null; branchEmail: string | null; branchPhone: string | null; branchLicenseNumber: string | null; branchVatGstPercent: number | string | null }> = {};
    if (opportunityIds.length) {
      const [agreementRows, branchRows] = await Promise.all([
        sequelize.query<{ opportunityId: number; agreementNumber: string }>(
        `SELECT a.opportunityId, a.agreementNumber
         FROM crm_opportunity_agreements a
         INNER JOIN (
           SELECT opportunityId, MAX(id) AS latestId
           FROM crm_opportunity_agreements
           WHERE opportunityId IN (:opportunityIds)
           GROUP BY opportunityId
         ) latest ON latest.latestId = a.id
        `,
        { replacements: { opportunityIds }, type: QueryTypes.SELECT },
        ),
        sequelize.query<{ opportunityId: number; branchName: string | null; branchAddress: string | null; branchEmail: string | null; branchPhone: string | null; branchLicenseNumber: string | null; branchVatGstPercent: number | string | null }>(
          `SELECT o.id AS opportunityId,
                  b.name AS branchName,
                  b.address AS branchAddress,
                  b.email AS branchEmail,
                  b.mobile AS branchPhone,
                  b.license_number AS branchLicenseNumber,
                  b.vat_gst_percent AS branchVatGstPercent
           FROM crm_opportunities o
           LEFT JOIN crm_forum_leads l ON l.id = o.leadId
           LEFT JOIN crm_branch b ON b.id = COALESCE(l.branch, o.branchId)
           WHERE o.id IN (:opportunityIds)`,
          { replacements: { opportunityIds }, type: QueryTypes.SELECT },
        ),
      ]);
      agreementByOpportunity = Object.fromEntries(
        agreementRows.map((row) => [row.opportunityId, row.agreementNumber]),
      );
      branchByOpportunity = Object.fromEntries(
        branchRows.map((row) => [row.opportunityId, {
          branchName: row.branchName,
          branchAddress: row.branchAddress,
          branchEmail: row.branchEmail,
          branchPhone: row.branchPhone,
          branchLicenseNumber: row.branchLicenseNumber,
          branchVatGstPercent: row.branchVatGstPercent,
        }]),
      );
    }

    // The Payment stage's "remark" and admin-fee checkbox are never stored on
    // crm_opportunity_payments itself (only on the legacy crm_pay_history
    // ledger, linked by receipt number) — pull them back here so a printed
    // receipt can show them.
    const receiptNumbers = Array.from(new Set(
      plainPayments.map((p) => p.receiptNumber || p.paymentNumber).filter(Boolean)
    ));
    let remarkByReceiptNumber: Record<string, string | null> = {};
    let adminFeeByReceiptNumber: Record<string, { adminFeeIncluded: boolean; adminFeeAmount: number }> = {};
    if (receiptNumbers.length) {
      const payHistoryRows = await sequelize.query<{ counselor_receipt: string; remark: string | null; admin_fee_included: number; admin_fee_amount: number }>(
        `SELECT counselor_receipt, remark, admin_fee_included, admin_fee_amount
         FROM crm_pay_history
         WHERE counselor_receipt IN (:receiptNumbers)`,
        { replacements: { receiptNumbers }, type: QueryTypes.SELECT },
      );
      remarkByReceiptNumber = Object.fromEntries(
        payHistoryRows.filter((row) => row.remark).map((row) => [row.counselor_receipt, row.remark]),
      );
      adminFeeByReceiptNumber = Object.fromEntries(
        payHistoryRows.map((row) => [row.counselor_receipt, {
          adminFeeIncluded: Number(row.admin_fee_included || 0) === 1,
          adminFeeAmount: Number(row.admin_fee_amount || 0),
        }]),
      );
    }

    const paymentsWithAgreement = plainPayments.map((p) => ({
      ...p,
      agreementNumber: agreementByOpportunity[p.opportunityId] || null,
      branchName: p.branchName || branchByOpportunity[p.opportunityId]?.branchName || null,
      branchAddress: p.branchAddress || branchByOpportunity[p.opportunityId]?.branchAddress || null,
      branchEmail: p.branchEmail || branchByOpportunity[p.opportunityId]?.branchEmail || null,
      branchPhone: p.branchPhone || branchByOpportunity[p.opportunityId]?.branchPhone || null,
      branchLicenseNumber: p.branchLicenseNumber || branchByOpportunity[p.opportunityId]?.branchLicenseNumber || null,
      branchVatGstPercent: p.branchVatGstPercent ?? branchByOpportunity[p.opportunityId]?.branchVatGstPercent ?? null,
      remark: remarkByReceiptNumber[p.receiptNumber || p.paymentNumber] || null,
      adminFeeIncluded: adminFeeByReceiptNumber[p.receiptNumber || p.paymentNumber]?.adminFeeIncluded || false,
      adminFeeAmount: adminFeeByReceiptNumber[p.receiptNumber || p.paymentNumber]?.adminFeeAmount || 0,
    }));

    if (opportunityId) {
      return NextResponse.json(paymentsWithAgreement);
    }
    return NextResponse.json({
      data: paymentsWithAgreement,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'payments.create', 'finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();

    const totalAmount = Number(body.totalAmount || body.amount || 0);
    const paidAmount = Number(body.paidAmount || body.amount || 0);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ error: 'totalAmount must be greater than zero' }, { status: 422 });
    }
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return NextResponse.json({ error: 'paidAmount cannot be negative' }, { status: 422 });
    }

    // Duplicate-submission guard: paymentNumber is minted fresh (Date.now() +
    // random) on every call, so it can never catch a resubmit on its own -
    // block an identical (opportunity, amount) payment created in the last
    // minute instead.
    if (body.opportunityId) {
      const recentDuplicate = await CrmcOpportunityPayments.findOne({
        where: {
          opportunityId: body.opportunityId,
          totalAmount,
          paidAmount,
          createdAt: { [Op.gte]: new Date(Date.now() - 60_000) },
        },
      });
      if (recentDuplicate) {
        return NextResponse.json(
          { error: 'A matching payment for this opportunity was already recorded a moment ago.' },
          { status: 409 }
        );
      }
    }

    const paymentData = {
      ...body,
      paymentNumber: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      paymentStructure: body.paymentStructure || 'full',
      paymentType: normalizePaymentType(body.paymentType),
      status: normalizePaymentStatus(body.status),
      totalAmount,
      paidAmount,
      remainingBalance: body.remainingBalance ?? body.balanceAmount ?? Math.max(totalAmount - paidAmount, 0),
      transactionId: body.transactionId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const payment = await CrmcOpportunityPayments.create(paymentData);

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
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

function normalizePaymentStatus(status?: string): 'pending' | 'paid' | 'failed' | 'refunded' {
  if (status === 'paid' || status === 'failed' || status === 'refunded') {
    return status;
  }
  if (status === 'completed') {
    return 'paid';
  }
  return 'pending';
}
