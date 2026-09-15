import { NextRequest, NextResponse } from 'next/server';
import { CrmExchangeRate, CrmBranchExchangeRateMap, CrmBranch } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isFinanceOrAccounts } from '@/lib/roleChecks';
import { connectDB } from '@/lib/sequelize';

// Only CEO/Accounts can manage exchange rates - Branch Manager/Sales only
// read AED-converted totals on the Sales Report, they never edit rates.
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
    const rates = await CrmExchangeRate.findAll({ order: [['currency_code', 'ASC']] });
    const mappings = await CrmBranchExchangeRateMap.findAll({
      include: [{ model: CrmBranch, as: 'branch', attributes: ['id', 'branch'] }],
    });

    return NextResponse.json({
      rates: rates.map((r) => r.get({ plain: true })),
      mappings: mappings.map((m) => m.get({ plain: true })),
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!canManage(auth)) {
    return NextResponse.json({ error: 'Only CEO or Accounts can manage exchange rates' }, { status: 403 });
  }
  try {
    await ensureDB();
    const body = await request.json();
    const currencyCode = String(body.currency_code || '').trim().toUpperCase();
    const rate = Number(body.rate_to_aed);

    if (!currencyCode) {
      return NextResponse.json({ error: 'currency_code is required' }, { status: 400 });
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: 'rate_to_aed must be a positive number' }, { status: 400 });
    }

    const newRate = await CrmExchangeRate.create({
      currency_code: currencyCode,
      rate_to_aed: rate,
      status: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return NextResponse.json(newRate.get({ plain: true }), { status: 201 });
  } catch (error: any) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: 'This currency already has a rate' }, { status: 409 });
    }
    console.error('Error creating exchange rate:', error);
    return NextResponse.json({ error: 'Failed to create exchange rate' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['finance.manage']);
  if (isAuthError(auth)) return auth;
  if (!canManage(auth)) {
    return NextResponse.json({ error: 'Only CEO or Accounts can manage exchange rates' }, { status: 403 });
  }
  try {
    await ensureDB();
    const body = await request.json();
    const { id, ...rest } = body;

    const rate = await CrmExchangeRate.findByPk(id);
    if (!rate) {
      return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (rest.currency_code !== undefined) updateData.currency_code = String(rest.currency_code).trim().toUpperCase();
    if (rest.rate_to_aed !== undefined) {
      const rateVal = Number(rest.rate_to_aed);
      if (!Number.isFinite(rateVal) || rateVal <= 0) {
        return NextResponse.json({ error: 'rate_to_aed must be a positive number' }, { status: 400 });
      }
      updateData.rate_to_aed = rateVal;
    }
    if (rest.status !== undefined) updateData.status = Number(rest.status);

    await rate.update(updateData);

    return NextResponse.json(rate.get({ plain: true }));
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return NextResponse.json({ error: 'Failed to update exchange rate' }, { status: 500 });
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

    const rate = await CrmExchangeRate.findByPk(id);
    if (!rate) {
      return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 });
    }
    if (rate.currency_code === 'AED') {
      return NextResponse.json({ error: 'The default AED rate cannot be deleted' }, { status: 400 });
    }

    await rate.destroy();

    return NextResponse.json({ message: 'Exchange rate deleted successfully' });
  } catch (error: any) {
    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      return NextResponse.json({ error: 'This rate is still mapped to a branch - unmap it first' }, { status: 409 });
    }
    console.error('Error deleting exchange rate:', error);
    return NextResponse.json({ error: 'Failed to delete exchange rate' }, { status: 500 });
  }
}
