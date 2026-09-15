import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const leavingReasons = ['Better Opportunity', 'Salary', 'Relocation', 'Personal', 'Termination', 'Other'] as const;
type LeavingReason = typeof leavingReasons[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const readRating = (body: Record<string, unknown>, key: string) => {
  const value = Number(body[key]);
  return Number.isFinite(value) ? value : 0;
};

const readBoolean = (body: Record<string, unknown>, key: string, fallback = false) => {
  if (body[key] === undefined || body[key] === null) return fallback;
  if (typeof body[key] === 'boolean') return body[key];
  return String(body[key]).toLowerCase() === 'true';
};

const isLeavingReason = (value: unknown): value is LeavingReason => (
  typeof value === 'string' && leavingReasons.includes(value as LeavingReason)
);

const validateRating = (value: number, label: string) => (
  value >= 1 && value <= 5 ? null : `${label} must be between 1 and 5`
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const [interviews, analytics] = await Promise.all([
      HRService.listExitInterviews({
        employeeId: searchParams.get('employee_id') || undefined,
        reason: searchParams.get('reason') || undefined,
        limit: Number.parseInt(searchParams.get('limit') || '100', 10),
      }),
      HRService.getExitInterviewAnalytics(),
    ]);

    return NextResponse.json({ interviews, analytics, reasons: leavingReasons });
  } catch (error) {
    console.error('Failed to fetch exit interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch exit interviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const employeeId = readString(body, 'employee_id');
    const interviewDate = readString(body, 'interview_date');
    const conductedBy = readString(body, 'conducted_by');

    if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    if (!interviewDate) return NextResponse.json({ error: 'interview_date is required' }, { status: 400 });
    if (!conductedBy) return NextResponse.json({ error: 'conducted_by is required' }, { status: 400 });
    if (!isLeavingReason(body.reason_leaving)) return NextResponse.json({ error: 'reason_leaving is invalid' }, { status: 400 });

    const ratings = {
      job_satisfaction: readRating(body, 'job_satisfaction'),
      mgmt_satisfaction: readRating(body, 'mgmt_satisfaction'),
      work_env_rating: readRating(body, 'work_env_rating'),
      compensation_rating: readRating(body, 'compensation_rating'),
      growth_rating: readRating(body, 'growth_rating'),
    };
    const invalidRating = Object.entries(ratings)
      .map(([key, value]) => validateRating(value, key))
      .find(Boolean);
    if (invalidRating) return NextResponse.json({ error: invalidRating }, { status: 400 });

    const created = await HRService.createExitInterview({
      employee_id: employeeId,
      interview_date: interviewDate,
      conducted_by: conductedBy,
      reason_leaving: body.reason_leaving,
      reason_details: readString(body, 'reason_details') || null,
      ...ratings,
      recommend_company: readBoolean(body, 'recommend_company'),
      rehire_eligible: readBoolean(body, 'rehire_eligible'),
      feedback_text: readString(body, 'feedback_text') || null,
      suggestions: readString(body, 'suggestions') || null,
      confidential: readBoolean(body, 'confidential', true),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit exit interview';
    console.error('Failed to submit exit interview:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['hr.delete']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const exitId = searchParams.get('exit_id');
    if (!exitId) {
      return NextResponse.json({ error: 'exit_id is required' }, { status: 400 });
    }
    await HRService.deleteExitInterview(exitId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete exit interview:', error);
    return NextResponse.json({ error: 'Failed to delete exit interview' }, { status: 500 });
  }
}
