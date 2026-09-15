import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const docTypes = [
  'Trade License',
  'Chamber Certificate',
  'Establishment Card',
  'MOA',
  'AOA',
  'VAT Certificate',
  'Tax Registration',
  'Office Lease',
  'Bank Account',
  'Other',
] as const;
const statuses = ['Valid', 'Critical', 'Expiring Soon', 'Expired', 'Renewal In Progress', 'Cancelled'] as const;

type DocType = typeof docTypes[number];
type DocumentStatus = typeof statuses[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const readNumber = (body: Record<string, unknown>, key: string) => {
  const value = Number(body[key]);
  return Number.isFinite(value) ? value : null;
};

const readReminderDays = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0);
  }

  return [90, 60, 30, 7];
};

const isDocType = (value: unknown): value is DocType => (
  typeof value === 'string' && docTypes.includes(value as DocType)
);

const isStatus = (value: unknown): value is DocumentStatus => (
  typeof value === 'string' && statuses.includes(value as DocumentStatus)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const documents = await PROService.listCompanyDocuments(Number.parseInt(searchParams.get('limit') || '100', 10));

    return NextResponse.json({ documents, docTypes, statuses });
  } catch (error) {
    console.error('Failed to fetch company documents:', error);
    return NextResponse.json({ error: 'Failed to fetch company documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['pro.create']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;

    if (!readString(body, 'company_id')) return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    if (!isDocType(body.doc_type)) return NextResponse.json({ error: 'doc_type is invalid' }, { status: 400 });
    if (!readString(body, 'doc_number')) return NextResponse.json({ error: 'doc_number is required' }, { status: 400 });
    if (!readString(body, 'issuing_authority')) return NextResponse.json({ error: 'issuing_authority is required' }, { status: 400 });
    if (!readString(body, 'issue_date')) return NextResponse.json({ error: 'issue_date is required' }, { status: 400 });
    if (!readString(body, 'expiry_date')) return NextResponse.json({ error: 'expiry_date is required' }, { status: 400 });
    if (!readString(body, 'managed_by')) return NextResponse.json({ error: 'managed_by is required' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const created = await PROService.createCompanyDocument({
      company_id: readString(body, 'company_id'),
      doc_type: body.doc_type,
      doc_number: readString(body, 'doc_number'),
      issuing_authority: readString(body, 'issuing_authority'),
      issue_date: readString(body, 'issue_date'),
      expiry_date: readString(body, 'expiry_date'),
      reminder_days: readReminderDays(body.reminder_days),
      status: readString(body, 'status') || undefined,
      doc_file_url: readString(body, 'doc_file_url') || null,
      notes: readString(body, 'notes') || null,
      managed_by: readString(body, 'managed_by'),
      renewal_cost: readNumber(body, 'renewal_cost'),
      last_renewed: readString(body, 'last_renewed') || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create company document';
    console.error('Failed to create company document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['pro.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const documentId = readString(body, 'document_id');

    if (!documentId) return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
    if (body.doc_type && !isDocType(body.doc_type)) return NextResponse.json({ error: 'doc_type is invalid' }, { status: 400 });
    if (body.status && !isStatus(body.status)) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const updated = await PROService.updateCompanyDocument({
      document_id: documentId,
      company_id: readString(body, 'company_id') || undefined,
      doc_type: isDocType(body.doc_type) ? body.doc_type : undefined,
      doc_number: readString(body, 'doc_number') || undefined,
      issuing_authority: readString(body, 'issuing_authority') || undefined,
      issue_date: readString(body, 'issue_date') || undefined,
      expiry_date: readString(body, 'expiry_date') || undefined,
      reminder_days: body.reminder_days ? readReminderDays(body.reminder_days) : undefined,
      status: readString(body, 'status') || undefined,
      doc_file_url: readString(body, 'doc_file_url') || null,
      notes: readString(body, 'notes') || null,
      managed_by: readString(body, 'managed_by') || undefined,
      renewal_cost: readNumber(body, 'renewal_cost'),
      last_renewed: readString(body, 'last_renewed') || null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update company document';
    console.error('Failed to update company document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
