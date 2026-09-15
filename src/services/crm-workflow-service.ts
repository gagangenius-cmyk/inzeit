import { sequelize } from '@/lib/sequelize';
import { CrmOpportunityWorkflowReview } from '@/models/CrmOpportunityWorkflowReview';
import { CrmOpportunityWorkflowAuditLog } from '@/models/CrmOpportunityWorkflowAuditLog';
import { CrmOpportunityHandoverNote } from '@/models/CrmOpportunityHandoverNote';
import { CrmOpportunityAccountingVerification } from '@/models/CrmOpportunityAccountingVerification';
import { CrmOpportunityPaymentSchedule } from '@/models/CrmOpportunityPaymentSchedule';
import { CrmcOpportunities } from '@/models/CrmcOpportunities';
import { CrmcForumLeads } from '@/models/CrmcForumLeads';
import { CrmcNotifications } from '@/models/CrmcNotifications';
import { QueryTypes } from 'sequelize';

// ─── Status Constants ────────────────────────────────────────
const WORKFLOW_STATUSES = {
  NEW: 'New',
  PROSPECT: 'Prospect',
  QUALIFIED: 'Qualified',
  OPPORTUNITY_CREATED: 'opportunity_created',
  PENDING_FINANCE_REVIEW: 'pending_finance_review',
  FINANCE_REVIEW_FAILED: 'finance_review_failed',
  FINANCE_APPROVED: 'finance_approved',
  PENDING_COMPLIANCE: 'pending_compliance',
  COMPLIANCE_REVIEW_FAILED: 'compliance_review_failed',
  COMPLIANCE_APPROVED: 'compliance_approved',
  CLIENT: 'client',
  CASE_ACTIVE: 'case_active',
  CLOSED: 'closed',
} as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  [WORKFLOW_STATUSES.OPPORTUNITY_CREATED]: [WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW],
  [WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW]: [WORKFLOW_STATUSES.FINANCE_APPROVED, WORKFLOW_STATUSES.FINANCE_REVIEW_FAILED],
  [WORKFLOW_STATUSES.FINANCE_REVIEW_FAILED]: [WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW],
  [WORKFLOW_STATUSES.FINANCE_APPROVED]: [WORKFLOW_STATUSES.PENDING_COMPLIANCE],
  [WORKFLOW_STATUSES.PENDING_COMPLIANCE]: [WORKFLOW_STATUSES.COMPLIANCE_APPROVED, WORKFLOW_STATUSES.COMPLIANCE_REVIEW_FAILED],
  [WORKFLOW_STATUSES.COMPLIANCE_REVIEW_FAILED]: [WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW],
  [WORKFLOW_STATUSES.COMPLIANCE_APPROVED]: [WORKFLOW_STATUSES.CLIENT],
  [WORKFLOW_STATUSES.CLIENT]: [WORKFLOW_STATUSES.CASE_ACTIVE, WORKFLOW_STATUSES.CLOSED],
  [WORKFLOW_STATUSES.CASE_ACTIVE]: [WORKFLOW_STATUSES.CLOSED],
};

// ─── Interfaces ──────────────────────────────────────────────
interface OfficialIdData {
  passportCopy: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  nationalIdCopy: string;
  nationalIdNumber: string;
  nationalIdExpiryDate: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus?: string;
  additionalIdCopy?: string;
}

interface DiscussionNote {
  id?: number;
  discussionDate: string;
  officerName: string;
  discussionType: string;
  discussionSummary: string;
  actionItems?: string;
  followUpDate?: string;
}

interface PaymentDataInput {
  totalServiceFee: number;
  discountAmount?: number;
  managerApprovalReference?: string;
  netPayableAmount: number;
  paymentMethod: string;
  firstInstallmentAmount: number;
  receiptNumber: string;
  receiptDate: string;
  paymentSchedule: Array<{ dueDate: string; amount: number }>;
  bankTransferReference?: string;
  invoiceNumber?: string;
}

