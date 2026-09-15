import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { notifyUser } from '@/lib/notify';
import { resolveBranchCurrency } from '@/lib/branchCurrency';
import { formatDocumentNumber } from '@/lib/documentNumbering';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbInitialized = false;
const ensureDB = async () => { if (!dbInitialized) { await connectDB(); dbInitialized = true; } };

export async function PUT(request: NextRequest) {
  try {
    // This is the Accounts sign-off that advances finance_status to
    // 'approved' on crm_opportunity_workflow_reviews (see below) — one of the
    // two gates isFinanceAndComplianceApproved() relies on before an
    // opportunity can be marked won. It previously computed currentUser via
    // verifyToken() but never checked the result, so an unauthenticated
    // caller could verify any payment and forge that approval outright.
    const auth = requireAuth(request, ['finance.view', 'finance.manage', 'payments.view']);
    if (isAuthError(auth)) return auth;
    const currentUser = auth;

    await ensureDB();
    const body = await request.json();
    const { paymentId, status, remarks } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'paymentId and status are required' }, { status: 400 });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be verified or rejected' }, { status: 400 });
    }

    // Update payment status
    await sequelize.query(
      `UPDATE crm_opportunity_payments
       SET accountantStatus = :status,
           accountantRemarks = :remarks,
           accountantId = :accountId,
           accountantVerifiedAt = NOW(),
           updatedAt = NOW()
       WHERE id = :paymentId`,
      {
        replacements: { status, remarks: remarks || null, accountId: currentUser?.id || null, paymentId },
        type: QueryTypes.UPDATE,
      }
    );

    let agreementNumber: string | null = null;

    // Find the opportunity linked to this payment (needed both to auto-generate the
    // agreement and to advance the finance gate on crm_opportunity_workflow_reviews below).
    const [payment] = await sequelize.query<{ opportunityId: number; leadId: number | null; clientName: string; totalAmount: number; currency: string; assignedTo: number | null; leadAssignTo: number | null; branchId: number | null; serviceType: string | null }>(
      `SELECT p.opportunityId, o.leadId,
              COALESCE(p.clientName, CONCAT(l.fname,' ',COALESCE(l.lname,''))) AS clientName,
              COALESCE(p.totalAmount,0) AS totalAmount,
              COALESCE(p.currency,'AED') AS currency,
              o.assignedTo, l.assignTo AS leadAssignTo,
              COALESCE(l.branch, o.branchId) AS branchId,
              COALESCE(o.serviceType, o.serviceRequired) AS serviceType
       FROM crm_opportunity_payments p
       LEFT JOIN crm_opportunities o ON o.id = p.opportunityId
       LEFT JOIN crm_forum_leads  l ON l.id = o.leadId
       WHERE p.id = :paymentId LIMIT 1`,
      { replacements: { paymentId }, type: QueryTypes.SELECT }
    );

    // Let the counselor know Accounts reviewed their submission — the wizard's
    // Accounts stage only shows this on-demand refresh, so without a
    // notification a rejected payment can sit unnoticed indefinitely.
    const counselorId = payment?.assignedTo || payment?.leadAssignTo;
    if (counselorId) {
      await notifyUser({
        userId: counselorId,
        type: 'payment_verification',
        title: status === 'verified' ? 'Payment verified by Accounts' : 'Payment rejected by Accounts',
        message: status === 'verified'
          ? `Accounts verified the payment for ${payment?.clientName || `opportunity #${payment?.opportunityId}`}.`
          : `Accounts rejected the payment for ${payment?.clientName || `opportunity #${payment?.opportunityId}`}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        priority: status === 'rejected' ? 'high' : 'medium',
        link: payment?.leadId ? `/admin/leads/${payment.leadId}/edit` : undefined,
        relatedId: payment?.leadId ?? undefined,
        relatedType: payment?.leadId ? 'lead' : undefined,
      });
    }

    if (payment?.opportunityId) {
      // Advance the finance gate so the client can eventually surface in the
      // Client List, which reads crm_opportunity_workflow_reviews.finance_status/
      // compliance_status directly (see src/app/api/admin/clients/route.ts).
      await sequelize.query(
        `UPDATE crm_opportunity_workflow_reviews
         SET finance_status = :financeStatus,
             finance_reviewed_by = :accountId,
             finance_reviewed_at = NOW(),
             workflow_status = :workflowStatus,
             updated_at = NOW()
         WHERE opportunity_id = :opportunityId`,
        {
          replacements: {
            financeStatus: status === 'verified' ? 'approved' : 'rejected',
            accountId: currentUser?.id || null,
            workflowStatus: status === 'verified' ? 'pending_compliance' : 'finance_review_failed',
            opportunityId: payment.opportunityId,
          },
          type: QueryTypes.UPDATE,
        }
      );
    }

    // When payment is verified, auto-generate an agreement number if one doesn't exist yet
    if (status === 'verified') {
      if (payment?.opportunityId) {
        // Check if an agreement already exists for this opportunity
        const [existing] = await sequelize.query<{ id: number; agreementNumber: string }>(
          `SELECT id, agreementNumber FROM crm_opportunity_agreements WHERE opportunityId = :oppId LIMIT 1`,
          { replacements: { oppId: payment.opportunityId }, type: QueryTypes.SELECT }
        );

        if (existing) {
          agreementNumber = existing.agreementNumber;
        } else {
          // Placeholder for the NOT NULL column — reformatted below once the
          // row's own auto-increment id is known.
          agreementNumber = `AGR-PENDING-${Date.now()}`;

          const [insertId] = await sequelize.query(
            `INSERT INTO crm_opportunity_agreements
               (opportunityId, agreementNumber, agreementType, title, status,
                clientName, totalAmount, currency, startDate, endDate,
                createdBy, uploadedBy, generatedDate, createdAt, updatedAt)
             VALUES
               (:opportunityId, :agreementNumber, 'service_agreement',
                CONCAT('Service Agreement - ', :clientName),
                'generated',
                :clientName, :totalAmount, :currency,
                CURDATE(),
                DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
                :createdBy, :createdBy, NOW(), NOW(), NOW())`,
            {
              replacements: {
                opportunityId: payment.opportunityId,
                agreementNumber,
                clientName: (payment.clientName || '').trim(),
                totalAmount: Number(payment.totalAmount || 0),
                currency: payment.currency || 'AED',
                createdBy: currentUser?.id || 1,
              },
              type: QueryTypes.INSERT,
            }
          );

          // AG/{branch}/{product}/{DDMMYYYY}/{seq}, e.g. AG/QTR/CAN/15072026/001.
          const branchCurrency = await resolveBranchCurrency(payment.branchId);
          agreementNumber = formatDocumentNumber({
            prefix: 'AG',
            branchName: branchCurrency?.branchName,
            branchAddress: branchCurrency?.branchAddress,
            branchAbbrv: branchCurrency?.branchAbbrv,
            product: payment.serviceType,
            sequenceId: Number(insertId),
          });
          await sequelize.query(
            `UPDATE crm_opportunity_agreements SET agreementNumber = :agreementNumber WHERE id = :id`,
            { replacements: { agreementNumber, id: Number(insertId) }, type: QueryTypes.UPDATE }
          );

          // Keep the legacy contract register (crm_forum_leads_contracts) in sync,
          // matching the other two agreement-creation paths (lead-to-opportunity,
          // receipts) so every agreement gets a contract number regardless of
          // which flow generated it.
          if (payment.leadId) {
            await sequelize.query(
              `INSERT INTO crm_forum_leads_contracts
                 (leadId, contract, unsigned_contract, ar_contract, new_contract, garys,
                  remarks, verify, verify_by, verify_date, batch_id, wp_batch_id,
                  vendor_id, employer_id, old_crm_ag_id, payment_status)
               VALUES
                 (:leadId, :contractFile, :unsignedFile, :arFile, NULL, NULL,
                  :remarks, 0, 0, NULL, 0, 0,
                  0, 0, 0, 1)`,
              {
                replacements: {
                  leadId: payment.leadId,
                  contractFile: `${agreementNumber}.pdf`,
                  unsignedFile: `unsigned_${agreementNumber}.pdf`,
                  arFile: `ar_${agreementNumber}.pdf`,
                  remarks: `Auto-created on payment verification. Agreement number: ${agreementNumber}`,
                },
                type: QueryTypes.INSERT,
              }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${status} successfully`,
      agreementNumber,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
