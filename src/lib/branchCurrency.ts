import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

export type BranchCurrency = {
  branchId: number;
  // crm_branch.name — the registered legal entity name (e.g. "Didactic
  // Management Consultants L.L.C S.P.C"). Use this for anything printed as
  // an official document (receipts, agreements, invoices) - never as a plain
  // UI label, since it's not the name staff/clients actually recognize.
  branchName: string;
  // crm_branch.branch — the plain, recognizable branch label (e.g. "Dubai",
  // "Abu Dhabi", "Kuwait"). Use this for UI display (dropdowns, tables,
  // dashboards) instead of branchName.
  branchLabel: string;
  branchAddress: string;
  currencyCode: string;
  vatGstPercent: number | null;
  // crm_branch.abbrv — the stable key branchAgreementProfiles.ts resolves the
  // branch's real legal name/licence/governing law from (branchName/Address
  // above are short operational labels, not the registered legal identity).
  branchAbbrv: string;
};

/**
 * Resolves a branch's active currency from crm_currency.country. The legacy
 * crm_branch table identifies the branch country/location in `branch`.
 */
export async function resolveBranchCurrency(branchId: number | null | undefined): Promise<BranchCurrency | null> {
  if (!branchId) return null;

  const rows = await sequelize.query<BranchCurrency>(
    `SELECT
       b.id AS branchId,
       b.name AS branchName,
       b.branch AS branchLabel,
       b.address AS branchAddress,
       c.currency_code AS currencyCode,
       b.vat_gst_percent AS vatGstPercent,
       b.abbrv AS branchAbbrv
     FROM crm_branch b
     INNER JOIN crm_currency c
       ON c.status = 1
      AND LOWER(TRIM(c.country)) IN (
        LOWER(TRIM(b.branch)),
        LOWER(TRIM(b.name)),
        LOWER(TRIM(b.abbrv)),
        CASE
          WHEN LOWER(CONCAT_WS(' ', b.name, b.branch, b.abbrv, b.address)) REGEXP 'dubai|abu dhabi|sharjah|ajman|fujairah|ras al khaimah|umm al quwain'
            THEN 'united arab emirates'
          ELSE ''
        END
      )
     WHERE b.id = ? AND b.status = 1
     ORDER BY CASE
       WHEN LOWER(TRIM(c.country)) = LOWER(TRIM(b.branch)) THEN 1
       WHEN LOWER(TRIM(c.country)) = LOWER(TRIM(b.name)) THEN 2
       ELSE 3
     END
     LIMIT 1`,
    { replacements: [branchId], type: QueryTypes.SELECT },
  );

  return rows[0] || null;
}

export function branchCurrencyError(branchId: number | null | undefined) {
  return `No active currency is configured for branch ${branchId || 'unknown'}. Match crm_branch.branch, name, or abbreviation to crm_currency.country.`;
}

// UAE emirate keywords, shared between the currency-country inference above
// and UAE-only logic elsewhere (e.g. Corporate Tax eligibility on the P&L
// report) so both stay in sync with a single source of truth.
export const UAE_BRANCH_KEYWORDS = 'dubai|abu dhabi|sharjah|ajman|fujairah|ras al khaimah|umm al quwain';

export function isUaeBranchText(text: string): boolean {
  return new RegExp(UAE_BRANCH_KEYWORDS, 'i').test(text || '');
}
