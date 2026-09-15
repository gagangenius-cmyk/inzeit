import { NextRequest, NextResponse } from 'next/server';
import { CrmCoaAccount, CrmExpense } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isFinanceOrAccounts } from '@/lib/roleChecks';
import { connectDB } from '@/lib/sequelize';

const canManage = (user: ReturnType<typeof requireAuth>) => isCeo(user as any) || isFinanceOrAccounts(user as any);
let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const accounts = await CrmCoaAccount.findAll({ order: [['code', 'ASC']] });
    return NextResponse.json({ data: accounts.map((a) => a.get({ plain: true })) });
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch chart of accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!canManage(auth)) {
    return NextResponse.json({ error: 'Only CEO or Accounts can manage the chart of accounts' }, { status: 403 });
  }
  try {
    await ensureDB();
    const body = await request.json();
    const code = String(body.code || '').trim();
    const name = String(body.name || '').trim();
    const groupName = String(body.group_name || '').trim();
    const nature = body.nature === 'CR' ? 'CR' : 'DR';

    if (!code || !name || !groupName) {
      return NextResponse.json({ error: 'code, name, and group_name are required' }, { status: 400 });
    }

    const account = await CrmCoaAccount.create({
      code, name, group_name: groupName, nature, status: 1,
      created_at: new Date(), updated_at: new Date(),
    });

    return NextResponse.json(account.get({ plain: true }), { status: 201 });
  } catch (error: any) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: 'This account code already exists' }, { status: 409 });
    }
    console.error('Error creating COA account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!canManage(auth)) {
    return NextResponse.json({ error: 'Only CEO or Accounts can manage the chart of accounts' }, { status: 403 });
  }
  try {
    await ensureDB();
    const body = await request.json();
    const { id, ...rest } = body;

    const account = await CrmCoaAccount.findByPk(id);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (rest.name !== undefined) updateData.name = String(rest.name).trim();
    if (rest.group_name !== undefined) updateData.group_name = String(rest.group_name).trim();
    if (rest.nature !== undefined) updateData.nature = rest.nature === 'CR' ? 'CR' : 'DR';
    if (rest.status !== undefined) updateData.status = Number(rest.status);

    await account.update(updateData);

    return NextResponse.json(account.get({ plain: true }));
  } catch (error) {
    console.error('Error updating COA account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth as any)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    const account = await CrmCoaAccount.findByPk(id);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const usageCount = await CrmExpense.count({ where: { coa_account_id: id } });
    if (usageCount > 0) {
      return NextResponse.json({ error: 'This account is used by existing expenses and cannot be deleted' }, { status: 409 });
    }

    await account.destroy();

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting COA account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
