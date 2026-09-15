import { sequelize } from '@/lib/sequelize';

let payHistoryProofColumnReady: Promise<void> | null = null;

export async function ensurePayHistoryProofColumn(): Promise<void> {
  if (!payHistoryProofColumnReady) {
    payHistoryProofColumnReady = sequelize.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'crm_pay_history'
        AND COLUMN_NAME = 'proof_url'
    `).then(async ([rows]: any) => {
      if (Number(rows?.[0]?.cnt || 0) === 0) {
        await sequelize.query(`ALTER TABLE crm_pay_history ADD COLUMN proof_url VARCHAR(500) NULL AFTER refNumber`);
      }
    }).catch((error) => {
      payHistoryProofColumnReady = null;
      throw error;
    });
  }

  await payHistoryProofColumnReady;
}