interface SubmitForFinanceInput {
  opportunityId: number;
  leadId: number;
  officialId: OfficialIdData;
  discussionNotes: DiscussionNote[];
  paymentInput: PaymentDataInput;
  actorId: number;
  actorRole: string;
}

interface FinanceReviewInput {
  opportunityId: number;
  decision: 'approved' | 'rejected';
  checklist: Record<string, boolean>;
  reason?: string;
  actorId: number;
  actorRole: string;
}

interface ComplianceReviewInput {
  opportunityId: number;
  decision: 'approved' | 'rejected';
  checklist: Record<string, boolean>;
  reason?: string;
  actorId: number;
  actorRole: string;
}

// ─── Service Class ───────────────────────────────────────────
export class CrmWorkflowService {

  static async getWorkflowReview(opportunityId: number) {
    const review = await CrmOpportunityWorkflowReview.findOne({
      where: { opportunityId }
    });
    if (!review) return null;

    let lead = null;
    try {
      lead = await CrmcForumLeads.findByPk(review.leadId);
    } catch {
      // CrmcForumLeads may have schema mismatches on remote DB
    }
    const opportunity = await CrmcOpportunities.findByPk(review.opportunityId);
    const handoverNotes = await CrmOpportunityHandoverNote.findAll({
      where: { opportunityId },
      order: [['createdAt', 'ASC']]
    });
    const paymentSchedule = await CrmOpportunityPaymentSchedule.findAll({
      where: { opportunityId },
      order: [['installmentNumber', 'ASC']]
    });

    return {
      workflow: review,
      lead,
      opportunity,
      handoverNotes,
      paymentSchedule
    };
  }

  static async getWorkflowByLeadId(leadId: number) {
    return CrmOpportunityWorkflowReview.findOne({ where: { leadId } });
  }

  static async getAuditLogs(opportunityId: number) {
    return CrmOpportunityWorkflowAuditLog.findAll({
      where: { opportunityId },
      order: [['createdAt', 'DESC']]
    });
  }

