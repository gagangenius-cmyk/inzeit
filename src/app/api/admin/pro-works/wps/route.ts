import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const statuses = ['Draft', 'Generated', 'Submitted', 'Confirmed', 'Rejected'] as const;
type WpsStatus = typeof statuses[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const isStatus = (value: unknown): value is WpsStatus => (
  typeof value === 'string' && statuses.includes(value as WpsStatus)
);

const readSalaryRecords = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      uid_labour_no: String(record.uid_labour_no || '').trim(),
      name: String(record.name || '').trim(),
      salary: Number(record.salary || 0),
      routing_code: String(record.routing_code || '').trim(),
      account_number: String(record.account_number || '').trim(),
    };
  }).filter((record) => record.uid_labour_no && record.name && record.salary > 0 && record.routing_code && record.account_number);
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.wps.view', 'pro.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const records = await PROService.listWpsRecords({
      status: searchParams.get('status') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    return NextResponse.json({ records, statuses });
  } catch (error) {
    console.error('Failed to fetch WPS records:', error);
    return NextResponse.json({ error: 'Failed to fetch WPS records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['pro.wps.view', 'pro.create']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const payrollMonth = readString(body, 'payroll_month');
    const employerCode = readString(body, 'employer_code');
    const agentId = readString(body, 'agent_id');
    const processedBy = readString(body, 'processed_by');
    const salaryRecords = readSalaryRecords(body.salary_records);

    if (!payrollMonth) return NextResponse.json({ error: 'payroll_month is required' }, { status: 400 });
    if (!employerCode) return NextResponse.json({ error: 'employer_code is required' }, { status: 400 });
    if (!agentId) return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    if (!processedBy) return NextResponse.json({ error: 'processed_by is required' }, { status: 400 });
    if (!salaryRecords.length) return NextResponse.json({ error: 'salary_records are required' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const created = await PROService.createWpsRecord({
      payroll_month: payrollMonth,
      employer_code: employerCode,
      agent_id: agentId,
      processed_by: processedBy,
      payment_date: readString(body, 'payment_date') || null,
      status: readString(body, 'status') || undefined,
      salary_records: salaryRecords,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate WPS record';
    console.error('Failed to generate WPS record:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['pro.wps.view', 'pro.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const wpsId = readString(body, 'wps_id');
    if (!wpsId) return NextResponse.json({ error: 'wps_id is required' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const updated = await PROService.updateWpsRecord({
      wps_id: wpsId,
      submission_date: readString(body, 'submission_date') || null,
      submission_ref: readString(body, 'submission_ref') || null,
      status: readString(body, 'status') || undefined,
      rejection_reason: readString(body, 'rejection_reason') || null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update WPS record';
    console.error('Failed to update WPS record:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
