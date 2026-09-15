import { NextRequest, NextResponse } from 'next/server';
import { CrmCurrency } from '@/models';
import { Op } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['currency.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { country: { [Op.like]: `%${search}%` } },
        { currency_code: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status !== '') {
      whereClause.status = parseInt(status);
    }

    const total = await CrmCurrency.count({ where: whereClause });

    const currencies = await CrmCurrency.findAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    });

    return NextResponse.json({
      data: currencies.map((c) => c.get({ plain: true })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['currency.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();

    const newCurrency = await CrmCurrency.create({
      ...body,
      status: 1,
      created: new Date(),
    });

    return NextResponse.json(newCurrency.get({ plain: true }), { status: 201 });
  } catch (error) {
    console.error('Error creating currency:', error);
    return NextResponse.json({ error: 'Failed to create currency' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['currency.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const currency = await CrmCurrency.findByPk(id);

    if (!currency) {
      return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
    }

    await currency.update(updateData);

    return NextResponse.json(currency.get({ plain: true }));
  } catch (error) {
    console.error('Error updating currency:', error);
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['currency.manage']);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    const currency = await CrmCurrency.findByPk(id);

    if (!currency) {
      return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
    }

    await currency.destroy();

    return NextResponse.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    console.error('Error deleting currency:', error);
    return NextResponse.json({ error: 'Failed to delete currency' }, { status: 500 });
  }
}
