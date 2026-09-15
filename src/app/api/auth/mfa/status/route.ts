import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getMfaStatus } from '@/lib/mfa';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const status = await getMfaStatus(auth.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to fetch MFA status:', error);
    return NextResponse.json({ error: 'Failed to fetch MFA status' }, { status: 500 });
  }
}
