import { NextRequest, NextResponse } from 'next/server';
import { CrmRegion } from '@/models/CrmRegion';
import type { CrmRegionAttributes } from '@/models/CrmRegion';
import { Op } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['branches.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status !== '') {
      whereClause.status = parseInt(status);
    }

    // Get total count
    const total = await CrmRegion.count({ where: whereClause });

    // Get regions with pagination
    const regions = await CrmRegion.findAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']]
    });

    return NextResponse.json({
      data: regions.map(region => region.get({ plain: true })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['branches.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();

    const newRegion = await CrmRegion.create({
      ...body,
      status: 1,
    });

    return NextResponse.json(newRegion.get({ plain: true }), { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: 'Failed to create region' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['branches.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const region = await CrmRegion.findByPk(id);
    
    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    await region.update(updateData);

    return NextResponse.json(region.get({ plain: true }));
  } catch (error) {
    console.error('Error updating region:', error);
    return NextResponse.json(
      { error: 'Failed to update region' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    const region = await CrmRegion.findByPk(id);
    
    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    await region.destroy();

    return NextResponse.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    return NextResponse.json(
      { error: 'Failed to delete region' },
      { status: 500 }
    );
  }
}
