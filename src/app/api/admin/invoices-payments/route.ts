import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { canViewAllBranches, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { logDataAccess } from '@/lib/dataAccessAudit';
import { captureError } from '@/lib/errorTracking';

let dbInitialized = false;
const ensureDB = async () => { if (!dbInitialized) { await connectDB(); dbInitialized = true; } };

export async function GET(request: NextRequest) {
  // This route previously had NO auth check at all - verifyToken()'s result
  // was used to compute canViewAll/isBranchManager but never checked for
  // null, so it ran (and returned every invoice/payment company-wide,
  // including client name/email/phone) for anonymous callers too. Financial
  // data is gated by finance.view/finance.manage specifically - CEO and
  // Director of Sales already hold these via their full permission grants,
  // and the Accounts role exists specifically for this module.
  const auth = requireAuth(request, ['finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'invoices';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const branch = searchParams.get('branch') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const currentUser = auth;
    const canViewAll = canViewAllBranches(auth);
    const isBranchManager = isBranchManagerOrCeo(auth) && !canViewAll;

    // Company financial/client-PII data - log who viewed it and when, per
    // the UAE compliance checklist's own "access audit logs should be
    // retained for sensitive HR/financial records" requirement.
    void logDataAccess({ userId: auth.id, entityType: 'invoices_payments', entityId: tab, action: 'view' });

    if (tab === 'stats') {
      return await getStats(dateFrom, dateTo, branch, canViewAll, isBranchManager, currentUser);
    }
    if (tab === 'payments') {
      return await getPayments(search, status, dateFrom, dateTo, branch, page, limit, canViewAll, isBranchManager, currentUser);
    }
    return await getInvoices(search, status, dateFrom, dateTo, branch, page, limit, canViewAll, isBranchManager, currentUser);
  } catch (error) {
    console.error('Error in invoices-payments API:', error);
    captureError(error, { route: '/api/admin/invoices-payments' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getStats(dateFrom: string, dateTo: string, branch: string, canViewAll: boolean, isBranchManager: boolean, currentUser: any) {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (dateFrom) { conditions.push('p.createdAt >= :dateFrom'); replacements.dateFrom = dateFrom; }
  if (dateTo) { conditions.push('p.createdAt <= :dateTo'); replacements.dateTo = `${dateTo} 23:59:59`; }
  if (branch) { conditions.push('p.branchName = :branch'); replacements.branch = branch; }
  if (isBranchManager && currentUser?.branch) {
    conditions.push('(p.branchId = :userBranch OR p.branchId IS NULL)');
    replacements.userBranch = currentUser.branch;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [paymentStats] = await sequelize.query<any>(`
    SELECT
      COUNT(*) AS totalPayments,
      COALESCE(SUM(p.paidAmount), 0) AS totalCollected,
      COALESCE(SUM(p.remainingBalance), 0) AS totalOutstanding,
      COALESCE(SUM(p.totalAmount), 0) AS totalPackageValue,
      COUNT(CASE WHEN p.status = 'completed' OR p.status = 'paid' THEN 1 END) AS completedPayments,
      COUNT(CASE WHEN p.status = 'pending' THEN 1 END) AS pendingPayments
    FROM crm_opportunity_payments p
    ${where}
  `, { replacements, type: QueryTypes.SELECT });

  const [invoiceStats] = await sequelize.query<any>(`
    SELECT
      COUNT(*) AS totalInvoices,
      COALESCE(SUM(i.totPayAmt), 0) AS totalInvoiceAmount,
      COALESCE(SUM(i.payBalance), 0) AS totalInvoiceBalance,
      COALESCE(SUM(i.amount), 0) AS totalReceived
    FROM crm_b2b_invoices i
    LEFT JOIN crm_opportunity_payments p ON i.receipt = p.paymentNumber
    ${where}
  `, { replacements, type: QueryTypes.SELECT });

  const branchBreakdown = await sequelize.query<any>(`
    SELECT
      p.branchName AS branch,
      COUNT(*) AS payments,
      COALESCE(SUM(p.paidAmount), 0) AS collected,
      COALESCE(SUM(p.remainingBalance), 0) AS outstanding
    FROM crm_opportunity_payments p
    ${where}
    GROUP BY p.branchName
    ORDER BY collected DESC
  `, { replacements, type: QueryTypes.SELECT });

  const monthlyTrend = await sequelize.query<any>(`
    SELECT
      DATE_FORMAT(p.createdAt, '%Y-%m') AS month,
      COUNT(*) AS payments,
      COALESCE(SUM(p.paidAmount), 0) AS collected
    FROM crm_opportunity_payments p
    ${where}
    GROUP BY DATE_FORMAT(p.createdAt, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `, { replacements, type: QueryTypes.SELECT });

  return NextResponse.json({
    data: {
      payments: paymentStats || {},
      invoices: invoiceStats || {},
      branchBreakdown,
      monthlyTrend
    }
  });
}

async function getPayments(search: string, status: string, dateFrom: string, dateTo: string, branch: string, page: number, limit: number, canViewAll: boolean, isBranchManager: boolean, currentUser: any) {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (search) {
    conditions.push(`(p.clientName LIKE :search OR p.paymentNumber LIKE :search OR p.transactionId LIKE :search OR p.clientEmail LIKE :search OR p.clientPhone LIKE :search)`);
    replacements.search = `%${search}%`;
  }
  if (status) { conditions.push('p.status = :status'); replacements.status = status; }
  if (dateFrom) { conditions.push('p.createdAt >= :dateFrom'); replacements.dateFrom = dateFrom; }
  if (dateTo) { conditions.push('p.createdAt <= :dateTo'); replacements.dateTo = `${dateTo} 23:59:59`; }
  if (branch) { conditions.push('p.branchName = :branch'); replacements.branch = branch; }
  if (isBranchManager && currentUser?.branch) {
    conditions.push('(p.branchId = :userBranch OR p.branchId IS NULL)');
    replacements.userBranch = currentUser.branch;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countResult] = await sequelize.query<any>(`
    SELECT COUNT(*) AS total FROM crm_opportunity_payments p ${where}
  `, { replacements, type: QueryTypes.SELECT });

  const total = Number(countResult?.total || 0);

  const payments = await sequelize.query<any>(`
    SELECT
      p.*,
      l.fname, l.lname, l.phone, l.email,
      o.opportunityName, o.estimatedValue,
      e.name AS counselorName,
      ae.name AS accountantName,
      b.name AS dmBranchName,
      b.address AS dmBranchAddress,
      b.email AS dmBranchEmail,
      b.mobile AS dmBranchPhone,
      b.license_number AS dmBranchLicenseNumber,
      b.vat_gst_percent AS dmBranchVatGstPercent,
      (SELECT a.agreementNumber FROM crm_opportunity_agreements a
       WHERE a.opportunityId = p.opportunityId
       ORDER BY a.createdAt DESC LIMIT 1) AS agreementNumber
    FROM crm_opportunity_payments p
    LEFT JOIN crm_forum_leads l ON p.leadId = l.id
    LEFT JOIN crm_opportunities o ON p.opportunityId = o.id
    LEFT JOIN crm_employee e ON o.assignedTo = e.id
    LEFT JOIN crm_employee ae ON p.accountantId = ae.id
    LEFT JOIN crm_branch b ON b.id = COALESCE(p.branchId, o.branchId, l.branch)
    ${where}
    ORDER BY p.createdAt DESC
    LIMIT :limit OFFSET :offset
  `, { replacements: { ...replacements, limit, offset: (page - 1) * limit }, type: QueryTypes.SELECT });

  // The Payment stage's "remark" is never stored on crm_opportunity_payments
  // itself (only on the legacy crm_pay_history ledger, linked by receipt
  // number) — pull it back here, same as src/app/api/opportunity-payments/route.ts,
  // so a printed receipt from this screen can show it too.
  const receiptNumbers = Array.from(new Set(
    payments.map((p) => p.receiptNumber || p.paymentNumber).filter(Boolean)
  ));
  let remarkByReceiptNumber: Record<string, string | null> = {};
  if (receiptNumbers.length) {
    const remarkRows = await sequelize.query<{ counselor_receipt: string; remark: string | null }>(
      `SELECT counselor_receipt, remark
       FROM crm_pay_history
       WHERE counselor_receipt IN (:receiptNumbers) AND remark IS NOT NULL AND remark <> ''`,
      { replacements: { receiptNumbers }, type: QueryTypes.SELECT },
    );
    remarkByReceiptNumber = Object.fromEntries(remarkRows.map((row) => [row.counselor_receipt, row.remark]));
  }
  const paymentsWithRemark = payments.map((p) => ({
    ...p,
    remark: remarkByReceiptNumber[p.receiptNumber || p.paymentNumber] || null,
  }));

  return NextResponse.json({
    data: paymentsWithRemark,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}

async function getInvoices(search: string, status: string, dateFrom: string, dateTo: string, branch: string, page: number, limit: number, canViewAll: boolean, isBranchManager: boolean, currentUser: any) {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (search) {
    conditions.push(`(i.receipt LIKE :search OR i.company LIKE :search OR i.purpose LIKE :search)`);
    replacements.search = `%${search}%`;
  }
  if (status) { conditions.push('i.status = :status'); replacements.status = Number(status); }
  if (dateFrom) { conditions.push('i.created >= :dateFrom'); replacements.dateFrom = dateFrom; }
  if (dateTo) { conditions.push('i.created <= :dateTo'); replacements.dateTo = `${dateTo} 23:59:59`; }
  if (branch) { conditions.push('i.branch = :branch'); replacements.branch = Number(branch); }
  // Unlike getStats/getPayments above, this branch never applied
  // isBranchManager scoping at all - a branch-scoped caller could see every
  // branch's invoices here even though the other two tabs correctly narrowed.
  if (isBranchManager && currentUser?.branch) {
    conditions.push('i.branch = :userBranch');
    replacements.userBranch = currentUser.branch;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countResult] = await sequelize.query<any>(`
    SELECT COUNT(*) AS total FROM crm_b2b_invoices i ${where}
  `, { replacements, type: QueryTypes.SELECT });

  const total = Number(countResult?.total || 0);

  const invoices = await sequelize.query<any>(`
    SELECT
      i.*,
      b.name AS branchName,
      b.address AS branchAddress,
      b.email AS branchEmail,
      b.license_number AS branchLicenseNumber,
      b.vat_gst_percent AS branchVatGstPercent,
      e.name AS counselorName,
      p.paymentNumber, p.paidAmount, p.proofOfPaymentUrl, p.paymentMethod, p.paymentDate,
      p.clientName AS oppClientName, p.clientEmail AS oppClientEmail, p.clientPhone AS oppClientPhone,
      p.serviceName, p.receiptUrl, p.currency
    FROM crm_b2b_invoices i
    LEFT JOIN crm_branch b ON i.branch = b.id
    LEFT JOIN crm_employee e ON i.Counsilor = e.id
    LEFT JOIN crm_opportunity_payments p ON i.receipt = p.paymentNumber
    ${where}
    ORDER BY i.created DESC
    LIMIT :limit OFFSET :offset
  `, { replacements: { ...replacements, limit, offset: (page - 1) * limit }, type: QueryTypes.SELECT });

  return NextResponse.json({
    data: invoices,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}
