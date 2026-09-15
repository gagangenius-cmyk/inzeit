import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo } from '@/lib/roleChecks';
import { CrmRole } from '@/models/CrmRole';
import type { CrmRoleAttributes } from '@/models/CrmRole';
import { Op } from 'sequelize';

const serializeRole = (role: any) => {
  const data = role.get({ plain: true });
  return {
    ...data,
    id: role.getDataValue('id') ?? data.id,
  };
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['roles.manage']);
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
        { name: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status !== '') {
      whereClause.status = parseInt(status);
    }

    // Get total count
    const total = await CrmRole.count({ where: whereClause });

    // Get roles with pagination
    const roles = await CrmRole.findAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['hierarchy', 'ASC'], ['id', 'DESC']]
    });

    return NextResponse.json({
      data: roles.map(serializeRole),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['roles.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    
    const newRole = await CrmRole.create({
      ...body,
      status: 1,
    });

    const createdRole = body.name
      ? await CrmRole.findOne({ where: { name: body.name } })
      : null;

    return NextResponse.json(serializeRole(createdRole || newRole), { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['roles.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const role = await CrmRole.findByPk(id);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    await role.update(updateData);

    return NextResponse.json(serializeRole(role));
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['roles.manage']);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    const role = await CrmRole.findByPk(id);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    await role.destroy();

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
