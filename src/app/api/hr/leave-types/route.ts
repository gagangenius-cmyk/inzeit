import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { getActiveLeaveTypeNames } from '@/lib/leaveTypes';

// Backs every leave-type dropdown in the app (self-service leave application,
// HR admin console) from crm_leave_type so adding/retiring a leave type is a
// data change, not a code deploy.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const leaveTypes = await getActiveLeaveTypeNames();
    return NextResponse.json({ leaveTypes });
  } catch (error) {
    console.error('Failed to fetch leave types:', error);
    return NextResponse.json({ error: 'Failed to fetch leave types' }, { status: 500 });
  }
}
