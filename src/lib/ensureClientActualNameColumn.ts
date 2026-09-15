import { sequelize } from '@/lib/sequelize';

// crm_forum_leads.client_actual_name is a lazily-added column (no migration
// framework in this project — see ensureAppointmentRemarksColumn.ts for the
// same pattern), captured as a mandatory field on the Documents stage of the
// Opportunity Flow wizard so agreements/receipts can print the client's real
// legal name instead of fname+lname.
let clientActualNameColumnReady: Promise<void> | null = null;
export const ensureClientActualNameColumn = async () => {
  if (!clientActualNameColumnReady) {
    clientActualNameColumnReady = sequelize.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crm_forum_leads' AND COLUMN_NAME = 'client_actual_name'
    `).then(async ([rows]: any) => {
      if (Number(rows?.[0]?.cnt || 0) === 0) {
        await sequelize.query(`ALTER TABLE crm_forum_leads ADD COLUMN client_actual_name VARCHAR(255) NULL`);
      }
    }).catch((error) => {
      clientActualNameColumnReady = null;
      throw error;
    });
  }
  await clientActualNameColumnReady;
};
