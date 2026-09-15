import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { del } from '@vercel/blob';
import { CrmcOpportunityPayments, CrmcOpportunityActivities } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

// Only ever delete a blob we recognize as one of ours — never trust an
// arbitrary stored URL string as safe to pass to a delete API.
function isOwnBlobUrl(url: unknown): url is string {
  return typeof url === 'string' && /\.public\.blob\.vercel-storage\.com\//.test(url);
}

// Renders a before/after summary for the audit trail — only fields that
// actually changed are included, so a routine save that touched nothing
// doesn't clutter the opportunity's activity feed with a no-op line.
function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, fields: string[]): string[] {
  const normalize = (value: unknown): string => {
    if (value === null || value === undefined) return '(empty)';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  };
  const changes: string[] = [];
  for (const field of fields) {
    const beforeVal = normalize(before[field]);
    const afterVal = normalize(after[field]);
    if (beforeVal !== afterVal) {
      changes.push(`${field}: "${beforeVal}" → "${afterVal}"`);
    }
  }
  return changes;
}

async function assertOpportunityBranchWritable(auth: { branch?: string | number | null }, opportunityId: unknown): Promise<string | null> {
  const id = Number(opportunityId);
  if (!id) return null;
  const [row] = await sequelize.query<{ branch: number | null }>(
    `SELECT COALESCE(l.branch, o.branchId) AS branch
     FROM crm_opportunities o
     LEFT JOIN crm_forum_leads l ON l.id = o.leadId
     WHERE o.id = :opportunityId`,
    { replacements: { opportunityId: id }, type: QueryTypes.SELECT },
  );
  if (row && row.branch !== null && Number(row.branch) !== Number(auth.branch || 0)) {
    return 'You can only edit a payment receipt for an opportunity in your own branch';
  }
  return null;
}

