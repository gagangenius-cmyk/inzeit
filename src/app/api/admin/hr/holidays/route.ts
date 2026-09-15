import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get('branch_id');
    const branchId = branchParam ? Number.parseInt(branchParam, 10) : undefined;
    const holidays = await HRService.listHolidays(branchId);
    return NextResponse.json({ data: holidays });
  } catch (error) {
    console.error('Failed to fetch HR holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body.holiday_date || !body.name) {
      return NextResponse.json({ error: 'holiday_date and name are required' }, { status: 400 });
    }
    const created = await HRService.createHoliday({
      holiday_date: String(body.holiday_date),
      name: String(body.name),
      branch_id: body.branch_id ? Number(body.branch_id) : null,
      created_by: String(auth.id),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create HR holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}
