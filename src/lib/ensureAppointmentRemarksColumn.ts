import { sequelize } from '@/lib/sequelize';

// appointments.remarks is a lazily-added column (no migration framework in
// this project) — ensured here so a database that predates this column
// self-heals instead of erroring. Needed in every route that touches the
// Appointments Sequelize model (not just the ones that set `remarks`)
// because once the model declares the attribute, Sequelize includes it in
// every SELECT it generates for that model, not only writes.
let appointmentRemarksColumnReady: Promise<void> | null = null;
export const ensureAppointmentRemarksColumn = async () => {
  if (!appointmentRemarksColumnReady) {
    appointmentRemarksColumnReady = sequelize.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'remarks'
    `).then(async ([rows]: any) => {
      if (Number(rows?.[0]?.cnt || 0) === 0) {
        await sequelize.query(`ALTER TABLE appointments ADD COLUMN remarks TEXT NULL AFTER foe_remark`);
      }
    }).catch((error) => {
      appointmentRemarksColumnReady = null;
      throw error;
    });
  }
  await appointmentRemarksColumnReady;
};
