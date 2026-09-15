import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { getDiscountTierThresholds, updateDiscountTierThresholds } from '@/lib/discountTierConfig';

function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('auth-token')?.value || authorization?.replace(/^Bearer\s+/i, '');
  return token ? verifyToken(token) : null;
}

// Any authenticated user can read the current thresholds (needed to compute
// tier labels/permissions client-side) - only the CEO can change them.
export async function GET(request: NextRequest) {
  const requester = getAuthenticatedUser(request);
  if (!requester) {
    return NextResponse.json({ success: false, error: 'Authentication is required' }, { status: 401 });
  }
  try {
    const thresholds = await getDiscountTierThresholds();
    return NextResponse.json({ success: true, data: thresholds });
  } catch (error) {
    console.error('Failed to fetch discount tier thresholds:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch discount tier thresholds' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const requester = getAuthenticatedUser(request);
  if (!requester) {
    return NextResponse.json({ success: false, error: 'Authentication is required' }, { status: 401 });
  }
  if (!isCeo(requester as any)) {
    return NextResponse.json({ success: false, error: 'Only the CEO can change discount approval thresholds' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const autoMaxPercent = Number(body.autoMaxPercent);
    const bmCeoMaxPercent = Number(body.bmCeoMaxPercent);
    const updated = await updateDiscountTierThresholds({ autoMaxPercent, bmCeoMaxPercent }, requester.id ?? null);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update discount tier thresholds';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
