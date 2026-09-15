import { NextRequest, NextResponse } from 'next/server';
import { CrmDepartment } from '@/models/CrmDepartment';
import type { CrmDepartmentAttributes } from '@/models/CrmDepartment';
import { Op } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['departments.manage']);
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
    const total = await CrmDepartment.count({ where: whereClause });

    // Get departments with pagination
    const departments = await CrmDepartment.findAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']]
    });

    return NextResponse.json({
      data: departments.map(department => department.get({ plain: true })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['departments.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();

    const newDepartment = await CrmDepartment.create({
      ...body,
      status: 1,
    });

    return NextResponse.json(newDepartment.get({ plain: true }), { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['departments.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const department = await CrmDepartment.findByPk(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    await department.update(updateData);

    return NextResponse.json(department.get({ plain: true }));
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
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

    const department = await CrmDepartment.findByPk(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    await department.destroy();

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
