import { NextRequest, NextResponse } from 'next/server';
import { rolePermissionMatrix } from '@/lib/modulePermissions';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  return NextResponse.json({
    data: rolePermissionMatrix,
    columns: ['Role', 'Sales Module', 'Operations Module', 'HR Module', 'PRO Module', 'Admin'],
  });
}