  // ─── Stage 2: Submit for Finance Review ──────────────────────
  static async submitForFinance(input: SubmitForFinanceInput) {
    const { opportunityId, leadId, officialId, discussionNotes, paymentInput, actorId, actorRole } = input;

    // Validate mandatory blocks
    const validationErrors = CrmWorkflowService.validateSubmissionBlocks(officialId, discussionNotes, paymentInput);
    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    // Check passport expiry warning (< 6 months)
    const passportExpiryWarning = CrmWorkflowService.checkPassportExpiry(officialId.passportExpiryDate);

    const transaction = await sequelize.transaction();
    try {
      // Find or create workflow review
      let review = await CrmOpportunityWorkflowReview.findOne({
        where: { opportunityId },
        transaction
      });

      if (!review) {
        review = await CrmOpportunityWorkflowReview.create({
          opportunityId,
          leadId,
          workflowStatus: WORKFLOW_STATUSES.OPPORTUNITY_CREATED,
        }, { transaction });
      }

      // Validate current status allows submission
      if (!VALID_TRANSITIONS[review.workflowStatus]?.includes(WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW)) {
        await transaction.rollback();
        return { success: false, errors: [`Cannot submit from status: ${review.workflowStatus}`] };
      }

      const previousStatus = review.workflowStatus;

      // Update review with ID and payment data
      await review.update({
        officialIdData: JSON.stringify(officialId),
        paymentData: JSON.stringify(paymentInput),
        workflowStatus: WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW
      }, { transaction });

      // Save discussion notes
      for (const note of discussionNotes) {
        await CrmOpportunityHandoverNote.create({
          leadId,
          opportunityId,
          counselorId: actorId,
          conversationSummary: note.discussionSummary,
          clientCommitments: note.actionItems || null,
          nextAction: note.followUpDate ? `Follow-up scheduled: ${note.followUpDate}` : null,
        }, { transaction });
      }

      // Clean up existing payment schedules before re-creating (allows re-submission)
      await CrmOpportunityPaymentSchedule.destroy({
        where: { opportunityId },
        transaction
      });

      // Create payment schedule entries
      for (let i = 0; i < paymentInput.paymentSchedule.length; i++) {
        const schedule = paymentInput.paymentSchedule[i];
        await CrmOpportunityPaymentSchedule.create({
          opportunityId,
          installmentNumber: i + 1,
          dueDate: new Date(schedule.dueDate),
          amount: schedule.amount,
          status: 'pending',
          createdBy: actorId,
        }, { transaction });
      }

      // Clean up existing accounting verification before re-creating
      await CrmOpportunityAccountingVerification.destroy({
        where: { opportunityId },
        transaction
      });

      // Create accounting verification record
      await CrmOpportunityAccountingVerification.create({
        leadId,
        opportunityId,
        paymentReceived: false,
        documentsComplete: false,
        status: 'pending',
        accountantId: null,
        submittedAt: new Date(),
      }, { transaction });

      // Create audit log
      await CrmOpportunityWorkflowAuditLog.create({
        opportunityId,
        action: 'submit_for_finance',
        previousStatus,
        newStatus: WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW,
        actorId,
        actorRole,
        notes: 'Account Manager submitted opportunity for Finance verification',
      }, { transaction });

      // Send notification to Finance Officers
      await CrmWorkflowService.notifyFinanceOfficers(opportunityId, leadId, transaction);

      await transaction.commit();

      return {
        success: true,
        message: 'Opportunity submitted for Finance Review',
        passportExpiryWarning,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Gate 1: Finance Review ──────────────────────────────────
  static async financeReview(input: FinanceReviewInput) {
    const { opportunityId, decision, checklist, reason, actorId, actorRole } = input;

    const transaction = await sequelize.transaction();
    try {
      const review = await CrmOpportunityWorkflowReview.findOne({
        where: { opportunityId },
        transaction
      });

      if (!review) {
        await transaction.rollback();
        return { success: false, errors: ['Workflow review not found'] };
      }

      if (review.workflowStatus !== WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW) {
        await transaction.rollback();
        return { success: false, errors: [`Cannot review from status: ${review.workflowStatus}`] };
      }

      if (decision === 'rejected' && !reason) {
        await transaction.rollback();
        return { success: false, errors: ['Rejection reason is required'] };
      }

      const previousStatus = review.workflowStatus;
      const newStatus = decision === 'approved'
        ? WORKFLOW_STATUSES.PENDING_COMPLIANCE
        : WORKFLOW_STATUSES.FINANCE_REVIEW_FAILED;

      // Update workflow review
      await review.update({
        financeStatus: decision,
        financeChecklist: JSON.stringify(checklist),
        financeReason: reason || null,
        financeReviewedBy: actorId,
        financeReviewedAt: new Date(),
        workflowStatus: newStatus,
      }, { transaction });

      // Update accounting verification
      await CrmOpportunityAccountingVerification.update(
        {
          status: decision === 'approved' ? 'approved' : 'rejected',
          accountantId: actorId,
          notes: reason || null,
          reviewedAt: new Date(),
        },
        {
          where: { opportunityId },
          transaction
        }
      );

      // Audit log
      await CrmOpportunityWorkflowAuditLog.create({
        opportunityId,
        action: decision === 'approved' ? 'finance_approve' : 'finance_reject',
        previousStatus,
        newStatus,
        actorId,
        actorRole,
        notes: reason || `Finance ${decision}`,
      }, { transaction });

      // Notify Account Manager on rejection, or CRM Compliance on approval
      if (decision === 'approved') {
        await CrmWorkflowService.notifyComplianceOfficers(opportunityId, review.leadId, transaction);
      } else {
        await CrmWorkflowService.notifyAccountManager(review.leadId, opportunityId,
          `Finance rejected: ${reason}`, transaction);
      }

      await transaction.commit();
      return { success: true, message: `Finance ${decision} successfully` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Gate 2: CRM Compliance Review ──────────────────────────
  static async complianceReview(input: ComplianceReviewInput) {
    const { opportunityId, decision, checklist, reason, actorId, actorRole } = input;

    const transaction = await sequelize.transaction();
    try {
      const review = await CrmOpportunityWorkflowReview.findOne({
        where: { opportunityId },
        transaction
      });

      if (!review) {
        await transaction.rollback();
        return { success: false, errors: ['Workflow review not found'] };
      }

      if (review.workflowStatus !== WORKFLOW_STATUSES.PENDING_COMPLIANCE) {
        await transaction.rollback();
        return { success: false, errors: [`Cannot review from status: ${review.workflowStatus}`] };
      }

      if (decision === 'rejected' && !reason) {
        await transaction.rollback();
        return { success: false, errors: ['Rejection reason is required'] };
      }

      const previousStatus = review.workflowStatus;
      const newStatus = decision === 'approved'
        ? WORKFLOW_STATUSES.COMPLIANCE_APPROVED
        : WORKFLOW_STATUSES.COMPLIANCE_REVIEW_FAILED;

      await review.update({
        complianceStatus: decision,
        complianceChecklist: JSON.stringify(checklist),
        complianceReason: reason || null,
        complianceReviewedBy: actorId,
        complianceReviewedAt: new Date(),
        workflowStatus: newStatus,
      }, { transaction });

      // Audit log
      await CrmOpportunityWorkflowAuditLog.create({
        opportunityId,
        action: decision === 'approved' ? 'compliance_approve' : 'compliance_reject',
        previousStatus,
        newStatus,
        actorId,
        actorRole,
        notes: reason || `CRM Compliance ${decision}`,
      }, { transaction });

      if (decision === 'approved') {
        // Auto-create client account
        await CrmWorkflowService.createClientAccount(review, transaction);
      } else {
        await CrmWorkflowService.notifyAccountManager(review.leadId, opportunityId,
          `CRM Compliance rejected: ${reason}`, transaction);
      }

      await transaction.commit();
      return { success: true, message: `CRM Compliance ${decision} successfully` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Stage 3: Auto-create Client Account ────────────────────
  private static async createClientAccount(
    review: CrmOpportunityWorkflowReview,
    transaction: any
  ) {
    let lead = null;
    try {
      lead = await CrmcForumLeads.findByPk(review.leadId, { transaction });
    } catch {
      // CrmcForumLeads may have schema mismatches
    }
    const opportunity = await CrmcOpportunities.findByPk(review.opportunityId, { transaction });
    if (!opportunity) return;

    const clientId = `CMG-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    await review.update({
      formalClientId: clientId,
      workflowStatus: WORKFLOW_STATUSES.CLIENT,
    }, { transaction });

    await CrmOpportunityWorkflowAuditLog.create({
      opportunityId: review.opportunityId,
      action: 'client_account_created',
      previousStatus: WORKFLOW_STATUSES.COMPLIANCE_APPROVED,
      newStatus: WORKFLOW_STATUSES.CLIENT,
      actorId: null,
      actorRole: 'system',
      notes: `Auto-generated Client Account ID: ${clientId}`,
    }, { transaction });

    // Notify Account Manager
    await CrmWorkflowService.notifyAccountManager(review.leadId, review.opportunityId,
      `Client Account created: ${clientId}. Case is ready for Case Process Officer assignment.`,
      transaction);
  }

  // ─── Stage 4: Case Officer Handoff ──────────────────────────
  static async activateCase(opportunityId: number, caseOfficerId: number, actorId: number, actorRole: string) {
    const transaction = await sequelize.transaction();
    try {
      const review = await CrmOpportunityWorkflowReview.findOne({
        where: { opportunityId },
        transaction
      });

      if (!review) {
        await transaction.rollback();
        return { success: false, errors: ['Workflow review not found'] };
      }

      if (review.workflowStatus !== WORKFLOW_STATUSES.CLIENT) {
        await transaction.rollback();
        return { success: false, errors: [`Cannot activate case from status: ${review.workflowStatus}`] };
      }

      const previousStatus = review.workflowStatus;

      await review.update({
        caseActivatedAt: new Date(),
        workflowStatus: WORKFLOW_STATUSES.CASE_ACTIVE,
      }, { transaction });

      // Update opportunity with case officer
      await CrmcOpportunities.update(
        { assignedTo: caseOfficerId },
        { where: { id: opportunityId }, transaction }
      );

      await CrmOpportunityWorkflowAuditLog.create({
        opportunityId,
        action: 'case_activated',
        previousStatus,
        newStatus: WORKFLOW_STATUSES.CASE_ACTIVE,
        actorId,
        actorRole,
        notes: `Case Process Officer assigned. Case activated.`,
      }, { transaction });

      // Notify case officer
      await CrmWorkflowService.createNotification(
        caseOfficerId,
        'case_assignment',
        'New Case Assigned',
        `You have been assigned case ${review.formalClientId || opportunityId}. Please review the client record and begin processing.`,
        'high',
        transaction
      );

      await transaction.commit();
      return { success: true, message: 'Case activated successfully', clientId: review.formalClientId };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Log Case Progress Note ─────────────────────────────────
  static async logCaseNote(opportunityId: number, caseOfficerId: number, noteText: string) {
    const review = await CrmOpportunityWorkflowReview.findOne({ where: { opportunityId } });
    if (!review) return { success: false, errors: ['Workflow not found'] };

    await CrmOpportunityHandoverNote.create({
      leadId: review.leadId,
      opportunityId,
      counselorId: caseOfficerId,
      conversationSummary: noteText,
    });

    return { success: true };
  }

  // ─── Helpers ─────────────────────────────────────────────────
  private static validateSubmissionBlocks(
    officialId: OfficialIdData,
    discussionNotes: DiscussionNote[],
    paymentInput: PaymentDataInput
  ): string[] {
    const errors: string[] = [];

    // Block A: Official ID
    if (!officialId.passportCopy) errors.push('Passport copy is required');
    if (!officialId.passportNumber) errors.push('Passport number is required');
    if (!officialId.passportIssueDate) errors.push('Passport issue date is required');
    if (!officialId.passportExpiryDate) errors.push('Passport expiry date is required');
    if (!officialId.nationalIdCopy) errors.push('National/Emirates ID copy is required');
    if (!officialId.nationalIdNumber) errors.push('National ID number is required');
    if (!officialId.nationalIdExpiryDate) errors.push('National ID expiry date is required');
    if (!officialId.dateOfBirth) errors.push('Date of birth is required');
    if (!officialId.gender) errors.push('Gender is required');

    // Block B: Discussion Notes (minimum 1)
    if (!discussionNotes || discussionNotes.length === 0) {
      errors.push('At least one discussion note is required');
    } else {
      for (const note of discussionNotes) {
        if (!note.discussionType) errors.push('Discussion type is required');
        if (!note.discussionSummary || note.discussionSummary.length < 30) {
          errors.push('Discussion summary must be at least 30 characters');
        }
      }
    }

    // Block C: Payment Input
    if (!paymentInput.totalServiceFee || paymentInput.totalServiceFee <= 0) errors.push('Total service fee is required');
    if (!paymentInput.netPayableAmount || paymentInput.netPayableAmount <= 0) errors.push('Net payable amount is required');
    if (!paymentInput.paymentMethod) errors.push('Payment method is required');
    if (!paymentInput.firstInstallmentAmount || paymentInput.firstInstallmentAmount <= 0) errors.push('First installment amount is required');
    if (!paymentInput.receiptNumber) errors.push('Receipt number is required');
    if (!paymentInput.receiptDate) errors.push('Receipt date is required');
    if (!paymentInput.paymentSchedule || paymentInput.paymentSchedule.length === 0) {
      errors.push('Payment schedule is required');
    }

    // Discount validation
    if (paymentInput.discountAmount && paymentInput.discountAmount > 0 && !paymentInput.managerApprovalReference) {
      errors.push('Manager approval reference is required when discount is applied');
    }

    return errors;
  }

  private static checkPassportExpiry(expiryDate: string): string | null {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    if (expiry < now) {
      return 'WARNING: Passport has expired';
    }
    if (expiry < sixMonthsFromNow) {
      return 'WARNING: Passport expires within 6 months. CRM Compliance may override with documented reason.';
    }
    return null;
  }

  private static async notifyFinanceOfficers(opportunityId: number, leadId: number, transaction: any) {
    // Find employees with finance officer role
    const financeOfficers = await sequelize.query<any>(
      `SELECT e.id FROM crm_employee e
       INNER JOIN crm_role r ON e.role = r.id
       WHERE r.name LIKE '%finance%' AND e.status = 1`,
      { type: QueryTypes.SELECT, transaction }
    );

    for (const officer of financeOfficers) {
      await CrmWorkflowService.createNotification(
        officer.id,
        'finance_review',
        'New Opportunity for Finance Review',
        `Opportunity #${opportunityId} has been submitted and requires your finance verification.`,
        'high',
        transaction
      );
    }
  }

  private static async notifyComplianceOfficers(opportunityId: number, leadId: number, transaction: any) {
    const complianceOfficers = await sequelize.query<any>(
      `SELECT e.id FROM crm_employee e
       INNER JOIN crm_role r ON e.role = r.id
       WHERE r.name LIKE '%compliance%' AND e.status = 1`,
      { type: QueryTypes.SELECT, transaction }
    );

    for (const officer of complianceOfficers) {
      await CrmWorkflowService.createNotification(
        officer.id,
        'compliance_review',
        'Finance Approved — Compliance Review Required',
        `Opportunity #${opportunityId} has passed Finance verification and requires your compliance review.`,
        'high',
        transaction
      );
    }
  }

  private static async notifyAccountManager(leadId: number, opportunityId: number, message: string, transaction: any) {
    let lead = null;
    try {
      lead = await CrmcForumLeads.findByPk(leadId, { transaction });
    } catch {
      // CrmcForumLeads may have schema mismatches on remote DB
    }
    if (!lead) return;

    const assignedTo = (lead as any).assignTo || (lead as any).Counsilor;
    if (!assignedTo) return;

    await CrmWorkflowService.createNotification(
      assignedTo,
      'workflow_update',
      'Opportunity Status Update',
      message,
      'normal',
      transaction
    );
  }

  private static async createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    priority: string,
    transaction: any
  ) {
    await CrmcNotifications.create({
      user_id: userId,
      type,
      title,
      message,
      is_read: false,
      priority,
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });
  }

  // ─── Dashboard / Reporting ──────────────────────────────────
  static async getWorkflowDashboard() {
    const statusCounts = await sequelize.query<any>(
      `SELECT workflow_status, COUNT(*) as count
       FROM crm_opportunity_workflow_reviews
       GROUP BY workflow_status`,
      { type: QueryTypes.SELECT }
    );

    const pendingFinance = await CrmOpportunityWorkflowReview.count({
      where: { workflowStatus: WORKFLOW_STATUSES.PENDING_FINANCE_REVIEW }
    });

    const pendingCompliance = await CrmOpportunityWorkflowReview.count({
      where: { workflowStatus: WORKFLOW_STATUSES.PENDING_COMPLIANCE }
    });

    const activeCases = await CrmOpportunityWorkflowReview.count({
      where: { workflowStatus: WORKFLOW_STATUSES.CASE_ACTIVE }
    });

    return {
      statusCounts,
      pendingFinance,
      pendingCompliance,
      activeCases,
    };
  }
}
