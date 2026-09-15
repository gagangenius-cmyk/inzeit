import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeoOrDirectorOfSales } from '@/lib/roleChecks';
import { getTargetProgress, getSubordinateIds } from '@/lib/targetAssignment';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = Number.parseInt(searchParams.get('employeeId') || '', 10);
    const month = searchParams.get('month');
    if (!employeeId || !month) {
      return NextResponse.json({ success: false, error: 'employeeId and month are required' }, { status: 400 });
    }

    if (!isCeoOrDirectorOfSales(auth) && employeeId !== auth.id) {
      const subordinateIds = await getSubordinateIds(auth.id);
      if (!subordinateIds.includes(employeeId)) {
        return NextResponse.json({ success: false, error: 'You cannot view progress for this employee' }, { status: 403 });
      }
    }

    const progress = await getTargetProgress(employeeId, month);
    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Error computing target progress:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to compute progress' },
      { status: 400 }
    );
  }
}
