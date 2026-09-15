import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.payroll', 'hr.self']);
  if (isAuthError(auth)) return auth;
  const employeeId = new URL(request.url).searchParams.get('employee_id');
  if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
  try {
    const compensation = await HRService.getCompensation(employeeId);
    const employee = await HRService.getEmployeeById(Number(employeeId));
    const defaultCurrency = await HRService.resolveDefaultCurrency((employee as { branch?: number | null } | null)?.branch ?? null);
    return NextResponse.json({ compensation, defaultCurrency });
  } catch (error) {
    console.error('Failed to fetch employee compensation:', error);
    return NextResponse.json({ error: 'Failed to fetch compensation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.payroll', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body.employee_id || body.basic_salary === undefined || !body.currency_code) {
      return NextResponse.json({ error: 'employee_id, basic_salary, and currency_code are required' }, { status: 400 });
    }
    const compensation = await HRService.upsertCompensation({
      employee_id: String(body.employee_id),
      basic_salary: Number(body.basic_salary),
      currency_code: String(body.currency_code),
      allowances: Array.isArray(body.allowances) ? body.allowances as { label: string; amount: number }[] : [],
      bank_name: body.bank_name ? String(body.bank_name) : null,
      iban: body.iban ? String(body.iban) : null,
      updated_by: String(auth.id),
    });
    return NextResponse.json({ compensation }, { status: 201 });
  } catch (error) {
    console.error('Failed to save employee compensation:', error);
    return NextResponse.json({ error: 'Failed to save compensation' }, { status: 500 });
  }
}
