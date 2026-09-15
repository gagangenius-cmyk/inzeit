import { sequelize } from '@/lib/sequelize';

// crm_pay_history.admin_fee_included/admin_fee_amount are lazily-added
// columns (no migration framework in this project — see
// ensureAppointmentRemarksColumn.ts for the same pattern) storing whether the
// counselor opted to add the fixed admin fee at receipt generation (Payment
// stage / Balance Payments), so a re-printed receipt still shows it. Written
// by both /api/receipts and /api/lead-to-opportunity (the latter is the
// crm_pay_history insert path for an opportunity's very first payment), so
// both call this before inserting.
let payHistoryAdminFeeColumnsReady: Promise<void> | null = null;
export const ensurePayHistoryAdminFeeColumns = async () => {
  if (!payHistoryAdminFeeColumnsReady) {
    payHistoryAdminFeeColumnsReady = (async () => {
      const [rows] = await sequelize.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crm_pay_history'
          AND COLUMN_NAME IN ('admin_fee_included', 'admin_fee_amount')
      `);
      const existing = new Set(((rows as any[]) || []).map((r) => r.COLUMN_NAME));
      if (!existing.has('admin_fee_included')) {
        await sequelize.query(`ALTER TABLE crm_pay_history ADD COLUMN admin_fee_included TINYINT(1) NOT NULL DEFAULT 0`);
      }
      if (!existing.has('admin_fee_amount')) {
        await sequelize.query(`ALTER TABLE crm_pay_history ADD COLUMN admin_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00`);
      }
    })().catch((error) => {
      payHistoryAdminFeeColumnsReady = null;
      throw error;
    });
  }
  await payHistoryAdminFeeColumnsReady;
};
