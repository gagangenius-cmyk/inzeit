import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { ClientPortalService } from './client-portal-service';
import { CLIENT_PORTAL_PRODUCTS, getClientPortalProduct } from '@/lib/clientPortalProducts';
import { getClientPortalForm } from '@/lib/clientPortalForms';
import { DocumentService } from './document-service';
import { pushChatMessage } from '@/lib/pusherServer';

export type ProductSidebarEntry = {
  key: string;
  label: string;
  icon: string;
  status: 'active' | 'not_started';
  opportunityId: number | null;
  caseStatus: string | null;
};

type VerifiedOpportunityRow = {
  id: number;
  leadId: number;
  productType: string | null;
  serviceType: string | null;
  serviceRequired: string | null;
  status: string | null;
  operationsStatus: string | null;
  createdAt: string;
  conversionDate: string | null;
  assignedTo: number | null;
  caseManagerName: string | null;
  caseManagerEmail: string | null;
  caseManagerMobile: string | null;
};

export class ClientPortalProductService {
  // Every write/read below that takes an opportunityId goes through this first - it
  // re-derives the same finance+compliance verification gate as ClientPortalService, and
  // additionally confirms the opportunity actually belongs to this lead, so a client can
  // never address another lead's opportunity by guessing an id in the URL.
  static async getVerifiedOpportunity(leadId: number, opportunityId: number): Promise<VerifiedOpportunityRow | null> {
    const lead = await ClientPortalService.getVerifiedLead(leadId);
    if (!lead) return null;
    const [row] = await sequelize.query<VerifiedOpportunityRow>(
      `
        SELECT
          o.id, o.leadId, o.product_type AS productType, o.serviceType, o.serviceRequired,
          o.status, o.operations_status AS operationsStatus, o.createdAt, o.conversionDate,
          o.assignedTo, e.name AS caseManagerName, e.email AS caseManagerEmail, e.mobile AS caseManagerMobile
        FROM crm_opportunities o
        JOIN crm_opportunity_workflow_reviews w ON w.opportunity_id = o.id
        LEFT JOIN crm_employee e ON e.id = o.assignedTo
        WHERE o.id = :opportunityId AND o.leadId = :leadId
          AND w.finance_status = 'approved' AND w.compliance_status = 'approved'
          AND TRIM(LOWER(COALESCE(o.status, ''))) IN ('won', 'closed won', 'close won')
        LIMIT 1
      `,
      { replacements: { leadId, opportunityId }, type: QueryTypes.SELECT }
    );
    return row || null;
  }

  static async listProducts(leadId: number): Promise<ProductSidebarEntry[]> {
    const opportunities = await ClientPortalService.listVerifiedOpportunities(leadId);
    const byProduct = new Map(opportunities.filter((o) => o.productType).map((o) => [o.productType as string, o]));

    return CLIENT_PORTAL_PRODUCTS.map((product) => {
      const opportunity = byProduct.get(product.key);
      return {
        key: product.key,
        label: product.label,
        icon: product.icon,
        status: opportunity ? 'active' : 'not_started',
        opportunityId: opportunity ? opportunity.id : null,
        caseStatus: opportunity?.status || null,
      };
    });
  }

  // --- Overview -------------------------------------------------------------------------

  static async getOverview(leadId: number, opportunityId: number) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');

