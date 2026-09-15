import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view']);
  if (isAuthError(auth)) return auth;
  try {
    return NextResponse.json(await PROService.getDashboardData());
  } catch (error) {
    console.error('Failed to build PRO Works dashboard:', error);
    return NextResponse.json({ error: 'Failed to build PRO Works dashboard' }, { status: 500 });
  }
}
