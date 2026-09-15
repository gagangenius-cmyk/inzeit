import { NextRequest, NextResponse } from 'next/server';
import { CrmBranchExchangeRateMap, CrmExchangeRate, CrmBranch } from '@/models';
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

// Assigns (or reassigns) which exchange rate a branch uses. Branches with no
// row here fall back to AED/1 - see resolveBranchExchangeRate in
// src/lib/exchangeRate.ts. This is the "map to branches, changeable later"
// requirement: reassigning a branch is just an upsert here, independent of
// the rate definitions themselves.
export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!canManage(auth)) {
    return NextResponse.json({ error: 'Only CEO or Accounts can manage branch currency mapping' }, { status: 403 });
  }
  try {
    await ensureDB();
    const body = await request.json();
    const branchId = Number(body.branch_id);
    const exchangeRateId = Number(body.exchange_rate_id);

    if (!branchId || !exchangeRateId) {
      return NextResponse.json({ error: 'branch_id and exchange_rate_id are required' }, { status: 400 });
    }

    const [branch, rate] = await Promise.all([
      CrmBranch.findByPk(branchId),
      CrmExchangeRate.findByPk(exchangeRateId),
    ]);
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    if (!rate) return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 });

    const [mapping] = await CrmBranchExchangeRateMap.upsert({
      branch_id: branchId,
      exchange_rate_id: exchangeRateId,
      updated_at: new Date(),
    });

    return NextResponse.json(mapping.get({ plain: true }));
  } catch (error) {
    console.error('Error mapping branch exchange rate:', error);
    return NextResponse.json({ error: 'Failed to map branch to exchange rate' }, { status: 500 });
  }
}

// Removes a branch's mapping, reverting it to the default AED rate.
export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!canManage(auth)) {
    return NextResponse.json({ error: 'Only CEO or Accounts can manage branch currency mapping' }, { status: 403 });
  }
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const branchId = parseInt(searchParams.get('branchId') || '');
    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
    }

    await CrmBranchExchangeRateMap.destroy({ where: { branch_id: branchId } });

    return NextResponse.json({ message: 'Branch reverted to the default AED rate' });
  } catch (error) {
    console.error('Error removing branch exchange rate mapping:', error);
    return NextResponse.json({ error: 'Failed to remove branch mapping' }, { status: 500 });
  }
}
