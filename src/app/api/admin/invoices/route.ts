import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { CrmB2bInvoices } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { resolveBranchCurrency } from '@/lib/branchCurrency';
import { isCeo } from '@/lib/roleChecks';

const handlers = createCrudHandlers({
  model: CrmB2bInvoices,
  entityName: 'invoice',
  searchFields: ['receipt', 'company', 'purpose'],
  filters: {
    region: 'region',
    status: 'status',
  },
  requiredPermissions: ['sales.view', 'finance.view', 'finance.manage', 'invoices.view'],
  // CEO/finance.* see every branch's invoices; Branch Manager their own;
  // everyone else (a plain sales.view holder) their own branch too, since
  // crm_b2b_invoices has no per-employee owner column to narrow further.
  listScope: (auth) => {
    if (isCeo(auth) || auth.permissions?.includes('finance.view') || auth.permissions?.includes('finance.manage')) return null;
    return { branch: auth.branch || 0 };
  },
  defaults: (body) => ({
    created: body.created || new Date(),
  }),
});

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  if (response.status !== 200) return response;

  const body = await response.json();
  const rows: Array<Record<string, unknown>> = Array.isArray(body?.data) ? body.data : [];

  // Each invoice is priced in its own branch's local currency (AED/INR/KWD/QAR),
  // not a hardcoded $ — resolve per invoice's own branch, since one viewer
  // (e.g. CEO/finance) reviews invoices across every branch at once.
  const branchIds = Array.from(new Set(rows.map((row) => Number(row.branch || 0)).filter(Boolean)));
  const currencyByBranch = new Map<number, string>();
  await Promise.all(branchIds.map(async (branchId) => {
    const currency = await resolveBranchCurrency(branchId);
    currencyByBranch.set(branchId, currency?.currencyCode || 'AED');
  }));

  const data = rows.map((row) => ({
    ...row,
    currencyCode: currencyByBranch.get(Number(row.branch || 0)) || 'AED',
  }));

  return NextResponse.json({ ...body, data });
}

export async function POST(request: NextRequest) {
  // Duplicate-submission guard: block an identical invoice (same company,
  // purpose, amount, branch) created in the last minute instead of relying
  // solely on the frontend's submit-button state, which this form previously
  // had none of at all.
  const body = await request.clone().json().catch(() => null) as Record<string, unknown> | null;
  if (body) {
    const recentDuplicate = await CrmB2bInvoices.findOne({
      where: {
        company: body.company ?? null,
        purpose: body.purpose ?? null,
        amount: body.amount ?? null,
        branch: body.branch ?? null,
        created: { [Op.gte]: new Date(Date.now() - 60_000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { error: 'A matching invoice was already created a moment ago - check the invoice list before resubmitting.' },
        { status: 409 }
      );
    }
  }

  return handlers.POST(request);
}
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
