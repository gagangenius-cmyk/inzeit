import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';
import { CrmSource, CrmSourceAttributes } from '@/models';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['marketing.manage']);
  if (isAuthError(auth)) return auth;
  try {
    console.log('🔄 Starting GET request for market sources');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    console.log('📊 Query params:', { page, limit, search, status });

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

    console.log('🔍 Where clause:', whereClause);

    // Get total count
    const total = await CrmSource.count({ where: whereClause });
    console.log('📈 Total count:', total);

    // Get sources with pagination
    const sources = await CrmSource.findAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']]
    });
    
    console.log('📋 Found sources:', sources.length);

    const result = {
      data: sources.map(source => source.get({ plain: true })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    console.log('✅ Returning result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error fetching sources:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sources', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['marketing.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    
    const newSource = await CrmSource.create({
      ...body,
      status: 1,
    });

    return NextResponse.json(newSource.get({ plain: true }), { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['marketing.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const source = await CrmSource.findByPk(id);
    
    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    await source.update(updateData);

    return NextResponse.json(source.get({ plain: true }));
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['marketing.manage']);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    const source = await CrmSource.findByPk(id);
    
    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    await source.destroy();

    return NextResponse.json({ message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
