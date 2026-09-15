import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

/** GET /api/admin/payment-verification
 *  Returns all opportunity payments with client, lead, and opportunity context.
 *  Accounts team uses this to see pending/verified/rejected payments. Branch
 *  Manager (who also holds payments.view, per the nav gate on this page) is
 *  scoped to their own branch - CEO and finance.* holders see everything.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage', 'payments.view']);
  if (isAuthError(auth)) return auth;

  await ensureDB();

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status') || '';
  const search   = (searchParams.get('search') || '').trim();
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo   = searchParams.get('dateTo') || '';
  const leadId   = searchParams.get('leadId') || '';
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit    = Math.min(100, parseInt(searchParams.get('limit') || '25'));
  const offset   = (page - 1) * limit;

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (status) {
    conditions.push('p.accountantStatus = :status');
    replacements.status = status;
  }
  if (search) {
    conditions.push('(l.fname LIKE :search OR l.lname LIKE :search OR l.email LIKE :search OR l.phone LIKE :search OR p.paymentNumber LIKE :search)');
    replacements.search = `%${search}%`;
  }
  if (dateFrom) { conditions.push('DATE(p.createdAt) >= :dateFrom'); replacements.dateFrom = dateFrom; }
  if (dateTo)   { conditions.push('DATE(p.createdAt) <= :dateTo'); replacements.dateTo = dateTo; }
  if (leadId)   { conditions.push('o.leadId = :leadId'); replacements.leadId = leadId; }
  if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
    conditions.push('COALESCE(l.branch, o.branchId) = :userBranch');
    replacements.userBranch = auth.branch || 0;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [countRows, rows] = await Promise.all([
    sequelize.query<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM crm_opportunity_payments p
       LEFT JOIN crm_opportunities o ON o.id = p.opportunityId
       LEFT JOIN crm_forum_leads l ON l.id = o.leadId
       ${where}`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query<{
      id: number;
      paymentNumber: string;
      totalAmount: number;
      paidAmount: number;
      remainingBalance: number;
      currency: string;
      paymentMethod: string;
      paymentDate: string;
      transactionId: string;
      proofOfPaymentUrl: string;
      status: string;
      accountantStatus: string;
      accountantRemarks: string;
      accountantVerifiedAt: string;
      opportunityId: number;
      opportunityName: string;
      leadId: number;
      clientName: string;
      clientEmail: string;
      clientPhone: string;
      serviceName: string;
      createdAt: string;
    }>(
      `SELECT
         p.id,
         p.paymentNumber,
         p.totalAmount,
         p.paidAmount,
         p.remainingBalance,
         COALESCE(p.currency,'AED') AS currency,
         p.paymentMethod,
         p.paymentDate,
         p.transactionId,
         -- The opportunity flow wizard's Payment stage defers the actual file
         -- upload to the Documents stage (it needs an opportunityId for the
         -- blob path, which isn't known until the opportunity is created), so
         -- a proof-of-payment file usually lands in crm_opportunity_documents
         -- (documentType='proof_of_payment') rather than p.receiptUrl. Prefer
         -- receiptUrl when a caller did set it directly, otherwise fall back
         -- to the latest matching document for this opportunity.
         COALESCE(p.receiptUrl, doc.filePath) AS proofOfPaymentUrl,
         p.status,
         COALESCE(p.accountantStatus,'pending') AS accountantStatus,
         p.accountantRemarks,
         p.accountantVerifiedAt,
         o.id AS opportunityId,
         o.opportunityName,
         l.id AS leadId,
         CONCAT(l.fname,' ',COALESCE(l.lname,'')) AS clientName,
         l.email AS clientEmail,
         l.phone AS clientPhone,
         s.name AS serviceName,
         p.createdAt
       FROM crm_opportunity_payments p
       LEFT JOIN crm_opportunities o ON o.id = p.opportunityId
       LEFT JOIN crm_forum_leads l ON l.id = o.leadId
       LEFT JOIN crm_service s ON s.id = l.service_interest
       LEFT JOIN (
         SELECT d1.opportunityId, d1.filePath
         FROM crm_opportunity_documents d1
         INNER JOIN (
           SELECT opportunityId, MAX(id) AS latestId
           FROM crm_opportunity_documents
           WHERE documentType = 'proof_of_payment'
           GROUP BY opportunityId
         ) latest ON latest.opportunityId = d1.opportunityId AND latest.latestId = d1.id
       ) doc ON doc.opportunityId = p.opportunityId
       ${where}
       ORDER BY
         CASE p.accountantStatus WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END ASC,
         p.createdAt DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { ...replacements, limit, offset }, type: QueryTypes.SELECT }
    ),
  ]);

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: Number(countRows[0]?.total ?? 0),
      pages: Math.ceil(Number(countRows[0]?.total ?? 0) / limit),
    },
  });
}