    const product = getClientPortalProduct(opportunity.productType);
    const [checklist, documentStats, agreement] = await Promise.all([
      this.getChecklist(leadId, opportunityId),
      sequelize.query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM crm_client_documents WHERE lead_id = :leadId AND opportunity_id = :opportunityId AND status IN ('Submitted','Approved')`,
        { replacements: { leadId, opportunityId }, type: QueryTypes.SELECT }
      ),
      this.getAgreement(leadId, opportunityId),
    ]);

    const completedStages = checklist.filter((stage) => stage.status === 'completed').length;

    return {
      productKey: opportunity.productType,
      productLabel: product?.label || opportunity.serviceType || 'Service',
      caseManagerName: opportunity.caseManagerName,
      caseManagerEmail: opportunity.caseManagerEmail,
      caseOpened: opportunity.conversionDate || opportunity.createdAt,
      caseStatus: opportunity.operationsStatus || opportunity.status,
      checklistProgress: { completed: completedStages, total: checklist.length },
      documentsUploaded: documentStats[0]?.total || 0,
      agreementStatus: agreement?.status || null,
      stages: checklist,
    };
  }

  // --- Personal Information ---------------------------------------------------------------

  static async getPersonalInfo(leadId: number) {
    const lead = await ClientPortalService.getVerifiedLead(leadId);
    if (!lead) throw new Error('This client is not fully verified yet');
    const [row] = await sequelize.query<{
      fname: string; lname: string; email: string; phone: string; mobile: string;
      dob: string | null; passport_number: string | null; address: string | null; nationality: string | null;
    }>(
      `SELECT fname, lname, email, phone, mobile, dob, passport_number, address, nationality
       FROM crm_forum_leads WHERE id = :leadId LIMIT 1`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    const pendingChanges = await sequelize.query(
      `SELECT request_id, field, old_value, new_value, status, requested_at
       FROM crm_client_profile_change_requests WHERE lead_id = :leadId ORDER BY requested_at DESC`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    return { profile: row || null, changeRequests: pendingChanges };
  }

  static async requestProfileChange(leadId: number, field: 'email' | 'phone', newValue: string) {
    const lead = await ClientPortalService.getVerifiedLead(leadId);
    if (!lead) throw new Error('This client is not fully verified yet');

    const column = field === 'email' ? 'email' : 'phone';
    const [current] = await sequelize.query<Record<string, string>>(
      `SELECT ${column} AS value FROM crm_forum_leads WHERE id = :leadId LIMIT 1`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    const requestId = crypto.randomUUID();
    await sequelize.query(
      `INSERT INTO crm_client_profile_change_requests (request_id, lead_id, field, old_value, new_value, status)
       VALUES (:requestId, :leadId, :field, :oldValue, :newValue, 'pending')`,
      { replacements: { requestId, leadId, field, oldValue: current?.value || null, newValue } }
    );

    return { requestId };
  }

  // --- Agreement Copy ----------------------------------------------------------------------

  static async getAgreement(leadId: number, opportunityId: number) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');

    const [agreement] = await sequelize.query<{
      agreementTitle: string | null; title: string | null; agreementNumber: string; status: string;
      signedDate: string | null; startDate: string | null; endDate: string | null;
      totalAmount: number | null; amount: number; currency: string; documentUrl: string | null;
      signedDocumentUrl: string | null; signedDocumentDate: string | null;
    }>(
      `SELECT
          a.agreementTitle,
          a.title,
          a.agreementNumber,
          CASE
            WHEN COALESCE(NULLIF(a.documentUrl, ''), signed_doc.filePath) IS NOT NULL
              THEN 'uploaded'
            ELSE a.status
          END AS status,
          COALESCE(a.signedDate, signed_doc.uploadDate) AS signedDate,
          a.startDate,
          a.endDate,
          a.totalAmount,
          a.amount,
          a.currency,
          COALESCE(NULLIF(a.documentUrl, ''), signed_doc.filePath) AS documentUrl,
          signed_doc.filePath AS signedDocumentUrl,
          signed_doc.uploadDate AS signedDocumentDate
       FROM crm_opportunity_agreements a
       LEFT JOIN (
         SELECT d1.opportunityId, d1.filePath, d1.uploadDate
         FROM crm_opportunity_documents d1
         INNER JOIN (
           SELECT opportunityId, MAX(id) AS latestId
           FROM crm_opportunity_documents
           WHERE documentType = 'signed_agreement' OR category = 'signed_agreement'
           GROUP BY opportunityId
         ) latest_doc ON latest_doc.opportunityId = d1.opportunityId AND latest_doc.latestId = d1.id
       ) signed_doc ON signed_doc.opportunityId = a.opportunityId
       WHERE a.opportunityId = :opportunityId
       ORDER BY
         CASE WHEN COALESCE(NULLIF(a.documentUrl, ''), signed_doc.filePath) IS NOT NULL THEN 0 ELSE 1 END,
         a.createdAt DESC
       LIMIT 1`,
      { replacements: { opportunityId }, type: QueryTypes.SELECT }
    );
    if (!agreement) return null;

    return {
      agreementTitle: agreement.agreementTitle || agreement.title,
      agreementNumber: agreement.agreementNumber,
      status: agreement.status,
      signedDate: agreement.signedDate,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      totalAmount: agreement.totalAmount ?? agreement.amount,
      currency: agreement.currency,
      documentUrl: agreement.documentUrl,
    };
  }

  // --- Process Checklist ---------------------------------------------------------------------

  static async getChecklist(leadId: number, opportunityId: number) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');

    const product = getClientPortalProduct(opportunity.productType);
    if (!product) return [];

    // getVerifiedOpportunity() above only returns a case once it's a real,
    // approved client (see isFinanceAndComplianceApproved gating in
    // src/lib/opportunityApprovalGate.ts) — by that point the consultation
    // already happened and the agreement is already signed, so a first-time
    // seed of these two stages should never show "Not Started" to the
    // client. Only affects the initial INSERT: ON DUPLICATE KEY UPDATE below
    // still never touches status, so a stage a case officer later reset via
    // updateChecklistStage stays exactly as they set it.
    const PRE_COMPLETED_STAGE_KEYS = new Set(['consultation', 'agreement']);

    for (const stage of product.checklistStages) {
      const preCompleted = PRE_COMPLETED_STAGE_KEYS.has(stage.key);
      await sequelize.query(
        `INSERT INTO crm_client_checklist_stages
           (stage_id, opportunity_id, lead_id, product_type, stage_key, stage_label, sequence, status, completed_at)
         VALUES (:stageId, :opportunityId, :leadId, :productType, :stageKey, :stageLabel, :sequence, :status, ${preCompleted ? 'NOW()' : 'NULL'})
         ON DUPLICATE KEY UPDATE stage_label = VALUES(stage_label), sequence = VALUES(sequence)`,
        {
          replacements: {
            stageId: crypto.randomUUID(), opportunityId, leadId, productType: product.key,
            stageKey: stage.key, stageLabel: stage.label, sequence: stage.sequence,
            status: preCompleted ? 'completed' : 'not_started',
          },
        }
      );
    }

    return sequelize.query<{
      stageKey: string; stageLabel: string; sequence: number;
      status: 'not_started' | 'in_progress' | 'completed'; statusNote: string | null; completedAt: string | null;
    }>(
      `SELECT stage_key AS stageKey, stage_label AS stageLabel, sequence, status,
              status_note AS statusNote, completed_at AS completedAt
       FROM crm_client_checklist_stages WHERE opportunity_id = :opportunityId ORDER BY sequence ASC`,
      { replacements: { opportunityId }, type: QueryTypes.SELECT }
    );
  }

  static async updateChecklistStage(input: {
    opportunityId: number;
    stageKey: string;
    status: 'not_started' | 'in_progress' | 'completed';
    statusNote?: string | null;
    updatedBy: string;
  }) {
    const [existing] = await sequelize.query<{ stage_id: string }>(
      `SELECT stage_id FROM crm_client_checklist_stages WHERE opportunity_id = :opportunityId AND stage_key = :stageKey LIMIT 1`,
      { replacements: { opportunityId: input.opportunityId, stageKey: input.stageKey }, type: QueryTypes.SELECT }
    );
    if (!existing) throw new Error('Checklist stage not found');

    await sequelize.query(
      `UPDATE crm_client_checklist_stages
       SET status = :status, status_note = :statusNote, updated_by = :updatedBy,
           completed_at = ${input.status === 'completed' ? 'NOW()' : 'NULL'}
       WHERE stage_id = :stageId`,
      { replacements: { status: input.status, statusNote: input.statusNote ?? null, updatedBy: input.updatedBy, stageId: existing.stage_id } }
    );
    return { stageId: existing.stage_id };
  }

  // --- Eligibility & Scores (EIP only - read projection over the admin ops wizard's data) ---

  static async getEligibilityScores(leadId: number, opportunityId: number) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');
    if (opportunity.productType !== 'eip') return null;

    const rows = await sequelize.query<{ stage: string; stageData: string }>(
      `SELECT stage, stageData FROM crm_operation_stage_data
       WHERE module = 'eip-canada' AND leadId = :leadId
         AND stage IN ('eca', 'spouse-eca', 'language', 'spouse-language', 'express-entry', 'pnp')`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    const byStage: Record<string, Record<string, unknown>> = {};
    for (const row of rows) {
      try {
        byStage[row.stage] = JSON.parse(row.stageData || '{}');
      } catch {
        byStage[row.stage] = {};
      }
    }

    return {
      expressEntry: byStage['express-entry'] || null,
      eca: byStage['eca'] || null,
      language: byStage['language'] || null,
      pnp: byStage['pnp'] || null,
      spouseEca: byStage['spouse-eca'] || null,
      spouseLanguage: byStage['spouse-language'] || null,
    };
  }

  // --- Conversation (two-way) -----------------------------------------------------------------

  static async listConversation(leadId: number, opportunityId: number) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');

    const messages = await sequelize.query<{ id: number; text: string; file: string | null; chat_from_client: number; created: string }>(
      `SELECT id, text, file, chat_from_client, created FROM crm_client_conversations
       WHERE leadId = :leadId AND opportunity_id = :opportunityId ORDER BY created ASC`,
      { replacements: { leadId, opportunityId }, type: QueryTypes.SELECT }
    );

    await sequelize.query(
      `UPDATE crm_client_conversations SET read_msg = 1 WHERE leadId = :leadId AND opportunity_id = :opportunityId AND chat_from_client = 0`,
      { replacements: { leadId, opportunityId } }
    );

    return messages.map((message) => ({
      id: message.id,
      text: message.text,
      file: message.file || null,
      fromClient: message.chat_from_client === 1,
      created: message.created,
    }));
  }

  static async postClientMessage(leadId: number, opportunityId: number, text: string) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');

    const [result] = await sequelize.query(
      `INSERT INTO crm_client_conversations (leadId, opportunity_id, case_manager, chat_from_client, client_id, text, file, status, read_msg)
       VALUES (:leadId, :opportunityId, :caseManager, 1, :leadId, :text, '', 1, 0)`,
      { replacements: { leadId, opportunityId, caseManager: opportunity.assignedTo || 0, text } }
    );

    await pushChatMessage(opportunityId, {
      id: Number((result as { insertId?: number })?.insertId || 0),
      text,
      file: null,
      fromClient: true,
      created: new Date().toISOString(),
    });
  }

  static async postStaffMessage(leadId: number, opportunityId: number, caseManagerId: number, text: string) {
    const [result] = await sequelize.query(
      `INSERT INTO crm_client_conversations (leadId, opportunity_id, case_manager, chat_from_client, client_id, text, file, status, read_msg)
       VALUES (:leadId, :opportunityId, :caseManager, 0, :leadId, :text, '', 1, 0)`,
      { replacements: { leadId, opportunityId, caseManager: caseManagerId, text } }
    );

    await pushChatMessage(opportunityId, {
      id: Number((result as { insertId?: number })?.insertId || 0),
      text,
      file: null,
      fromClient: false,
      created: new Date().toISOString(),
    });
  }

  // --- Forms & Templates (MVP: structured capture, no PDF field-merge) ---------------------

  static async listFormSubmissions(leadId: number) {
    const lead = await ClientPortalService.getVerifiedLead(leadId);
    if (!lead) throw new Error('This client is not fully verified yet');
    return sequelize.query<{ submission_id: string; form_key: string; status: string; submitted_at: string }>(
      `SELECT submission_id, form_key, status, submitted_at FROM crm_client_form_submissions
       WHERE lead_id = :leadId ORDER BY submitted_at DESC`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );
  }

  static async submitForm(leadId: number, opportunityId: number | null, formKey: string, formData: Record<string, string>) {
    const lead = await ClientPortalService.getVerifiedLead(leadId);
    if (!lead) throw new Error('This client is not fully verified yet');
    if (!getClientPortalForm(formKey)) throw new Error('Unknown form');

    const submissionId = crypto.randomUUID();
    await sequelize.query(
      `INSERT INTO crm_client_form_submissions (submission_id, lead_id, opportunity_id, form_key, form_data, status)
       VALUES (:submissionId, :leadId, :opportunityId, :formKey, :formData, 'submitted')`,
      { replacements: { submissionId, leadId, opportunityId, formKey, formData: JSON.stringify(formData) } }
    );
    return { submissionId };
  }

  static async getBlankFormPdfUrl(formKey: string) {
    const form = getClientPortalForm(formKey);
    if (!form) throw new Error('Unknown form');

    const stored = await DocumentService.generateAndStorePdf({
      type: 'client_form_template',
      title: form.title,
      fileName: `${form.key}-blank-template`,
      lines: ['Blank template - fill in and return to your case manager.', '', ...form.fields.map((field) => `${field.label}: ______________________________`)],
      expiresInDays: 7,
    });
    return stored.signedUrl;
  }

  // --- Contact CPO -------------------------------------------------------------------------

  static async getContactCpo(leadId: number, opportunityId: number) {
    const opportunity = await this.getVerifiedOpportunity(leadId, opportunityId);
    if (!opportunity) throw new Error('This case is not verified, or does not belong to you');

    const [row] = await sequelize.query<{
      cpoName: string | null; cpoEmail: string | null; cpoMobile: string | null;
    }>(
      `SELECT cpo.name AS cpoName, cpo.email AS cpoEmail, cpo.mobile AS cpoMobile
       FROM crm_forum_leads l
       LEFT JOIN crm_employee cpo ON cpo.id = l.case_officer
       WHERE l.id = :leadId LIMIT 1`,
      { replacements: { leadId }, type: QueryTypes.SELECT }
    );

    return {
      cpoAssigned: Boolean(row?.cpoName),
      cpoName: row?.cpoName || null,
      cpoEmail: row?.cpoEmail || null,
      cpoMobile: row?.cpoMobile || null,
      caseManagerName: opportunity.caseManagerName,
      caseManagerEmail: opportunity.caseManagerEmail,
      caseManagerMobile: opportunity.caseManagerMobile,
    };
  }
}
