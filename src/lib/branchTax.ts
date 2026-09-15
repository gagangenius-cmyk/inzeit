// crm_branch has no country/tax-rate column, so branch tax treatment is
// resolved from the branch's own name+address text — matching only on
// unambiguous geography terms (city/country), not brand names. Branch legal
// names collide across real branches in ways a brand-name lookup can't
// safely tell apart — e.g. "Disha" is the Qatar entity's name in production,
// not Kuwait's, and both the Abu Dhabi and India entities are named
// "Didactic ..." — so matching "disha"/"didactic" as if they identified one
// specific branch silently mis-taxes a different branch's receipts.
export interface BranchTaxInfo {
  rate: number;
  label: 'VAT' | 'GST';
}

const UAE_VAT: BranchTaxInfo = { rate: 0.05, label: 'VAT' };
const NO_TAX: BranchTaxInfo = { rate: 0, label: 'VAT' };
const INDIA_GST: BranchTaxInfo = { rate: 0.18, label: 'GST' };

export function getBranchTaxInfo(branchNameOrAddress: string | null | undefined): BranchTaxInfo {
  const text = String(branchNameOrAddress || '').toLowerCase();

  if (/india|hyderabad/.test(text)) return INDIA_GST;
  if (/kuwait/.test(text)) return NO_TAX;
  if (/qatar|doha/.test(text)) return NO_TAX;
  if (/abu\s*dhabi/.test(text)) return UAE_VAT;

  // Default: Dubai / rest of UAE.
  return UAE_VAT;
}
