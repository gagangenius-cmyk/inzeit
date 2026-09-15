import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { resolveBranchCurrency } from '@/lib/branchCurrency';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
    || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const currentUser = token ? verifyToken(token) : null;
  if (!currentUser) {
    return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
  }

  const requestedBranchId = Number(new URL(request.url).searchParams.get('branchId') || '') || null;
  const branchCurrency = await resolveBranchCurrency(requestedBranchId || currentUser.branch);
  return NextResponse.json({
    currencyCode: branchCurrency?.currencyCode || 'AED',
    branchName: branchCurrency?.branchName || null,
  });
}
