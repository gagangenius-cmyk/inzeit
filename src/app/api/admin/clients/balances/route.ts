import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['clients.view']);
  if (isAuthError(auth)) return auth;

  await ensureDB();

  try {
  // Keyed the same way as GET /api/admin/clients: a "client" is a lead whose
  // workflow review has both finance and compliance verification approved
  // (crm_opportunity_workflow_reviews), not the unpopulated crm_clients table.
  // Branch Manager gets the same own-branch-only scoping as the clients list
  // itself - CEO and every other clients.view holder see everything.
  const branchScoped = isBranchManagerOrCeo(auth) && !isCeo(auth);
  const rows = await sequelize.query<{
    clientId: number;
    leadId: number;
    payTotal: number;
    paidYet: number;
    payBalance: number;
    receiptCount: number;
    lastReceiptNumber: string;
    lastPaymentDate: string;
  }>(
    `SELECT
       w.id                      AS clientId,
       w.lead_id                 AS leadId,
       COALESCE(l.payTotal, 0)   AS payTotal,
       COALESCE(l.paidYet, 0)    AS paidYet,
       COALESCE(l.payBalance, 0) AS payBalance,
       COUNT(ph.id)              AS receiptCount,
       MAX(ph.counselor_receipt) AS lastReceiptNumber,
       MAX(ph.date)              AS lastPaymentDate
     FROM crm_opportunity_workflow_reviews w
     INNER JOIN (
       SELECT lead_id, MAX(id) AS maxId
       FROM crm_opportunity_workflow_reviews
       WHERE finance_status = 'approved' AND compliance_status = 'approved'
       GROUP BY lead_id
     ) latest ON latest.maxId = w.id
     JOIN crm_forum_leads l ON l.id = w.lead_id
     LEFT JOIN crm_pay_history ph ON ph.leadId = w.lead_id
     WHERE w.finance_status = 'approved' AND w.compliance_status = 'approved'
       ${branchScoped ? 'AND l.branch = :userBranch' : ''}
     GROUP BY w.id, w.lead_id, l.payTotal, l.paidYet, l.payBalance`,
    { replacements: branchScoped ? { userBranch: auth.branch || 0 } : {}, type: QueryTypes.SELECT }
  );
  return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error('[clients/balances] error:', err.message);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}
