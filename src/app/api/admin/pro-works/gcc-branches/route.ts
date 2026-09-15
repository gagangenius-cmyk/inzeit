import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const countries = ['UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'] as const;
const statuses = ['Active', 'Inactive', 'Renewal Pending'] as const;
type GccCountry = typeof countries[number];
type BranchStatus = typeof statuses[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const readDocuments = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isCountry = (value: unknown): value is GccCountry => (
  typeof value === 'string' && countries.includes(value as GccCountry)
);

const isStatus = (value: unknown): value is BranchStatus => (
  typeof value === 'string' && statuses.includes(value as BranchStatus)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const records = await PROService.listGccBranchDocuments({
      country: searchParams.get('country') || undefined,
      status: searchParams.get('status') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    return NextResponse.json({ records, countries, statuses });
  } catch (error) {
    console.error('Failed to fetch GCC branch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch GCC branch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['admin.access', 'pro.create']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;

    if (!readString(body, 'branch_name')) return NextResponse.json({ error: 'branch_name is required' }, { status: 400 });
    if (!isCountry(body.country)) return NextResponse.json({ error: 'country is invalid' }, { status: 400 });
    if (!readString(body, 'city')) return NextResponse.json({ error: 'city is required' }, { status: 400 });
    if (!readString(body, 'registration_no')) return NextResponse.json({ error: 'registration_no is required' }, { status: 400 });
    if (!readString(body, 'registration_expiry')) return NextResponse.json({ error: 'registration_expiry is required' }, { status: 400 });
    if (!readString(body, 'licence_type')) return NextResponse.json({ error: 'licence_type is required' }, { status: 400 });
    if (!readString(body, 'licence_expiry')) return NextResponse.json({ error: 'licence_expiry is required' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const created = await PROService.createGccBranchDocument({
      branch_name: readString(body, 'branch_name'),
      country: body.country,
      city: readString(body, 'city'),
      registration_no: readString(body, 'registration_no'),
      registration_expiry: readString(body, 'registration_expiry'),
      licence_type: readString(body, 'licence_type'),
      licence_expiry: readString(body, 'licence_expiry'),
      bank_account: readString(body, 'bank_account') || null,
      bank_name: readString(body, 'bank_name') || null,
      branch_manager: readString(body, 'branch_manager') || null,
      contact_phone: readString(body, 'contact_phone') || null,
      documents: readDocuments(body.documents),
      notes: readString(body, 'notes') || null,
      status: readString(body, 'status') || undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create GCC branch document';
    console.error('Failed to create GCC branch document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['pro.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const branchId = readString(body, 'branch_id');

    if (!branchId) return NextResponse.json({ error: 'branch_id is required' }, { status: 400 });
    if (body.country && !isCountry(body.country)) return NextResponse.json({ error: 'country is invalid' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const updated = await PROService.updateGccBranchDocument({
      branch_id: branchId,
      branch_name: readString(body, 'branch_name') || undefined,
      country: readString(body, 'country') || undefined,
      city: readString(body, 'city') || undefined,
      registration_no: readString(body, 'registration_no') || undefined,
      registration_expiry: readString(body, 'registration_expiry') || undefined,
      licence_type: readString(body, 'licence_type') || undefined,
      licence_expiry: readString(body, 'licence_expiry') || undefined,
      bank_account: readString(body, 'bank_account') || null,
      bank_name: readString(body, 'bank_name') || null,
      branch_manager: readString(body, 'branch_manager') || null,
      contact_phone: readString(body, 'contact_phone') || null,
      documents: body.documents ? readDocuments(body.documents) : undefined,
      notes: readString(body, 'notes') || null,
      status: readString(body, 'status') || undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update GCC branch document';
    console.error('Failed to update GCC branch document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
