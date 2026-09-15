import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { logDataAccess } from '@/lib/dataAccessAudit';
import { captureError } from '@/lib/errorTracking';

// Owner records (passport/Emirates ID/POA/bank signatories) are the most
// restricted PRO data — gated the same way the authenticated /api/v1 twin of
// this endpoint already is (pro.owners.restricted, checked ahead of this fix
// only there, never here — see the systematic-audit bug report).
const OWNER_PERMISSIONS = ['pro.owners.restricted', 'admin.access'];

const roles = ['Owner', 'Partner', 'Investor', 'Director', 'Signatory'] as const;
type OwnerRole = typeof roles[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const readNumber = (body: Record<string, unknown>, key: string) => {
  const value = Number(body[key]);
  return Number.isFinite(value) ? value : null;
};

const readJsonArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isRole = (value: unknown): value is OwnerRole => (
  typeof value === 'string' && roles.includes(value as OwnerRole)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, OWNER_PERMISSIONS);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const records = await PROService.listOwnerDocuments({
      role: searchParams.get('role') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    // Passport/Emirates ID/POA/bank-signatory data - the single most
    // restricted dataset in the app (own compliance framework calls it out
    // by name). Log every view.
    void logDataAccess({ userId: auth.id, entityType: 'pro_owner_document', entityId: searchParams.get('role') || 'all', action: 'view' });

    return NextResponse.json({ records, roles, accessLevels: ['Restricted'] });
  } catch (error) {
    console.error('Failed to fetch owner documents:', error);
    captureError(error, { route: '/api/admin/pro-works/owners' });
    return NextResponse.json({ error: 'Failed to fetch owner documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, OWNER_PERMISSIONS);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;

    if (!readString(body, 'full_name')) return NextResponse.json({ error: 'full_name is required' }, { status: 400 });
    if (!isRole(body.role)) return NextResponse.json({ error: 'role is invalid' }, { status: 400 });
    if (!readString(body, 'nationality')) return NextResponse.json({ error: 'nationality is required' }, { status: 400 });
    if (!readString(body, 'passport_no')) return NextResponse.json({ error: 'passport_no is required' }, { status: 400 });
    if (!readString(body, 'passport_expiry')) return NextResponse.json({ error: 'passport_expiry is required' }, { status: 400 });

    const created = await PROService.createOwnerDocument({
      full_name: readString(body, 'full_name'),
      role: body.role,
      nationality: readString(body, 'nationality'),
      passport_no: readString(body, 'passport_no'),
      passport_expiry: readString(body, 'passport_expiry'),
      emirates_id: readString(body, 'emirates_id') || null,
      emirates_id_expiry: readString(body, 'emirates_id_expiry') || null,
      residence_visa_no: readString(body, 'residence_visa_no') || null,
      visa_expiry: readString(body, 'visa_expiry') || null,
      share_percentage: readNumber(body, 'share_percentage'),
      poa_document: readString(body, 'poa_document') || null,
      poa_expiry: readString(body, 'poa_expiry') || null,
      signature_specimen: readString(body, 'signature_specimen') || null,
      bank_signatories: readJsonArray(body.bank_signatories),
      documents: readJsonArray(body.documents),
      access_level: 'Restricted',
    });

    void logDataAccess({ userId: auth.id, entityType: 'pro_owner_document', entityId: (created as any)?.owner_id ?? 'new', action: 'create' });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create owner document';
    console.error('Failed to create owner document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, OWNER_PERMISSIONS);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const ownerId = readString(body, 'owner_id');

    if (!ownerId) return NextResponse.json({ error: 'owner_id is required' }, { status: 400 });
    if (body.role && !isRole(body.role)) return NextResponse.json({ error: 'role is invalid' }, { status: 400 });

    const updated = await PROService.updateOwnerDocument({
      owner_id: ownerId,
      full_name: readString(body, 'full_name') || undefined,
      role: readString(body, 'role') || undefined,
      nationality: readString(body, 'nationality') || undefined,
      passport_no: readString(body, 'passport_no') || undefined,
      passport_expiry: readString(body, 'passport_expiry') || undefined,
      emirates_id: readString(body, 'emirates_id') || null,
      emirates_id_expiry: readString(body, 'emirates_id_expiry') || null,
      residence_visa_no: readString(body, 'residence_visa_no') || null,
      visa_expiry: readString(body, 'visa_expiry') || null,
      share_percentage: readNumber(body, 'share_percentage'),
      poa_document: readString(body, 'poa_document') || null,
      poa_expiry: readString(body, 'poa_expiry') || null,
      signature_specimen: readString(body, 'signature_specimen') || null,
      bank_signatories: body.bank_signatories ? readJsonArray(body.bank_signatories) : undefined,
      documents: body.documents ? readJsonArray(body.documents) : undefined,
      access_level: 'Restricted',
    });

    void logDataAccess({ userId: auth.id, entityType: 'pro_owner_document', entityId: ownerId, action: 'update' });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update owner document';
    console.error('Failed to update owner document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
