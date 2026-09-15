import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type User } from '@/lib/auth';

const getToken = (request: NextRequest) =>
  request.cookies.get('auth-token')?.value ||
  request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

/**
 * Verifies the caller is authenticated and (optionally) holds one of the
 * given permissions. Returns the user on success, or a ready-to-return
 * NextResponse (401/403) on failure — callers should `return` it directly.
 */
export function requireAuth(request: NextRequest, permissions?: string[]): User | NextResponse {
  const token = getToken(request);
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
  }

  // A client-portal token (see src/lib/clientAuth.ts) must never satisfy a staff
  // route, even if it happens to decode successfully against the same JWT secret.
  if ((user as unknown as { principalType?: string }).principalType === 'client') {
    return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
  }

  if (permissions?.length) {
    const hasAccess = user.permissions?.includes('all') || permissions.some((p) => user.permissions?.includes(p));
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 });
    }
  }

  return user;
}

export const isAuthError = (result: User | NextResponse): result is NextResponse => result instanceof NextResponse;
