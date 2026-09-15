import { NextRequest, NextResponse } from 'next/server';
import { PROService } from '@/services/pro-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const visaTypes = ['Employment', 'Mission', 'Investor', 'Partner', 'Other'] as const;
const contractTypes = ['Limited', 'Unlimited'] as const;
const visaStatuses = ['Active', 'Expiring', 'Expired', 'Cancelled', 'Under Processing'] as const;

type VisaType = typeof visaTypes[number];
type ContractType = typeof contractTypes[number];
type VisaStatus = typeof visaStatuses[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const isVisaType = (value: unknown): value is VisaType => (
  typeof value === 'string' && visaTypes.includes(value as VisaType)
);

const isContractType = (value: unknown): value is ContractType => (
  typeof value === 'string' && contractTypes.includes(value as ContractType)
);

const isVisaStatus = (value: unknown): value is VisaStatus => (
  typeof value === 'string' && visaStatuses.includes(value as VisaStatus)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['pro.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const records = await PROService.listEmployeeImmigrationRecords({
      employeeId: searchParams.get('employee_id') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    return NextResponse.json({ records, visaTypes, contractTypes, visaStatuses });
  } catch (error) {
    console.error('Failed to fetch employee immigration records:', error);
    return NextResponse.json({ error: 'Failed to fetch employee immigration records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['pro.create']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;

    if (!readString(body, 'employee_id')) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    if (!readString(body, 'visa_uid')) return NextResponse.json({ error: 'visa_uid is required' }, { status: 400 });
    if (!isVisaType(body.visa_type)) return NextResponse.json({ error: 'visa_type is invalid' }, { status: 400 });
    if (!readString(body, 'visa_issue_date')) return NextResponse.json({ error: 'visa_issue_date is required' }, { status: 400 });
    if (!readString(body, 'visa_expiry_date')) return NextResponse.json({ error: 'visa_expiry_date is required' }, { status: 400 });
    if (body.visa_status && !isVisaStatus(body.visa_status)) return NextResponse.json({ error: 'visa_status is invalid' }, { status: 400 });
    if (!readString(body, 'labour_card_no')) return NextResponse.json({ error: 'labour_card_no is required' }, { status: 400 });
    if (!readString(body, 'labour_card_expiry')) return NextResponse.json({ error: 'labour_card_expiry is required' }, { status: 400 });
    if (!isContractType(body.contract_type)) return NextResponse.json({ error: 'contract_type is invalid' }, { status: 400 });

    const created = await PROService.createEmployeeImmigrationRecord({
      employee_id: readString(body, 'employee_id'),
      visa_uid: readString(body, 'visa_uid'),
      visa_type: body.visa_type,
      visa_issue_date: readString(body, 'visa_issue_date'),
      visa_expiry_date: readString(body, 'visa_expiry_date'),
      visa_status: readString(body, 'visa_status') || undefined,
      labour_card_no: readString(body, 'labour_card_no'),
      labour_card_expiry: readString(body, 'labour_card_expiry'),
      contract_type: body.contract_type,
      mohre_contract_ref: readString(body, 'mohre_contract_ref') || null,
      medical_fitness: readString(body, 'medical_fitness') || null,
      health_insurance_no: readString(body, 'health_insurance_no') || null,
      insurance_expiry: readString(body, 'insurance_expiry') || null,
      entry_permit_no: readString(body, 'entry_permit_no') || null,
      changed_by: readString(body, 'changed_by') || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create employee immigration record';
    console.error('Failed to create employee immigration record:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['pro.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const proEmpId = readString(body, 'pro_emp_id');

    if (!proEmpId) return NextResponse.json({ error: 'pro_emp_id is required' }, { status: 400 });
    if (body.visa_type && !isVisaType(body.visa_type)) return NextResponse.json({ error: 'visa_type is invalid' }, { status: 400 });
    if (body.visa_status && !isVisaStatus(body.visa_status)) return NextResponse.json({ error: 'visa_status is invalid' }, { status: 400 });
    if (body.contract_type && !isContractType(body.contract_type)) return NextResponse.json({ error: 'contract_type is invalid' }, { status: 400 });

    const updated = await PROService.updateEmployeeImmigrationRecord({
      pro_emp_id: proEmpId,
      visa_uid: readString(body, 'visa_uid') || undefined,
      visa_type: isVisaType(body.visa_type) ? body.visa_type : undefined,
      visa_issue_date: readString(body, 'visa_issue_date') || undefined,
      visa_expiry_date: readString(body, 'visa_expiry_date') || undefined,
      visa_status: readString(body, 'visa_status') || undefined,
      labour_card_no: readString(body, 'labour_card_no') || undefined,
      labour_card_expiry: readString(body, 'labour_card_expiry') || undefined,
      contract_type: isContractType(body.contract_type) ? body.contract_type : undefined,
      mohre_contract_ref: readString(body, 'mohre_contract_ref') || null,
      medical_fitness: readString(body, 'medical_fitness') || null,
      health_insurance_no: readString(body, 'health_insurance_no') || null,
      insurance_expiry: readString(body, 'insurance_expiry') || null,
      entry_permit_no: readString(body, 'entry_permit_no') || null,
      changed_by: readString(body, 'changed_by') || null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update employee immigration record';
    console.error('Failed to update employee immigration record:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
