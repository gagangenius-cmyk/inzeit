import { NextRequest, NextResponse } from 'next/server';
import { CrmCurrency } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

// Read-only currency picklist for forms (e.g. the third-party payment
// drawer) — any authenticated staff member can populate a dropdown from
// this, unlike /api/admin/currency which is the currency.manage CRUD screen.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const currencies = await CrmCurrency.findAll({
      where: { status: 1 },
      attributes: ['id', 'country', 'currency_code'],
      order: [['currency_code', 'ASC']],
    });
    return NextResponse.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
  }
}
