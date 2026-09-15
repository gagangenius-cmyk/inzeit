import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const breakTypes = ['Lunch Break', 'Prayer Break', 'Short Break'] as const;
type BreakType = typeof breakTypes[number];
const isBreakType = (value: unknown): value is BreakType => (
  typeof value === 'string' && breakTypes.includes(value as BreakType)
);

// Attendance & breaks are a personal record every employee needs regardless of
// role/module permissions, so this only requires authentication - no permission check.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const employeeId = String(auth.id);
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '14', 10);
    const today = await HRService.getMyTodayAttendance(employeeId);
    const history = await HRService.listMyAttendanceHistory(employeeId, limit);

    return NextResponse.json({ today: today.attendance, breaks: today.breaks, history });
  } catch (error) {
    console.error('Failed to fetch my attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const employeeId = String(auth.id);
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || '');

    if (action === 'clock-in') {
      const result = await HRService.clockIn(employeeId);
      return NextResponse.json(result, { status: 201 });
    }
    if (action === 'clock-out') {
      const result = await HRService.clockOut(employeeId);
      return NextResponse.json(result);
    }
    if (action === 'break-start') {
      if (!isBreakType(body.break_type)) {
        return NextResponse.json({ error: 'break_type must be Lunch Break, Prayer Break, or Short Break' }, { status: 400 });
      }
      const result = await HRService.startBreak(employeeId, body.break_type);
      return NextResponse.json(result, { status: 201 });
    }
    if (action === 'break-end') {
      const result = await HRService.endBreak(employeeId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'action must be clock-in, clock-out, break-start, or break-end' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update attendance';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
