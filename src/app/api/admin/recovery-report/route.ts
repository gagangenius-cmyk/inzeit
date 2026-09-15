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
  const auth = requireAuth(request, ['finance.view', 'finance.manage', 'payments.view']);
  if (isAuthError(auth)) return auth;

  await ensureDB();

  const { searchParams } = new URL(request.url);
  const search     = searchParams.get('search')?.trim() || '';
  const branchId   = searchParams.get('branch') || '';
  const counselorId = searchParams.get('counselor') || '';
  const dateFrom   = searchParams.get('dateFrom') || '';
  const dateTo     = searchParams.get('dateTo') || '';
  const minBalance = searchParams.get('minBalance') || '';
  const page       = Math.max(1, Number(searchParams.get('page') || 1));
  const limit      = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 50)));
  const offset     = (page - 1) * limit;

  try {
    // Only surface balances that are actually due for recovery - a balance
    // whose next-payment dueDate is still in the future (e.g. a scheduled
    // installment a year out) isn't overdue yet and shouldn't appear in this
    // "needs collecting now" report just because payBalance is nonzero.
    const conds: string[] = ['l.payBalance > 0', '(l.dueDate IS NULL OR l.dueDate <= CURDATE())'];
    const rep: Record<string, unknown> = {};

    if (search) {
      conds.push(`(CONCAT(l.fname,' ',l.lname) LIKE :search OR l.email LIKE :search OR l.mobile LIKE :search OR a.agreementNumber LIKE :search)`);
      rep.search = `%${search}%`;
    }
    if (branchId) { conds.push('l.branch = :branchId'); rep.branchId = Number(branchId); }
    if (counselorId) { conds.push('(l.Counsilor = :counselorId OR l.assignTo = :counselorId)'); rep.counselorId = Number(counselorId); }
    if (dateFrom) { conds.push('DATE(a.createdAt) >= :dateFrom'); rep.dateFrom = dateFrom; }
    if (dateTo)   { conds.push('DATE(a.createdAt) <= :dateTo');   rep.dateTo = dateTo; }
    if (minBalance) { conds.push('l.payBalance >= :minBalance'); rep.minBalance = Number(minBalance); }
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      conds.push('l.branch = :userBranch');
      rep.userBranch = Number(auth.branch || 0);
    } else if (!isCeo(auth) && !(auth.permissions?.includes('all') || auth.permissions?.includes('finance.view') || auth.permissions?.includes('finance.manage'))) {
      // A payments.view-only holder (e.g. a counselor) is not a finance/BM
      // role - restrict to balances they're personally responsible for.
      conds.push('(l.Counsilor = :selfId OR l.assignTo = :selfId)');
      rep.selfId = Number(auth.id);
    }

    const where = `WHERE ${conds.join(' AND ')}`;

    // crm_opportunity_agreements links to crm_opportunities via opportunityId,
    // and crm_opportunities links to leads via leadId — so join through the opportunity.
    const joinClause = `
      FROM crm_forum_leads l
      LEFT JOIN crm_opportunities opp ON opp.leadId = l.id
      LEFT JOIN crm_opportunity_agreements a ON a.opportunityId = opp.id
      LEFT JOIN crm_employee e1 ON l.Counsilor = e1.id
      LEFT JOIN crm_employee e2 ON l.assignTo  = e2.id
      LEFT JOIN crm_branch b   ON l.branch     = b.id
      LEFT JOIN crm_country_proces cp ON cp.id = CAST(l.country_interest AS UNSIGNED)
      LEFT JOIN crm_service s         ON s.id  = CAST(l.service_interest AS UNSIGNED)
      LEFT JOIN crm_program_type pt   ON pt.id = CAST(l.service_interest AS UNSIGNED)
    `;

    const [countRow] = await sequelize.query<{ total: number }>(
      `SELECT COUNT(DISTINCT l.id) AS total ${joinClause} ${where}`,
      { replacements: rep, type: QueryTypes.SELECT }
    );
    const total = Number(countRow?.total || 0);

    const rows = await sequelize.query<any>(
      `SELECT
         l.id              AS leadId,
         CONCAT(COALESCE(l.fname,''), ' ', COALESCE(l.lname,'')) AS clientName,
         l.email, l.mobile, l.phone,
         l.nationality,
         COALESCE(l.payTotal,0)   AS totalFee,
         COALESCE(l.paidYet,0)    AS amountPaid,
         COALESCE(l.payBalance,0) AS balanceDue,
         l.dueDate,
         l.status,
         COALESCE(a.agreementNumber,'—')   AS agreementNumber,
         COALESCE(a.createdAt,'')          AS agreementDate,
         COALESCE(a.totalAmount,l.payTotal,0) AS agreedFee,
         COALESCE(l.discount,0)      AS discount,
         COALESCE(s.name, pt.type, l.service_interest,'') AS serviceInterest,
         COALESCE(cp.name, l.country_interest,'')         AS countryInterest,
         COALESCE(e1.name,'')  AS counselorName,
         COALESCE(e2.name,'')  AS assignedToName,
         COALESCE(b.branch,'') AS branchName,
         (SELECT MAX(ph.date) FROM crm_pay_history ph WHERE ph.leadId = l.id) AS lastPaymentDate,
         (SELECT COUNT(*) FROM crm_pay_history ph WHERE ph.leadId = l.id)     AS paymentCount
       ${joinClause}
       ${where}
       GROUP BY l.id, a.id, e1.name, e2.name, b.branch, cp.name, s.name, pt.type
       ORDER BY l.payBalance DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { ...rep, limit, offset }, type: QueryTypes.SELECT }
    );

    const [summary] = await sequelize.query<any>(
      `SELECT
         COUNT(DISTINCT l.id)        AS totalClients,
         SUM(COALESCE(l.payTotal,0)) AS totalFees,
         SUM(COALESCE(l.paidYet,0))  AS totalPaid,
         SUM(COALESCE(l.payBalance,0)) AS totalBalance
       ${joinClause}
       ${where}`,
      { replacements: rep, type: QueryTypes.SELECT }
    );

    const branches = await sequelize.query(
      `SELECT id, branch AS name FROM crm_branch WHERE status=1 ORDER BY branch ASC LIMIT 50`,
      { type: QueryTypes.SELECT }
    );
    const counselors = await sequelize.query(
      `SELECT id, name FROM crm_employee WHERE status=1 ORDER BY name ASC LIMIT 200`,
      { type: QueryTypes.SELECT }
    );

    return NextResponse.json({
      data: rows,
      summary: summary || { totalClients: 0, totalFees: 0, totalPaid: 0, totalBalance: 0 },
      branches,
      counselors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[recovery-report] error:', err.message);
    return NextResponse.json({ error: err.message, data: [], summary: {} }, { status: 500 });
  }
}
