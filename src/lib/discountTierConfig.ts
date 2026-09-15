import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { DEFAULT_DISCOUNT_TIER_THRESHOLDS, type DiscountTierThresholds } from './discountApproval';

// Server-only (imports sequelize) - deliberately kept separate from
// discountApproval.ts, which the client-side discount-approvals page also
// imports for its pure tier-computation helpers.

let tableEnsured = false;
async function ensureDiscountTierConfigTable() {
  if (tableEnsured) return;
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_discount_tier_config (
      id INT NOT NULL PRIMARY KEY DEFAULT 1,
      auto_max_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
      bm_ceo_max_percent DECIMAL(5,2) NOT NULL DEFAULT 30.00,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updated_by INT NULL
    )
  `);
  await sequelize.query(`
    INSERT INTO crm_discount_tier_config (id, auto_max_percent, bm_ceo_max_percent)
    VALUES (1, :autoMaxPercent, :bmCeoMaxPercent)
    ON DUPLICATE KEY UPDATE id = id
  `, {
    replacements: {
      autoMaxPercent: DEFAULT_DISCOUNT_TIER_THRESHOLDS.autoMaxPercent,
      bmCeoMaxPercent: DEFAULT_DISCOUNT_TIER_THRESHOLDS.bmCeoMaxPercent,
    },
  });
  tableEnsured = true;
}

// Tiered discount policy — thresholds are staff-editable (see
// updateDiscountTierThresholds below / PUT /api/discount-approvals/tier-config),
// not a code constant:
// - 0 to auto_max_percent:                  a counsellor can apply it directly, no approval needed.
// - above auto_max_percent: needs sign-off from either the Branch Manager or the
//   CEO, with no upper limit — Branch Manager has the same approval rights as
//   CEO at any discount percentage, so bm_ceo_max_percent only distinguishes
//   the 'bm_or_ceo' vs 'ceo_only' *tier label* for reporting, not who may approve.
export async function getDiscountTierThresholds(): Promise<DiscountTierThresholds> {
  await ensureDiscountTierConfigTable();
  const [row] = await sequelize.query<{ auto_max_percent: string; bm_ceo_max_percent: string }>(
    'SELECT auto_max_percent, bm_ceo_max_percent FROM crm_discount_tier_config WHERE id = 1 LIMIT 1',
    { type: QueryTypes.SELECT }
  );
  if (!row) return DEFAULT_DISCOUNT_TIER_THRESHOLDS;
  return {
    autoMaxPercent: Number(row.auto_max_percent),
    bmCeoMaxPercent: Number(row.bm_ceo_max_percent),
  };
}

export async function updateDiscountTierThresholds(
  thresholds: DiscountTierThresholds,
  updatedBy: number | null
): Promise<DiscountTierThresholds> {
  const { autoMaxPercent, bmCeoMaxPercent } = thresholds;
  if (![autoMaxPercent, bmCeoMaxPercent].every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) {
    throw new Error('Thresholds must be numbers between 0 and 100');
  }
  if (autoMaxPercent >= bmCeoMaxPercent) {
    throw new Error('Auto-approval threshold must be lower than the Branch Manager/CEO threshold');
  }

  await ensureDiscountTierConfigTable();
  await sequelize.query(`
    UPDATE crm_discount_tier_config
    SET auto_max_percent = :autoMaxPercent, bm_ceo_max_percent = :bmCeoMaxPercent, updated_by = :updatedBy
    WHERE id = 1
  `, {
    replacements: { autoMaxPercent, bmCeoMaxPercent, updatedBy },
  });

  return { autoMaxPercent, bmCeoMaxPercent };
}
