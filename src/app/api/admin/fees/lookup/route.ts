import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbInitialized = false;
const ensureDB = async () => {
  if (!dbInitialized) { await connectDB(); dbInitialized = true; }
};

// Callers sometimes pass a human-readable name instead of the numeric FK
// (e.g. a lead's service_interest/country_interest was saved as free text
// like "Resume Marketing Services" or "Canada" rather than the crm_service /
// crm_country_proces id) — Number(name) is NaN, which used to reach the SQL
// as a literal `NaN` and blow up with "Unknown column 'NaN'". Resolve by
// name in that case instead of trusting the value is already an id.
const resolveId = async (value: string, table: 'crm_service' | 'crm_country_proces'): Promise<number | null> => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  const rows = await sequelize.query<{ id: number }>(
    `SELECT id FROM ${table} WHERE LOWER(name) = LOWER(:name) LIMIT 1`,
    { replacements: { name: value }, type: QueryTypes.SELECT }
  );
  return rows[0]?.id ?? null;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['sales.view', 'finance.view']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const country = searchParams.get('country');
    const branch = searchParams.get('branch');

    if (!service) {
      return NextResponse.json({ error: 'service param is required' }, { status: 400 });
    }

    const serviceId = await resolveId(service, 'crm_service');
    if (!serviceId) {
      return NextResponse.json({ data: null, message: 'No fee found for the selected criteria' });
    }

    const baseConditions: string[] = ['f.status = 1'];
    const baseReplacements: Record<string, any> = { service: serviceId };
    baseConditions.push('f.service = :service');
    if (branch) { baseConditions.push('f.branch = :branch'); baseReplacements.branch = Number(branch); }

    const selectSql = (conditions: string[]) => `
      SELECT
        f.id, f.service, f.country, f.branch, f.currency,
        f.upfront, f.prof_fee,
        f.firstMonth, f.secondMonth, f.thirdMonth, f.prof_fee_month,
        f.firstStage, f.secondStage, f.thirdStage, f.forthStage, f.fifthStage, f.prof_fee_stage,
        c.currency_code AS currencyCode,
        s.name          AS serviceName,
        co.name         AS countryName,
        b.branch        AS branchName
      FROM crm_fee f
      LEFT JOIN crm_currency   c ON f.currency = c.id
      LEFT JOIN crm_service    s ON f.service  = s.id
      LEFT JOIN crm_country_proces co ON f.country = co.id
      LEFT JOIN crm_branch     b ON f.branch   = b.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.id DESC
      LIMIT 1
    `;

    let rows: any[] = [];

    const countryId = country ? await resolveId(country, 'crm_country_proces') : null;
    if (countryId) {
      // Try the exact country match first (e.g. Nomad Visa priced per destination country).
      rows = await sequelize.query<any>(
        selectSql([...baseConditions, 'f.country = :country']),
        { replacements: { ...baseReplacements, country: countryId }, type: QueryTypes.SELECT }
      );
    }

    if (!rows.length) {
      // Fall back to services priced the same across all countries (crm_fee.country IS NULL),
      // e.g. Resume Marketing Services, which has no per-country fee rows.
      rows = await sequelize.query<any>(
        selectSql([...baseConditions, 'f.country IS NULL']),
        { replacements: baseReplacements, type: QueryTypes.SELECT }
      );
    }

    if (!rows.length) {
      return NextResponse.json({ data: null, message: 'No fee found for the selected criteria' });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error('Error looking up fee:', error);
    return NextResponse.json({ error: 'Failed to lookup fee' }, { status: 500 });
  }
}
