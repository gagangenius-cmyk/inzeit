import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };
const n = (v: unknown) => Number(v || 0);

export async function GET(request: NextRequest) {
  try {
    await ensureDB();

    const auth = requireAuth(request, ['finance.view', 'finance.manage']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const months = Number(searchParams.get('months') || '6');
    // Cast to number immediately so any non-numeric input becomes NaN → treated as no filter.
    // Branch Manager can never widen this past their own branch, even by
    // passing a different ?branch= value - CEO/finance.* holders are the
    // only ones who can pick an arbitrary branch or leave it unset for all.
    const requestedBranchId = Number(searchParams.get('branch') || '') || null;
    const branchId = (isBranchManagerOrCeo(auth) && !isCeo(auth))
      ? Number(auth.branch || 0)
      : requestedBranchId;

    // Explicit date range (calendar filter on Revenue/Expenses) overrides the
    // relative `months` lookback for the date-bounded queries below. `months`
    // still drives Branches/Counselors/Payment Methods, which aren't
    // filtered by the calendar picker.
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const useRange = !!(dateFrom && dateTo);
    const rangeReplacements = useRange ? { dateFrom, dateTo } : {};
    const dateCond = (column: string) => useRange
      ? `DATE(${column}) BETWEEN :dateFrom AND :dateTo`
      : `${column} >= DATE_SUB(NOW(), INTERVAL :months MONTH)`;

    const [
      summaryRows,
      revenueByMonthRows,
      opportunityRows,
      expenseRows,
      expenseByMonthRows,
      branchRows,
      counselorRows,
      paymentMethodRows,
    ] = await Promise.all([

      // ── KPI summary ────────────────────────────────────────────────────────
      sequelize.query<{
        total_opps: number; won_opps: number;
        total_revenue: number; collected: number; balance: number;
        total_expenses: number;
      }>(
        `SELECT
          COUNT(DISTINCT o.id) AS total_opps,
          SUM(CASE WHEN o.status='won' THEN 1 ELSE 0 END) AS won_opps,
          COALESCE(SUM(l.payTotal),0) AS total_revenue,
          COALESCE(SUM(l.paidYet),0) AS collected,
          COALESCE(SUM(l.payBalance),0) AS balance,
          COALESCE((SELECT SUM(amount) FROM crm_expense WHERE ${dateCond('date')} ${branchId ? 'AND branch = :branchId' : ''}),0) AS total_expenses
        FROM crm_opportunities o
        LEFT JOIN crm_forum_leads l ON l.id = o.leadId
        LEFT JOIN crm_branch b ON b.id = o.branchId
        WHERE ${dateCond('o.createdAt')}
        ${branchId ? 'AND o.branchId = :branchId' : ''}`,
        { replacements: { months, ...rangeReplacements, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Revenue by month ───────────────────────────────────────────────────
      sequelize.query<{ month: string; revenue: number; collected: number }>(
        `SELECT
          DATE_FORMAT(ph.date,'%Y-%m') AS month,
          COALESCE(SUM(ph.amount),0) AS collected,
          0 AS revenue
        FROM crm_pay_history ph
        ${branchId ? 'JOIN crm_forum_leads l2 ON l2.id=ph.leadId AND l2.branch = :branchId' : ''}
        WHERE ${dateCond('ph.date')}
          AND (ph.status IS NULL OR ph.status NOT IN ('cancelled','refund'))
        GROUP BY month
        ORDER BY month ASC`,
        { replacements: { months, ...rangeReplacements, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Recent opportunities (revenue) ─────────────────────────────────────
      sequelize.query<{
        id: number; opportunityName: string; lead_name: string;
        counselor: string; branch: string; status: string;
        total_fee: number; paid: number; balance: number;
        service: string; created: string;
      }>(
        `SELECT
          o.id, o.opportunityName,
          CONCAT(COALESCE(l.fname,''),' ',COALESCE(l.lname,'')) AS lead_name,
          COALESCE(e.name,'Unassigned') AS counselor,
          COALESCE(b.branch,'N/A') AS branch,
          o.status,
          COALESCE(l.payTotal,0) AS total_fee,
          COALESCE(l.paidYet,0) AS paid,
          COALESCE(l.payBalance,0) AS balance,
          COALESCE(o.serviceRequired,'') AS service,
          DATE_FORMAT(o.createdAt,'%Y-%m-%d') AS created
        FROM crm_opportunities o
        LEFT JOIN crm_forum_leads l ON l.id = o.leadId
        LEFT JOIN crm_employee e ON e.id = o.assignedTo
        LEFT JOIN crm_branch b ON b.id = o.branchId
        WHERE ${dateCond('o.createdAt')}
        ${branchId ? 'AND o.branchId = :branchId' : ''}
        ORDER BY o.id DESC
        LIMIT 100`,
        { replacements: { months, ...rangeReplacements, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Recent expenses ────────────────────────────────────────────────────
      sequelize.query<{
        id: number; date: string; particular: string; amount: number;
        vat: number; branch_name: string; expense_type: number;
        transaction_type: string; is_approval: number; mgmt_approval: number;
      }>(
        `SELECT
          exp.id,
          DATE_FORMAT(exp.date,'%Y-%m-%d') AS date,
          exp.particular, exp.amount, COALESCE(exp.vat,0) AS vat,
          COALESCE(b.branch,'N/A') AS branch_name,
          COALESCE(exp.expense_type,0) AS expense_type,
          COALESCE(exp.transaction_type,'') AS transaction_type,
          COALESCE(exp.is_approval,0) AS is_approval,
          COALESCE(exp.mgmt_approval,0) AS mgmt_approval
        FROM crm_expense exp
        LEFT JOIN crm_branch b ON b.id = exp.branch
        WHERE ${dateCond('exp.date')}
        ${branchId ? 'AND exp.branch = :branchId' : ''}
        ORDER BY exp.date DESC
        LIMIT 200`,
        { replacements: { months, ...rangeReplacements, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Expenses by month ──────────────────────────────────────────────────
      sequelize.query<{ month: string; amount: number; vat: number }>(
        `SELECT
          DATE_FORMAT(date,'%Y-%m') AS month,
          COALESCE(SUM(amount),0) AS amount,
          COALESCE(SUM(vat),0) AS vat
        FROM crm_expense
        WHERE ${dateCond('date')}
        ${branchId ? 'AND branch = :branchId' : ''}
        GROUP BY month
        ORDER BY month ASC`,
        { replacements: { months, ...rangeReplacements, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Branch performance ─────────────────────────────────────────────────
      sequelize.query<{ id: number; name: string; revenue: number; collected: number; opps: number }>(
        `SELECT
          b.id, b.branch AS name,
          COALESCE(SUM(l.payTotal),0) AS revenue,
          COALESCE(SUM(l.paidYet),0) AS collected,
          COUNT(o.id) AS opps
        FROM crm_branch b
        LEFT JOIN crm_opportunities o ON o.branchId=b.id AND o.createdAt >= DATE_SUB(NOW(),INTERVAL :months MONTH)
        LEFT JOIN crm_forum_leads l ON l.id=o.leadId
        WHERE b.status=1 ${branchId ? 'AND b.id = :branchId' : ''}
        GROUP BY b.id, b.branch
        ORDER BY collected DESC`,
        { replacements: { months, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Top counselors by revenue ──────────────────────────────────────────
      sequelize.query<{ id: number; name: string; branch: string; opps: number; collected: number }>(
        `SELECT
          e.id, e.name,
          COALESCE(b.branch,'N/A') AS branch,
          COUNT(o.id) AS opps,
          COALESCE(SUM(l.paidYet),0) AS collected
        FROM crm_employee e
        LEFT JOIN crm_branch b ON b.id=e.branch
        LEFT JOIN crm_opportunities o ON o.assignedTo=e.id AND o.createdAt >= DATE_SUB(NOW(),INTERVAL :months MONTH)
        LEFT JOIN crm_forum_leads l ON l.id=o.leadId
        WHERE e.status=1 ${branchId ? 'AND e.branch = :branchId' : ''}
        GROUP BY e.id, e.name, b.branch
        HAVING opps > 0 OR collected > 0
        ORDER BY collected DESC
        LIMIT 15`,
        { replacements: { months, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // ── Payment methods ────────────────────────────────────────────────────
      sequelize.query<{ method: string; count: number; total: number }>(
        `SELECT
          COALESCE(p.payMethod,'Unknown') AS method,
          COUNT(*) AS count,
          COALESCE(SUM(p.amount),0) AS total
        FROM crm_3party_payment p
        ${branchId ? 'JOIN crm_forum_leads l3 ON l3.id = p.leadId AND l3.branch = :branchId' : ''}
        WHERE p.receipt_date >= DATE_SUB(NOW(), INTERVAL :months MONTH)
        GROUP BY method
        ORDER BY total DESC`,
        { replacements: { months, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),
    ]);

    const s = summaryRows[0] || {};

    // Merge revenue and expense month data
    const allMonths = new Set([
      ...revenueByMonthRows.map(r => r.month),
      ...expenseByMonthRows.map(r => r.month),
    ]);
    const monthlyTrend = Array.from(allMonths).sort().map(month => {
      const rev = revenueByMonthRows.find(r => r.month === month);
      const exp = expenseByMonthRows.find(r => r.month === month);
      return {
        month,
        collected: n(rev?.collected),
        expenses: n(exp?.amount) + n(exp?.vat),
        profit: n(rev?.collected) - (n(exp?.amount) + n(exp?.vat)),
      };
    });

    return NextResponse.json({
      summary: {
        totalOpportunities: n(s.total_opps),
        wonOpportunities: n(s.won_opps),
        totalRevenue: n(s.total_revenue),
        collected: n(s.collected),
        balance: n(s.balance),
        totalExpenses: n(s.total_expenses),
        netProfit: n(s.collected) - n(s.total_expenses),
        collectionRate: n(s.total_revenue) > 0
          ? parseFloat(((n(s.collected) / n(s.total_revenue)) * 100).toFixed(1))
          : 0,
      },
      monthlyTrend,
      opportunities: opportunityRows.map(r => ({
        id: r.id,
        name: r.opportunityName,
        client: r.lead_name.trim() || `Opp #${r.id}`,
        counselor: r.counselor,
        branch: r.branch,
        status: r.status,
        totalFee: n(r.total_fee),
        paid: n(r.paid),
        balance: n(r.balance),
        service: r.service,
        date: r.created,
      })),
      expenses: expenseRows.map(r => ({
        id: r.id,
        date: r.date,
        description: r.particular,
        amount: n(r.amount),
        vat: n(r.vat),
        total: n(r.amount) + n(r.vat),
        branch: r.branch_name,
        type: r.transaction_type || 'General',
        approved: r.is_approval === 1 && r.mgmt_approval === 1,
      })),
      branchPerformance: branchRows.map(r => ({
        id: r.id,
        name: r.name,
        revenue: n(r.revenue),
        collected: n(r.collected),
        opportunities: n(r.opps),
      })),
      counselorPerformance: counselorRows.map(r => ({
        id: r.id,
        name: r.name,
        branch: r.branch,
        opportunities: n(r.opps),
        collected: n(r.collected),
      })),
      paymentMethods: paymentMethodRows.map(r => ({
        method: r.method,
        count: n(r.count),
        total: n(r.total),
      })),
    });
  } catch (error: any) {
    console.error('[finance] error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
