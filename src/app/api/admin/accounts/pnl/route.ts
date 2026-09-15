import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isUaeBranchText } from '@/lib/branchCurrency';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };
const n = (v: unknown) => Number(v || 0);

// UAE Corporate Tax: 9% on profit above an AED 375,000 annual Small Business
// Relief threshold. Pro-rated to the selected period's length since P&L can
// be run for any custom range, not just a full tax year - an approximation
// the UI calls out explicitly, matching the source spec's own caveat to
// confirm with a tax advisor.
const CT_RATE = 0.09;
const CT_ANNUAL_THRESHOLD = 375000;

// toISOString() converts to UTC first, which rolls the date back a day for
// any local timezone ahead of UTC (e.g. Asia/Dubai, GST +4) - use local
// getters instead so "this month" means the server's local calendar month.
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function defaultMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { dateFrom: isoDate(from), dateTo: isoDate(to) };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;

  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const branchId = Number(searchParams.get('branchId') || '') || null;
    const defaults = defaultMonthRange();
    const dateFrom = searchParams.get('dateFrom') || defaults.dateFrom;
    const dateTo = searchParams.get('dateTo') || defaults.dateTo;

    const [branchRows, expenseLineRows] = await Promise.all([
      // Per-branch revenue (actual cash collected in the period, via
      // crm_pay_history - the same source the finance route uses for its
      // month-by-month revenue trend) and expenses, so VAT/CT can be applied
      // with each branch's own rate/eligibility before summing.
      sequelize.query<{
        id: number; name: string; branchText: string; vatGstPercent: number | null;
        grossRevenue: number; expenseAmount: number; expenseVat: number;
      }>(
        `SELECT
          b.id, b.name,
          CONCAT_WS(' ', b.name, b.branch, b.abbrv, b.address) AS branchText,
          b.vat_gst_percent AS vatGstPercent,
          COALESCE(rev.grossRevenue, 0) AS grossRevenue,
          COALESCE(exp.expenseAmount, 0) AS expenseAmount,
          COALESCE(exp.expenseVat, 0) AS expenseVat
        FROM crm_branch b
        LEFT JOIN (
          SELECT l.branch AS branchId, SUM(ph.amount) AS grossRevenue
          FROM crm_pay_history ph
          JOIN crm_forum_leads l ON l.id = ph.leadId
          WHERE DATE(ph.date) BETWEEN :dateFrom AND :dateTo
            AND (ph.status IS NULL OR ph.status NOT IN ('cancelled','refund'))
          GROUP BY l.branch
        ) rev ON rev.branchId = b.id
        LEFT JOIN (
          SELECT branch AS branchId, SUM(amount) AS expenseAmount, SUM(vat) AS expenseVat
          FROM crm_expense
          WHERE DATE(date) BETWEEN :dateFrom AND :dateTo
          GROUP BY branch
        ) exp ON exp.branchId = b.id
        WHERE b.status = 1 ${branchId ? 'AND b.id = :branchId' : ''}`,
        { replacements: { dateFrom, dateTo, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),

      // Expense breakdown by COA group/account, for display - independent of
      // the per-branch CT calculation above.
      sequelize.query<{ groupName: string; code: string | null; name: string | null; amount: number; vat: number }>(
        `SELECT
          COALESCE(c.group_name, 'Uncategorized') AS groupName,
          c.code, c.name,
          COALESCE(SUM(exp.amount), 0) AS amount,
          COALESCE(SUM(exp.vat), 0) AS vat
        FROM crm_expense exp
        LEFT JOIN crm_coa_accounts c ON c.id = exp.coa_account_id
        WHERE DATE(exp.date) BETWEEN :dateFrom AND :dateTo
        ${branchId ? 'AND exp.branch = :branchId' : ''}
        GROUP BY groupName, c.code, c.name
        ORDER BY groupName, c.code`,
        { replacements: { dateFrom, dateTo, ...(branchId ? { branchId } : {}) }, type: QueryTypes.SELECT }
      ),
    ]);

    const daysInRange = Math.max(1, Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1);
    const proratedThreshold = CT_ANNUAL_THRESHOLD * (daysInRange / 365);

    let grossRevenue = 0;
    let netRevenue = 0;
    let totalExpenses = 0;
    let uaeOpProfit = 0;

    for (const b of branchRows) {
      const gross = n(b.grossRevenue);
      const vatPercent = n(b.vatGstPercent);
      const net = vatPercent > 0 ? gross / (1 + vatPercent / 100) : gross;
      const branchExpenses = n(b.expenseAmount) + n(b.expenseVat);
      grossRevenue += gross;
      netRevenue += net;
      totalExpenses += branchExpenses;
      if (isUaeBranchText(b.branchText)) uaeOpProfit += (net - branchExpenses);
    }

    const opProfit = netRevenue - totalExpenses;
    const ctProvision = uaeOpProfit > proratedThreshold ? (uaeOpProfit - proratedThreshold) * CT_RATE : 0;
    const netProfit = opProfit - ctProvision;

    return NextResponse.json({
      period: { dateFrom, dateTo, days: daysInRange },
      summary: {
        grossRevenue,
        netRevenue,
        totalExpenses,
        opProfit,
        ctProvision,
        netProfit,
        marginPercent: netRevenue > 0 ? parseFloat(((netProfit / netRevenue) * 100).toFixed(1)) : 0,
      },
      expenseLines: expenseLineRows.map((r) => ({
        groupName: r.groupName,
        code: r.code,
        name: r.name,
        amount: n(r.amount),
        vat: n(r.vat),
        total: n(r.amount) + n(r.vat),
      })),
    });
  } catch (error: any) {
    console.error('[pnl] error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
