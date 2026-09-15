import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

export type BranchExchangeRate = {
  branchId: number;
  currencyCode: string;
  rateToAed: number;
};

const DEFAULT_RATE: BranchExchangeRate = { branchId: 0, currencyCode: 'AED', rateToAed: 1 };

/**
 * Resolves a branch's AED exchange rate via crm_branch_exchange_rate_map ->
 * crm_exchange_rate. A branch with no mapping row defaults to AED (rate 1) -
 * this is the "default rate is AED" fallback, not an error condition.
 */
export async function resolveBranchExchangeRate(branchId: number | null | undefined): Promise<BranchExchangeRate> {
  if (!branchId) return DEFAULT_RATE;

  const rows = await sequelize.query<BranchExchangeRate>(
    `SELECT
       m.branch_id AS branchId,
       r.currency_code AS currencyCode,
       r.rate_to_aed AS rateToAed
     FROM crm_branch_exchange_rate_map m
     INNER JOIN crm_exchange_rate r ON r.id = m.exchange_rate_id AND r.status = 1
     WHERE m.branch_id = ?
     LIMIT 1`,
    { replacements: [branchId], type: QueryTypes.SELECT },
  );

  return rows[0] || { ...DEFAULT_RATE, branchId };
}
