import crypto from 'crypto';
import { sequelize } from './sequelize';

// Wires up data_access_audit_log (src/services/uae-compliance-service.ts),
// which the UAE compliance checklist already reports on
// (getComplianceChecks() counts its rows) but which nothing ever actually
// wrote to - a real "who viewed this client's financial/PII record" trail
// for sensitive screens, previously decorative.
//
// user_id is CHAR(36) here (this table's own design, likely sized for the
// HR module's separate UUID-based employee identity - see
// src/services/hr-joining-exit-service.ts) rather than the main
// crm_employee.id INTEGER scheme every route actually authenticates
// against, so the caller's numeric id is stored as a string; no FK is
// possible across that type mismatch.
//
// Column names (metadata/accessed_at) intentionally match the table as it
// actually exists in every real environment - created earlier by
// src/services/uae-compliance-service.ts's getComplianceChecks() (which only
// ever COUNT(*)s it, so the mismatch below went unnoticed) - not the
// access_reason/created_at names that both this file and that same
// service's own ensurePrivacyAuditTable() CREATE TABLE statement wrongly
// assumed, which made every write here fail with "Unknown column
// 'access_reason'" until caught by the lead pool's release-to-pool testing.
let tableReady: Promise<void> | null = null;

const ensureAuditTable = async () => {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS data_access_audit_log (
        audit_id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        metadata JSON NULL,
        accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_data_access_entity (entity_type, entity_id),
        INDEX idx_data_access_user (user_id),
        INDEX idx_data_access_created (accessed_at)
      )
    `).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
};

export interface DataAccessLogInput {
  userId: number | string | null | undefined;
  entityType: string;
  entityId: number | string;
  action: string;
  reason?: string | null;
}

// Fire-and-forget, matching every other audit/notification hook in this
// codebase (logLeadRemark, notifyUser, pushNotification) - a failed audit
// write must never fail or slow down the actual request it's logging.
export async function logDataAccess({ userId, entityType, entityId, action, reason }: DataAccessLogInput): Promise<void> {
  try {
    await ensureAuditTable();
    await sequelize.query(
      `INSERT INTO data_access_audit_log (audit_id, user_id, entity_type, entity_id, action, metadata)
       VALUES (:auditId, :userId, :entityType, :entityId, :action, :metadata)`,
      {
        replacements: {
          auditId: crypto.randomUUID(),
          userId: userId !== null && userId !== undefined ? String(userId) : null,
          entityType,
          entityId: String(entityId),
          action,
          metadata: reason ? JSON.stringify({ reason }) : null,
        },
      }
    );
  } catch (error) {
    console.error('Failed to record data-access audit entry:', error);
  }
}