// A generated receipt is a document the client already has in hand — only
// Branch Manager/CEO may go back and correct it after the fact, mirroring
// the same restriction already enforced on re-submitting an existing
// payment tag in src/app/api/receipts/route.ts.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  if (!isBranchManagerOrCeo(auth)) {
    return NextResponse.json({ error: 'Only Branch Manager or CEO can edit a payment receipt' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const paymentId = Number(id);
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await CrmcOpportunityPayments.findByPk(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (!isCeo(auth)) {
      const scopeError = await assertOpportunityBranchWritable(auth, payment.get('opportunityId'));
      if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
    }

    const body = await request.json();

    const totalAmount = body.totalAmount !== undefined ? Number(body.totalAmount) : Number(payment.get('totalAmount'));
    const paidAmount = body.paidAmount !== undefined ? Number(body.paidAmount) : Number(payment.get('paidAmount'));
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ error: 'totalAmount must be greater than zero' }, { status: 422 });
    }
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return NextResponse.json({ error: 'paidAmount cannot be negative' }, { status: 422 });
    }
    const remainingBalance = body.remainingBalance !== undefined
      ? Number(body.remainingBalance)
      : Math.max(totalAmount - paidAmount, 0);

    // Whitelisted: only fields the printed receipt actually reads (see
    // src/lib/receiptTemplate.ts) are editable here — internal bookkeeping
    // columns like status/accountantStatus/createdBy are never touched by
    // this endpoint. consultantName is deliberately never read from the
    // body — the counselor recorded at creation time is read-only, even to
    // a direct API call, so a receipt can't be re-attributed after the fact.
    const beforeSnapshot = payment.get({ plain: true }) as unknown as Record<string, unknown>;
    const updateData: Record<string, unknown> = {
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : payment.get('paymentDate'),
      clientName: body.clientName ?? payment.get('clientName'),
      clientEmail: body.clientEmail ?? payment.get('clientEmail'),
      clientPhone: body.clientPhone ?? payment.get('clientPhone'),
      serviceName: body.serviceName ?? payment.get('serviceName'),
      paymentMethod: body.paymentMethod ?? payment.get('paymentMethod'),
      transactionId: body.transactionId ?? payment.get('transactionId'),
      currency: body.currency ?? payment.get('currency'),
      totalAmount,
      paidAmount,
      remainingBalance,
      taxAmount: body.taxAmount !== undefined ? Number(body.taxAmount) : payment.get('taxAmount'),
      discountAmount: body.discountAmount !== undefined ? Number(body.discountAmount) : payment.get('discountAmount'),
      notes: body.notes ?? payment.get('notes'),
      description: body.description ?? payment.get('description'),
      receiptUrl: body.receiptUrl !== undefined ? body.receiptUrl : payment.get('receiptUrl'),
      updatedAt: new Date(),
    };

    const changedFields = diffFields(beforeSnapshot, updateData, [
      'paymentDate', 'clientName', 'clientEmail', 'clientPhone', 'serviceName', 'paymentMethod',
      'transactionId', 'currency', 'totalAmount', 'paidAmount', 'remainingBalance', 'taxAmount',
      'discountAmount', 'notes', 'description',
    ]);
    const oldReceiptUrl = beforeSnapshot.receiptUrl as string | null;
    const proofReplaced = body.receiptUrl !== undefined && body.receiptUrl !== oldReceiptUrl;
    if (proofReplaced) {
      changedFields.push(oldReceiptUrl ? 'proof of payment: replaced' : 'proof of payment: added');
    }

    await payment.update(updateData);

    // Delete the superseded file only after the new URL is safely saved —
    // never the other way around, or a failed save could leave the receipt
    // pointing at a proof file that's already gone.
    if (proofReplaced && isOwnBlobUrl(oldReceiptUrl)) {
      try {
        await del(oldReceiptUrl);
      } catch (blobError) {
        console.error('Failed to delete superseded proof of payment blob:', blobError);
      }
    }

    // remark/admin fee live on the legacy crm_pay_history ledger, matched by
    // receipt number (see the same join in GET /api/opportunity-payments) —
    // not on crm_opportunity_payments itself.
    const receiptKey = payment.get('receiptNumber') || payment.get('paymentNumber');
    if (receiptKey && (body.remark !== undefined || body.adminFeeIncluded !== undefined || body.adminFeeAmount !== undefined)) {
      const [payHistoryBefore] = await sequelize.query<{ remark: string | null; admin_fee_included: number; admin_fee_amount: number }>(
        'SELECT remark, admin_fee_included, admin_fee_amount FROM crm_pay_history WHERE counselor_receipt = :receiptKey LIMIT 1',
        { replacements: { receiptKey }, type: QueryTypes.SELECT },
      );

      const payHistorySet: string[] = [];
      const replacements: Record<string, unknown> = { receiptKey };
      if (body.remark !== undefined) {
        payHistorySet.push('remark = :remark');
        replacements.remark = body.remark || null;
        if ((payHistoryBefore?.remark || '') !== (body.remark || '')) {
          changedFields.push(`remark: "${payHistoryBefore?.remark || '(empty)'}" → "${body.remark || '(empty)'}"`);
        }
      }
      if (body.adminFeeIncluded !== undefined) {
        const newVal = body.adminFeeIncluded ? 1 : 0;
        payHistorySet.push('admin_fee_included = :adminFeeIncluded');
        replacements.adminFeeIncluded = newVal;
        if (Number(payHistoryBefore?.admin_fee_included || 0) !== newVal) {
          changedFields.push(`adminFeeIncluded: ${Boolean(payHistoryBefore?.admin_fee_included)} → ${Boolean(newVal)}`);
        }
      }
      if (body.adminFeeAmount !== undefined) {
        const newVal = Number(body.adminFeeAmount) || 0;
        payHistorySet.push('admin_fee_amount = :adminFeeAmount');
        replacements.adminFeeAmount = newVal;
        if (Number(payHistoryBefore?.admin_fee_amount || 0) !== newVal) {
          changedFields.push(`adminFeeAmount: ${Number(payHistoryBefore?.admin_fee_amount || 0)} → ${newVal}`);
        }
      }
      if (payHistorySet.length) {
        await sequelize.query(
          `UPDATE crm_pay_history SET ${payHistorySet.join(', ')} WHERE counselor_receipt = :receiptKey`,
          { replacements },
        );
      }
    }

    const opportunityId = payment.get('opportunityId') as number | null;
    if (opportunityId) {
      await CrmcOpportunityActivities.create({
        opportunityId: Number(opportunityId),
        activityType: 'payment_updated',
        activityTitle: 'Payment receipt edited',
        description: changedFields.length
          ? `Receipt ${receiptKey || payment.get('paymentNumber')} edited by ${auth.name || 'a user'} — ${changedFields.join('; ')}`
          : `Receipt ${receiptKey || payment.get('paymentNumber')} was opened for editing by ${auth.name || 'a user'} — no fields changed`,
        activityDate: new Date(),
        assignedTo: auth.id,
        createdBy: auth.id,
        status: 'completed',
        priority: 'low',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    return NextResponse.json({ success: true, data: payment.get({ plain: true }) });
  } catch (error: any) {
    console.error('Error updating opportunity payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment: ' + error.message },
      { status: 500 }
    );
  }
}
