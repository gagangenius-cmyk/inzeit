import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const letterTypes = ['relieving', 'experience'] as const;
type LetterType = typeof letterTypes[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const isLetterType = (value: unknown): value is LetterType => (
  typeof value === 'string' && letterTypes.includes(value as LetterType)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const [templates, letters] = await Promise.all([
      HRService.listLetterTemplates(),
      HRService.listEmployeeLetters({
        employeeId: searchParams.get('employee_id') || undefined,
        limit: Number.parseInt(searchParams.get('limit') || '100', 10),
      }),
    ]);

    return NextResponse.json({ templates, letters });
  } catch (error) {
    console.error('Failed to fetch HR letters:', error);
    return NextResponse.json({ error: 'Failed to fetch HR letters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const employeeId = readString(body, 'employee_id');
    const lastWorkingDay = readString(body, 'last_working_day');
    const hrManagerName = readString(body, 'hr_manager_name');

    if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    if (!isLetterType(body.letter_type)) return NextResponse.json({ error: 'letter_type must be relieving or experience' }, { status: 400 });
    if (!lastWorkingDay) return NextResponse.json({ error: 'last_working_day is required' }, { status: 400 });
    if (!hrManagerName) return NextResponse.json({ error: 'hr_manager_name is required' }, { status: 400 });

    const letter = await HRService.generateEmployeeLetter({
      employee_id: employeeId,
      letter_type: body.letter_type,
      designation: readString(body, 'designation') || null,
      department: readString(body, 'department') || null,
      last_working_day: lastWorkingDay,
      hr_manager_name: hrManagerName,
      hr_manager_designation: readString(body, 'hr_manager_designation') || null,
      issue_date: readString(body, 'issue_date') || null,
      key_responsibilities: readString(body, 'key_responsibilities') || null,
      performance_summary: readString(body, 'performance_summary') || null,
      recommendation_statement: readString(body, 'recommendation_statement') || null,
      generated_by: readString(body, 'generated_by') || null,
    });

    return NextResponse.json(letter, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate HR letter';
    console.error('Failed to generate HR letter:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['hr.delete']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const letterId = searchParams.get('letter_id');
    if (!letterId) {
      return NextResponse.json({ error: 'letter_id is required' }, { status: 400 });
    }
    await HRService.deleteEmployeeLetter(letterId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete HR letter:', error);
    return NextResponse.json({ error: 'Failed to delete HR letter' }, { status: 500 });
  }
}
