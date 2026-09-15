import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { getChecklistRulesForService } from '@/lib/clientChecklistRules';

type VerifiedLead = {
  leadId: number;
  fname: string;
  lname: string;
  email: string;
};

type VerifiedOpportunity = {
  id: number;
  serviceType: string | null;
  serviceRequired: string | null;
  productType: string | null;
  status: string | null;
  serviceName: string;
};

type DocumentStatus = 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Resubmit Requested';

const sendClientEmail = async (to: string, subject: string, html: string) => {
  try {
    await sendEmail({ to, subject, html });
  } catch (error) {
    // Client-facing email is best-effort - a missing RESEND_API_KEY in dev
    // must never block credential generation or document review.
    console.warn('Failed to send client portal email:', error instanceof Error ? error.message : error);
  }
};

export class ClientPortalService {
  static async ensureTables() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_client_credentials (
        client_credential_id CHAR(36) PRIMARY KEY,
        lead_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        temporary_password VARCHAR(255) NULL,
        must_change_password BOOLEAN NOT NULL DEFAULT true,
        status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
        generated_by CHAR(36) NULL,
        generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_client_credential_lead (lead_id),
        UNIQUE KEY uniq_client_credential_email (email),
        INDEX idx_client_credential_status (status)
      )
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_client_documents (
        document_id CHAR(36) PRIMARY KEY,
        lead_id INT NOT NULL,
        opportunity_id INT NULL,
        checklist_key VARCHAR(100) NOT NULL,
        document_label VARCHAR(255) NOT NULL,
        mandatory BOOLEAN NOT NULL DEFAULT true,
        accepted_formats VARCHAR(255) NULL,
        file_url VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        status ENUM('Pending', 'Submitted', 'Approved', 'Rejected', 'Resubmit Requested') NOT NULL DEFAULT 'Pending',
        reviewer_id CHAR(36) NULL,
        review_note TEXT NULL,
        uploaded_at DATETIME NULL,
        reviewed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_client_document_item (lead_id, opportunity_id, checklist_key),
        INDEX idx_client_document_lead (lead_id),
        INDEX idx_client_document_status (status)
      )
    `);
    const columns = await sequelize.query<{ Field: string }>(`SHOW COLUMNS FROM crm_client_documents`, { type: QueryTypes.SELECT });
    const columnNames = new Set(columns.map((column) => column.Field));
    if (!columnNames.has('mandatory')) {
      await sequelize.query(`ALTER TABLE crm_client_documents ADD COLUMN mandatory BOOLEAN NOT NULL DEFAULT true AFTER document_label`);
    }
    if (!columnNames.has('accepted_formats')) {
      await sequelize.query(`ALTER TABLE crm_client_documents ADD COLUMN accepted_formats VARCHAR(255) NULL AFTER mandatory`);
    }
    const credentialColumns = await sequelize.query<{ Field: string }>(`SHOW COLUMNS FROM crm_client_credentials`, { type: QueryTypes.SELECT });
    const credentialColumnNames = new Set(credentialColumns.map((column) => column.Field));
    if (!credentialColumnNames.has('temporary_password')) {
      await sequelize.query(`ALTER TABLE crm_client_credentials ADD COLUMN temporary_password VARCHAR(255) NULL AFTER password_hash`);
    }
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_client_status_log (
        log_id CHAR(36) PRIMARY KEY,
        lead_id INT NOT NULL,
        opportunity_id INT NULL,
        posted_by CHAR(36) NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_client_status_log_lead (lead_id, created_at)
      )
    `);
  }

  // The compliance/accounts gate - mirrors src/app/api/admin/clients/route.ts exactly,
  // so "is this lead a verified client" is derived from the same source of truth
  // everywhere (credential generation, every login, and the admin Clients list).
  static async getVerifiedLead(leadId: number): Promise<VerifiedLead | null> {
    await this.ensureTables();
    const [row] = await sequelize.query<VerifiedLead>(
      `
        SELECT w.lead_id AS leadId, l.fname, l.lname, l.email
        FROM crm_opportunity_workflow_reviews w
        INNER JOIN (
          SELECT lead_id, MAX(w2.id) AS maxId
          FROM crm_opportunity_workflow_reviews w2
          JOIN crm_opportunities o2 ON o2.id = w2.opportunity_id
          WHERE w2.finance_status = 'approved'
            AND w2.compliance_status = 'approved'
            AND TRIM(LOWER(COALESCE(o2.status, ''))) IN ('won', 'closed won', 'close won')
          GROUP BY lead_id
        ) latest ON latest.maxId = w.id
        JOIN crm_forum_leads l ON l.id = w.lead_id
        JOIN crm_opportunities o ON o.id = w.opportunity_id
        WHERE w.lead_id = :leadId
          AND w.finance_status = 'approved'
          AND w.compliance_status = 'approved'
          AND TRIM(LOWER(COALESCE(o.status, ''))) IN ('won', 'closed won', 'close won')
        LIMIT 1
      `,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    if (!row) return null;
    return { leadId: row.leadId, fname: row.fname, lname: row.lname, email: row.email };
  }

  static async listVerifiedOpportunities(leadId: number): Promise<VerifiedOpportunity[]> {
    await this.ensureTables();
    return sequelize.query<VerifiedOpportunity>(
      `
        SELECT
          o.id,
          o.serviceType,
          o.serviceRequired,
          o.product_type AS productType,
          o.status,
          COALESCE(NULLIF(o.serviceRequired, ''), NULLIF(o.serviceType, ''), CONCAT('Opportunity #', o.id)) AS serviceName
        FROM crm_opportunities o
        JOIN crm_opportunity_workflow_reviews w ON w.opportunity_id = o.id
        INNER JOIN (
          SELECT opportunity_id, MAX(id) AS maxId
          FROM crm_opportunity_workflow_reviews
          WHERE lead_id = :leadId
          GROUP BY opportunity_id
        ) latest ON latest.maxId = w.id
        WHERE w.lead_id = :leadId
          AND w.finance_status = 'approved'
          AND w.compliance_status = 'approved'
          AND TRIM(LOWER(COALESCE(o.status, ''))) IN ('won', 'closed won', 'close won')
        ORDER BY o.id DESC
      `,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );
  }

  static async generateCredentials(leadId: number, generatedBy: string) {
    await this.ensureTables();
    const lead = await this.getVerifiedLead(leadId);
    if (!lead) throw new Error('This client is not fully verified yet — compliance and accounts approval are both required first');
    if (!lead.email) throw new Error('This lead has no email on file to send credentials to');

    const existing = await this.getCredentialDetails(leadId);
    if (existing?.temporaryPassword) return existing;

    const tempPassword = crypto.randomBytes(6).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);
    const credentialId = crypto.randomUUID();

    await sequelize.query(
      `
        INSERT INTO crm_client_credentials (
          client_credential_id, lead_id, email, password_hash, must_change_password,
          temporary_password, status, generated_by, generated_at
        ) VALUES (
          :credentialId, :leadId, :email, :passwordHash, true, :tempPassword, 'active', :generatedBy, NOW()
        )
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          password_hash = VALUES(password_hash),
          temporary_password = VALUES(temporary_password),
          must_change_password = true,
          status = 'active',
          generated_by = VALUES(generated_by),
          generated_at = NOW()
      `,
      { replacements: { credentialId, leadId, email: lead.email, passwordHash, tempPassword, generatedBy } }
    );

    await sendClientEmail(
      lead.email,
      'Your DM Client Portal access is ready',
      `<p>Dear ${lead.fname || 'Client'},</p>
       <p>Your client portal account has been created. Sign in at <strong>/clientportal/login</strong> with:</p>
       <p>Username: <strong>${lead.email}</strong><br/>Temporary password: <strong>${tempPassword}</strong></p>
       <p>After sign-in you will go directly to your verified client dashboard.</p>`
    );

    return { lead_id: leadId, email: lead.email, temporaryPassword: tempPassword, generatedAt: new Date().toISOString(), status: 'active' };
  }

  static async getCredentialDetails(leadId: number) {
    await this.ensureTables();
    const lead = await this.getVerifiedLead(leadId);
    if (!lead) throw new Error('This client is not fully verified yet - compliance and accounts approval are both required first');

    const [credential] = await sequelize.query<{
      email: string;
      temporary_password: string | null;
      generated_at: string | null;
      status: string;
    }>(
      `SELECT email, temporary_password, generated_at, status
       FROM crm_client_credentials
       WHERE lead_id = :leadId AND status = 'active'
       LIMIT 1`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    if (!credential?.temporary_password) return null;
    return {
      lead_id: leadId,
      email: credential.email || lead.email,
      temporaryPassword: credential.temporary_password || '',
      generatedAt: credential.generated_at,
      status: credential.status,
    };
  }

  static async authenticate(email: string, password: string) {
    await this.ensureTables();
    const [credential] = await sequelize.query<{
      client_credential_id: string;
      lead_id: number;
      password_hash: string;
      must_change_password: boolean;
      status: string;
    }>(
      `SELECT client_credential_id, lead_id, password_hash, must_change_password, status
       FROM crm_client_credentials WHERE email = :email LIMIT 1`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );

    if (!credential || credential.status !== 'active') return null;
    const passwordOk = await verifyPassword(password, credential.password_hash);
    if (!passwordOk) return null;

    // Re-validate the verification gate at login time too, not just at
    // credential-issue time, in case compliance/accounts revoked approval since.
    const lead = await this.getVerifiedLead(credential.lead_id);
    if (!lead) return null;

    await sequelize.query('UPDATE crm_client_credentials SET last_login_at = NOW() WHERE client_credential_id = :id', {
      replacements: { id: credential.client_credential_id },
    });

    return {
      leadId: credential.lead_id,
      email: lead.email,
      name: `${lead.fname} ${lead.lname}`.trim(),
      mustChangePassword: Boolean(credential.must_change_password),
    };
  }

  static async changePassword(leadId: number, newPassword: string) {
    await this.ensureTables();
    const passwordHash = await hashPassword(newPassword);
    await sequelize.query(
      `UPDATE crm_client_credentials SET password_hash = :passwordHash, must_change_password = false WHERE lead_id = :leadId`,
      { replacements: { passwordHash, leadId } }
    );
  }

  static async getMe(leadId: number) {
    const lead = await this.getVerifiedLead(leadId);
    if (!lead) throw new Error('Verification is no longer approved — please contact your counselor');
    return lead;
  }

  private static async ensureChecklistSeeded(leadId: number) {
    const lead = await this.getVerifiedLead(leadId);
    if (!lead) throw new Error('Verification is no longer approved - please contact your counselor');
    const opportunities = await this.listVerifiedOpportunities(leadId);

    for (const opportunity of opportunities) {
      const rules = getChecklistRulesForService(opportunity.serviceType, opportunity.serviceRequired);
      for (const rule of rules) {
        await sequelize.query(
          `
            INSERT INTO crm_client_documents (
              document_id, lead_id, opportunity_id, checklist_key, document_label, mandatory, accepted_formats, status
            ) VALUES (
              :documentId, :leadId, :opportunityId, :checklistKey, :label, :mandatory, :acceptedFormats, 'Pending'
            )
            ON DUPLICATE KEY UPDATE
              document_label = VALUES(document_label),
              mandatory = VALUES(mandatory),
              accepted_formats = VALUES(accepted_formats)
          `,
          {
            replacements: {
              documentId: crypto.randomUUID(),
              leadId,
              opportunityId: opportunity.id,
              checklistKey: rule.key,
              label: rule.label,
              mandatory: rule.mandatory,
              acceptedFormats: rule.accepted,
            },
          }
        );
      }
    }

    return opportunities;
  }

  static async getChecklist(leadId: number) {
    await this.ensureTables();
    const opportunities = await this.ensureChecklistSeeded(leadId);
    const documents = await sequelize.query(
      `SELECT document_id, opportunity_id, checklist_key, document_label, file_url, file_name,
              mandatory, accepted_formats, status, review_note, uploaded_at, reviewed_at
       FROM crm_client_documents WHERE lead_id = :leadId ORDER BY opportunity_id, checklist_key`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    return { opportunities, documents };
  }

  static async recordUpload(input: {
    leadId: number;
    opportunityId: number;
    checklistKey: string;
    fileUrl: string;
    fileName: string;
  }) {
    await this.ensureTables();
    const lead = await this.getVerifiedLead(input.leadId);
    if (!lead) throw new Error('Verification is no longer approved - please contact your counselor');
    await sequelize.query(
      `
        UPDATE crm_client_documents
        SET file_url = :fileUrl, file_name = :fileName, status = 'Submitted',
            uploaded_at = NOW(), reviewer_id = NULL, review_note = NULL, reviewed_at = NULL
        WHERE lead_id = :leadId AND opportunity_id = :opportunityId AND checklist_key = :checklistKey
      `,
      { replacements: input }
    );

    return sequelize.query(
      `SELECT document_id, status, file_url, file_name FROM crm_client_documents
       WHERE lead_id = :leadId AND opportunity_id = :opportunityId AND checklist_key = :checklistKey LIMIT 1`,
      { replacements: input, type: QueryTypes.SELECT }
    );
  }

  static async reviewDocument(input: {
    documentId: string;
    status: Extract<DocumentStatus, 'Approved' | 'Rejected' | 'Resubmit Requested'>;
    reviewerId: string;
    reviewNote?: string | null;
  }) {
    await this.ensureTables();
    await sequelize.query(
      `
        UPDATE crm_client_documents
        SET status = :status, reviewer_id = :reviewerId, review_note = :reviewNote, reviewed_at = NOW()
        WHERE document_id = :documentId
      `,
      { replacements: { ...input, reviewNote: input.reviewNote || null } }
    );

    const [document] = await sequelize.query<{ lead_id: number; document_label: string }>(
      `SELECT lead_id, document_label FROM crm_client_documents WHERE document_id = :documentId LIMIT 1`,
      { replacements: { documentId: input.documentId }, type: QueryTypes.SELECT }
    );

    if (document) {
      const lead = await this.getVerifiedLead(document.lead_id);
      if (lead?.email) {
        await sendClientEmail(
          lead.email,
          `Document ${input.status.toLowerCase()}: ${document.document_label}`,
          `<p>Your document "${document.document_label}" was marked <strong>${input.status}</strong>.</p>
           ${input.reviewNote ? `<p>Note from your case officer: ${input.reviewNote}</p>` : ''}`
        );
      }
    }

    return document;
  }

  static async listDocumentsForStaff(leadId: number) {
    await this.ensureTables();
    return sequelize.query(
      `SELECT d.document_id, d.opportunity_id, d.checklist_key, d.document_label, d.file_url, d.file_name,
              d.status, d.review_note, d.uploaded_at, d.reviewed_at, e.name AS reviewerName
       FROM crm_client_documents d
       LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = d.reviewer_id
       WHERE d.lead_id = :leadId ORDER BY d.opportunity_id, d.checklist_key`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );
  }

  static async postStatus(input: { leadId: number; opportunityId?: number | null; postedBy: string; message: string }) {
    await this.ensureTables();
    const lead = await this.getVerifiedLead(input.leadId);
    if (!lead) throw new Error('Verification is no longer approved - please contact your counselor');
    const logId = crypto.randomUUID();
    await sequelize.query(
      `INSERT INTO crm_client_status_log (log_id, lead_id, opportunity_id, posted_by, message)
       VALUES (:logId, :leadId, :opportunityId, :postedBy, :message)`,
      { replacements: { logId, leadId: input.leadId, opportunityId: input.opportunityId || null, postedBy: input.postedBy, message: input.message } }
    );
    return { log_id: logId };
  }

  static async listStatusLog(leadId: number) {
    await this.ensureTables();
    const lead = await this.getVerifiedLead(leadId);
    if (!lead) throw new Error('Verification is no longer approved - please contact your counselor');
    return sequelize.query(
      `SELECT s.log_id, s.opportunity_id, s.message, s.created_at, e.name AS postedByName
       FROM crm_client_status_log s
       LEFT JOIN crm_employee e ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci = s.posted_by
       WHERE s.lead_id = :leadId
       ORDER BY s.created_at DESC`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );
  }
}
