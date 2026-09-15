import { NextRequest, NextResponse } from 'next/server';
import { CrmRole } from '@/models/CrmRole';
import { CrmPermission } from '@/models/CrmPermission';
import { CrmRolePermission } from '@/models/CrmRolePermission';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['roles.manage', 'admin.access']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const roleId = Number.parseInt(id, 10);
    if (!Number.isFinite(roleId)) {
      return NextResponse.json({ error: 'Valid role id is required' }, { status: 400 });
    }

    const role = await CrmRole.findByPk(roleId);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const allPermissions = await CrmPermission.findAll({
      where: { status: 1 },
      order: [['module', 'ASC'], ['action', 'ASC']],
    });

    const grants = await CrmRolePermission.findAll({ where: { role_id: roleId, status: 1 } });
    const grantedIds = new Set(grants.map((grant) => grant.getDataValue('permission_id')));

    const permissions = allPermissions.map((permission) => {
      const data = permission.get({ plain: true });
      return { ...data, granted: grantedIds.has(data.id) };
    });

    return NextResponse.json({
      role: role.get({ plain: true }),
      permissions,
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['roles.manage', 'admin.access']);
  if (isAuthError(auth)) return auth;
  try {
    const { id } = await params;
    const roleId = Number.parseInt(id, 10);
    if (!Number.isFinite(roleId)) {
      return NextResponse.json({ error: 'Valid role id is required' }, { status: 400 });
    }

    const role = await CrmRole.findByPk(roleId);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const body = await request.json();
    const permissionKeys: string[] = Array.isArray(body.permissionKeys) ? body.permissionKeys : [];

    const permissions = await CrmPermission.findAll({ where: { permission_key: permissionKeys, status: 1 } });
    const permissionIds = permissions.map((permission) => permission.getDataValue('id'));

    await CrmRolePermission.update({ status: 0 }, { where: { role_id: roleId } });

    for (const permissionId of permissionIds) {
      await sequelize.query(
        `INSERT INTO crm_role_permissions (role_id, permission_id, status)
         VALUES (:roleId, :permissionId, 1)
         ON DUPLICATE KEY UPDATE status = 1, updated_at = CURRENT_TIMESTAMP`,
        { replacements: { roleId, permissionId } },
      );
    }

    return NextResponse.json({ roleId, grantedCount: permissionIds.length });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Failed to update role permissions' }, { status: 500 });
  }
}
