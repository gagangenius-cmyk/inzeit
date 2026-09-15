import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { CrmCountryProces, CrmService, CrmBranch } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveBranchCurrency } from '@/lib/branchCurrency';

// Backs the standalone "Sample Agreement" preview page — lets a counsellor/BM/CEO
// pick a country + program and see a watermarked, non-binding copy of the real
// bilingual agreement (see src/lib/bilingualAgreementTemplate.ts) with that
// program's configured fee, without creating a lead or opportunity.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const programId = Number(searchParams.get('programId') || '') || null;
    const countryId = Number(searchParams.get('countryId') || '') || null;

    const [countries, programs] = await Promise.all([
      CrmCountryProces.findAll({
        where: { status: 1 },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
        raw: true,
      }),
      CrmService.findAll({
        where: { status: 1 },
        attributes: ['id', 'name', 'validity'],
        order: [['name', 'ASC']],
        raw: true,
      }),
    ]);

    const branchId = auth.branch ? Number(auth.branch) : null;

    let fee: Record<string, unknown> | null = null;
    if (programId) {
      const selectSql = (conditions: string[]) => `
        SELECT
          f.upfront, f.prof_fee,
          f.firstMonth, f.secondMonth, f.thirdMonth,
          f.firstStage, f.secondStage, f.thirdStage, f.forthStage, f.fifthStage,
          c.currency_code AS currencyCode
        FROM crm_fee f
        LEFT JOIN crm_currency c ON f.currency = c.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY f.id DESC
        LIMIT 1
      `;
      const baseConditions = ['f.status = 1', 'f.service = :programId'];
      const baseReplacements: Record<string, unknown> = { programId };

      const runLookup = (conditions: string[], replacements: Record<string, unknown>) =>
        sequelize.query<Record<string, unknown>>(
          selectSql(conditions),
          { replacements, type: QueryTypes.SELECT }
        );

      let rows: Record<string, unknown>[] = [];
      // A fee is priced per branch — the same program can be sold in INR out of
      // an India branch and AED out of a Dubai branch — so this branch's own
      // fee row must win before ever falling back to another branch's pricing.
      if (countryId && branchId) {
        rows = await runLookup(
          [...baseConditions, 'f.country = :countryId', 'f.branch = :branchId'],
          { ...baseReplacements, countryId, branchId }
        );
      }
      if (!rows.length && branchId) {
        // This branch's fee configured for every country (crm_fee.country IS NULL).
        rows = await runLookup(
          [...baseConditions, 'f.country IS NULL', 'f.branch = :branchId'],
          { ...baseReplacements, branchId }
        );
      }
      if (!rows.length && countryId) {
        // No branch-specific pricing exists — fall back to any branch's fee for this country.
        rows = await runLookup(
          [...baseConditions, 'f.country = :countryId'],
          { ...baseReplacements, countryId }
        );
      }
      if (!rows.length) {
        // Last resort: any branch's fee configured for every country.
        rows = await runLookup([...baseConditions, 'f.country IS NULL'], baseReplacements);
      }
      fee = rows[0] || null;
    }

    let branch: { name: string; address: string; nameAr: string; licenseNumber: string | null; abbrv: string | null } | null = null;
    if (branchId) {
      const b = await CrmBranch.findByPk(branchId, {
        attributes: ['name', 'address', 'ar_name', 'license_number', 'abbrv'],
        raw: true,
      });
      if (b) {
        branch = { name: b.name, address: b.address, nameAr: b.ar_name, licenseNumber: b.license_number, abbrv: b.abbrv };
      }
    }

    // Used by the client as the currency fallback when no fee row exists at all,
    // so an unpriced program still shows this branch's local currency instead of
    // a hardcoded default.
    const branchCurrency = await resolveBranchCurrency(branchId);

    return NextResponse.json({
      countries,
      programs,
      fee,
      branch,
      branchCurrencyCode: branchCurrency?.currencyCode || null,
    });
  } catch (error) {
    console.error('Error building sample agreement data:', error);
    return NextResponse.json({ error: 'Failed to load sample agreement data' }, { status: 500 });
  }
}
