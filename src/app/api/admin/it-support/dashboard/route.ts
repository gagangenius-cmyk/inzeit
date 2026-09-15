import { NextRequest, NextResponse } from 'next/server';
import { ITSupportService } from '@/services/it-support-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['it.dashboard', 'it.self']);
  if (isAuthError(auth)) return auth;
  try {
    const stats = await ITSupportService.getDashboardStats(auth);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch IT support dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch IT support dashboard stats' }, { status: 500 });
  }
}
