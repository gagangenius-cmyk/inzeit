import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.dashboard']);
  if (isAuthError(auth)) return auth;
  try {
    return NextResponse.json(await HRService.getDashboardData());
  } catch (error) {
    console.error('Failed to build HR dashboard:', error);
    return NextResponse.json({ error: 'Failed to build HR dashboard' }, { status: 500 });
  }
}
