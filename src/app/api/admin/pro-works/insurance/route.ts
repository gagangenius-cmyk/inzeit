import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const categories = ['Health', 'Vehicle', 'Office', 'Workmen Compensation', 'Other'] as const;
const statuses = ['Active', 'Expiring', 'Expired', 'Cancelled'] as const;
type InsuranceCategory = typeof categories[number];
type InsuranceStatus = typeof statuses[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const readNumber = (body: Record<string, unknown>, key: string) => {
  const value = Number(body[key]);
  return Number.isFinite(value) ? value : null;
};

const readDependents = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map((name) => ({ name: name.trim() })).filter((item) => item.name);
  }
};

const isCategory = (value: unknown): value is InsuranceCategory => (
  typeof value === 'string' && categories.includes(value as InsuranceCategory)
);

const isStatus = (value: unknown): value is InsuranceStatus => (
  typeof value === 'string' && statuses.includes(value as InsuranceStatus)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view', 'hr.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const records = await PROService.listInsuranceRecords({
      status: searchParams.get('status') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    return NextResponse.json({ records, categories, statuses });
  } catch (error) {
    console.error('Failed to fetch insurance records:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['pro.create']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;

    if (body.insurance_category && !isCategory(body.insurance_category)) return NextResponse.json({ error: 'insurance_category is invalid' }, { status: 400 });
    if (!readString(body, 'insured_name')) return NextResponse.json({ error: 'insured_name is required' }, { status: 400 });
    if (!readString(body, 'insurance_company')) return NextResponse.json({ error: 'insurance_company is required' }, { status: 400 });
    if (!readString(body, 'policy_number')) return NextResponse.json({ error: 'policy_number is required' }, { status: 400 });
    if (!readString(body, 'policy_start')) return NextResponse.json({ error: 'policy_start is required' }, { status: 400 });
    if (!readString(body, 'policy_expiry')) return NextResponse.json({ error: 'policy_expiry is required' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const created = await PROService.createInsuranceRecord({
      insurance_category: readString(body, 'insurance_category') || 'Health',
      employee_id: readString(body, 'employee_id') || null,
      insured_name: readString(body, 'insured_name'),
      insurance_company: readString(body, 'insurance_company'),
      policy_number: readString(body, 'policy_number'),
      policy_start: readString(body, 'policy_start'),
      policy_expiry: readString(body, 'policy_expiry'),
      coverage_amount: readNumber(body, 'coverage_amount'),
      premium_amount: readNumber(body, 'premium_amount'),
      dependents: readDependents(body.dependents),
      network_code: readString(body, 'network_code') || null,
      card_url: readString(body, 'card_url') || null,
      status: readString(body, 'status') || undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create insurance record';
    console.error('Failed to create insurance record:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['pro.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const insuranceId = readString(body, 'insurance_id');

    if (!insuranceId) return NextResponse.json({ error: 'insurance_id is required' }, { status: 400 });
    if (body.insurance_category && !isCategory(body.insurance_category)) return NextResponse.json({ error: 'insurance_category is invalid' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const updated = await PROService.updateInsuranceRecord({
      insurance_id: insuranceId,
      insurance_category: readString(body, 'insurance_category') || undefined,
      employee_id: readString(body, 'employee_id') || null,
      insured_name: readString(body, 'insured_name') || undefined,
      insurance_company: readString(body, 'insurance_company') || undefined,
      policy_number: readString(body, 'policy_number') || undefined,
      policy_start: readString(body, 'policy_start') || undefined,
      policy_expiry: readString(body, 'policy_expiry') || undefined,
      coverage_amount: readNumber(body, 'coverage_amount'),
      premium_amount: readNumber(body, 'premium_amount'),
      dependents: body.dependents ? readDependents(body.dependents) : undefined,
      network_code: readString(body, 'network_code') || null,
      card_url: readString(body, 'card_url') || null,
      status: readString(body, 'status') || undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update insurance record';
    console.error('Failed to update insurance record:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
