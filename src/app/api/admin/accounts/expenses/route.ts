import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { CrmExpense, CrmBranch } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isFinanceOrAccounts } from '@/lib/roleChecks';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };
const n = (v: unknown) => Number(v || 0);
const canManage = (user: ReturnType<typeof requireAuth>) => isCeo(user as any) || isFinanceOrAccounts(user as any);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const branchId = Number(searchParams.get('branchId') || '') || null;
    const coaAccountId = Number(searchParams.get('coaAccountId') || '') || null;
    const approved = searchParams.get('approved') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const conditions: string[] = ['1=1'];
    const replacements: Record<string, any> = {};
    if (dateFrom) { conditions.push('DATE(exp.date) >= :dateFrom'); replacements.dateFrom = dateFrom; }
    if (dateTo) { conditions.push('DATE(exp.date) <= :dateTo'); replacements.dateTo = dateTo; }
    if (branchId) { conditions.push('exp.branch = :branchId'); replacements.branchId = branchId; }
    if (coaAccountId) { conditions.push('exp.coa_account_id = :coaAccountId'); replacements.coaAccountId = coaAccountId; }
    if (approved === 'yes') conditions.push('exp.is_approval = 1 AND exp.mgmt_approval = 1');
    else if (approved === 'no') conditions.push('(exp.is_approval = 0 OR exp.mgmt_approval = 0)');

    const whereSql = conditions.join(' AND ');
    const joins = `
      FROM crm_expense exp
      LEFT JOIN crm_branch b ON b.id = exp.branch
      LEFT JOIN crm_coa_accounts c ON c.id = exp.coa_account_id
      LEFT JOIN crm_employee e ON e.id = exp.addBy`;

    const [rows, countRows] = await Promise.all([
      sequelize.query<{
        id: number; date: string; particular: string; amount: number; vat: number;
        branchId: number; branchName: string; coaAccountId: number | null; coaCode: string | null;
        coaName: string | null; addedBy: string; receipt: string; is_approval: number; mgmt_approval: number;
      }>(
        `SELECT
          exp.id, DATE_FORMAT(exp.date,'%Y-%m-%d') AS date, exp.particular, exp.amount, COALESCE(exp.vat,0) AS vat,
          exp.branch AS branchId, COALESCE(b.branch,'N/A') AS branchName,
          exp.coa_account_id AS coaAccountId, c.code AS coaCode, c.name AS coaName,
          COALESCE(e.name,'Unknown') AS addedBy, COALESCE(exp.receipt,'') AS receipt,
          COALESCE(exp.is_approval,0) AS is_approval, COALESCE(exp.mgmt_approval,0) AS mgmt_approval
        ${joins}
        WHERE ${whereSql}
        ORDER BY exp.date DESC, exp.id DESC
        LIMIT :limit OFFSET :offset`,
        { replacements: { ...replacements, limit, offset: (page - 1) * limit }, type: QueryTypes.SELECT }
      ),
      sequelize.query<{ total: number }>(
        `SELECT COUNT(*) AS total ${joins} WHERE ${whereSql}`,
        { replacements, type: QueryTypes.SELECT }
      ),
    ]);

    const total = n(countRows[0]?.total);

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id, date: r.date, particular: r.particular,
        amount: n(r.amount), vat: n(r.vat), total: n(r.amount) + n(r.vat),
        branchId: r.branchId, branch: r.branchName,
        coaAccountId: r.coaAccountId, coaCode: r.coaCode, coaName: r.coaName,
        addedBy: r.addedBy, receipt: r.receipt,
        approved: r.is_approval === 1 && r.mgmt_approval === 1,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const body = await request.json();
    const branchId = Number(body.branch);
    const amount = Number(body.amount);
    const date = body.date;
    const particular = String(body.particular || '').trim();

    if (!branchId || !Number.isFinite(amount) || amount <= 0 || !date || !particular) {
      return NextResponse.json({ error: 'branch, amount, date, and particular are required' }, { status: 400 });
    }

    const branch = await CrmBranch.findByPk(branchId);
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    // VAT is derived from the branch's own admin-configured rate, never
    // trusted from the client, so it can't be under/over-stated on entry.
    const vatPercent = Number(branch.vat_gst_percent || 0);
    const vat = Math.round((amount * vatPercent / 100) * 100) / 100;

    // Duplicate-submission guard: crm_expense has no creation-timestamp
    // column to check a "just now" window against - block an exact repeat
    // (same branch, amount, date, particular, and submitter) instead.
    const recentDuplicate = await CrmExpense.findOne({
      where: { branch: branchId, amount, date: new Date(date), particular, addBy: (auth as any).id },
    });
    if (recentDuplicate) {
      return NextResponse.json({ error: 'A matching expense has already been recorded - check the expense list before resubmitting.' }, { status: 409 });
    }

    const expense = await CrmExpense.create({
      date: new Date(date),
      particular,
      amount,
      vat,
      addBy: (auth as any).id,
      remark: String(body.remark || ''),
      region: branch.region,
      branch: branchId,
      receipt: String(body.receipt || ''),
      is_approval: 0,
      mgmt_approval: 0,
      expense_type: 0,
      transaction_type: 'expense',
      coa_account_id: body.coa_account_id ? Number(body.coa_account_id) : null,
    } as any);

    return NextResponse.json(expense.get({ plain: true }), { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, ...rest } = body;

    const expense = await CrmExpense.findByPk(id);
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (rest.particular !== undefined) updateData.particular = String(rest.particular).trim();
    if (rest.remark !== undefined) updateData.remark = String(rest.remark);
    if (rest.coa_account_id !== undefined) updateData.coa_account_id = rest.coa_account_id ? Number(rest.coa_account_id) : null;

    // Only CEO/Accounts can approve or reject - anyone with expense access
    // can edit the description/COA tagging, but not sign off on it.
    if (rest.mgmt_approval !== undefined || rest.is_approval !== undefined) {
      if (!canManage(auth)) {
        return NextResponse.json({ error: 'Only CEO or Accounts can approve expenses' }, { status: 403 });
      }
      if (rest.mgmt_approval !== undefined) updateData.mgmt_approval = Number(rest.mgmt_approval);
      if (rest.is_approval !== undefined) updateData.is_approval = Number(rest.is_approval);
    }

    await expense.update(updateData);

    return NextResponse.json(expense.get({ plain: true }));
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth as any)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    const expense = await CrmExpense.findByPk(id);
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    await expense.destroy();

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
