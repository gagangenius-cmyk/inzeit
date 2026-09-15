import { NextRequest, NextResponse } from 'next/server';
import { Op, QueryTypes } from 'sequelize';
import { Crm3partyPayment, Crm3partyPaymentDet, CrmcForumLeadsFee } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { CACHE_TAGS, invalidateReportCaches } from '@/lib/reportCache';

async function assertLeadBranchWritable(auth: { branch?: string | number | null }, leadId: number | null | undefined): Promise<string | null> {
  if (!leadId) return null;
  const [row] = await sequelize.query<{ branch: number | null }>(
    'SELECT branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  if (row && row.branch !== null && Number(row.branch) !== Number(auth.branch || 0)) {
    return 'You can only record or edit a payment for a lead in your own branch';
  }
  return null;
}
import { requireAuth, isAuthError } from '@/lib/apiAuth';

// Ported from the legacy PHP third-party payment form (lead_extra_payment.php)
// — only these "particulars" were ever taxed there; everything else (exam
// bookings, appointments, RCBI fees, etc.) is untaxed regardless of region.
const TAXABLE_PARTICULARS = new Set([
  'Re-Launching Application',
  'Poland Re-Launching Application',
  'IELTS_TRAINING',
  'PTE_TRAINING',
  'IELTS_WORK',
  'Upgrade_Dual_Package',
  'Addition of family member',
  'Upgrade to New country application - Visit Visa',
]);

// The legacy form keyed its tax rate off crm_region.id (5% for a set of UAE
// emirate-level region ids, 18% for India-level ids, 15% for a couple of ids
// that no longer exist in this app's 4-row region table). Region ids were
// renumbered during migration, so those old ids can't be ported directly —
// this keys off the region's *name* instead, which is stable, and maps each
// country to its standard rate (UAE 5% VAT, India 18% GST). Kuwait/Qatar/
// anything else falls through to 0%, matching the legacy form's default.
function taxRateForRegion(regionName: string | null | undefined): number {
  const name = String(regionName || '').trim().toLowerCase();
  if (name === 'uae') return 5;
  if (name === 'india') return 18;
  return 0;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'finance.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'thirdparty';
    const paymentMethod = searchParams.get('paymentMethod') || '';

    const offset = (page - 1) * limit;

    // Branch Manager sees only their own branch's payments here - CEO and
    // anyone with a company-wide finance/admin permission see everything, same
    // exemption pattern used for the write side of this route.
    let branchLeadIds: number[] | null = null;
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const rows = await sequelize.query<{ id: number }>(
        'SELECT id FROM crm_forum_leads WHERE branch = :branch',
        { replacements: { branch: auth.branch || 0 }, type: QueryTypes.SELECT },
      );
      branchLeadIds = rows.map((r) => r.id);
    }

    if (type === 'thirdparty') {
      const where: any = {};
      if (search) {
        where[Op.or] = [
          { receipt: { [Op.like]: `%${search}%` } },
          { trans_or_ref_number: { [Op.like]: `%${search}%` } }
        ];
      }
      if (paymentMethod) {
        where.payMethod = paymentMethod;
      }
      if (branchLeadIds) {
        where.leadId = { [Op.in]: branchLeadIds.length ? branchLeadIds : [-1] };
      }

      const { count, rows } = await Crm3partyPayment.findAndCountAll({
        where,
        attributes: [
          'id', 'leadId', 'date', 'currency_id', 'amount', 'Tax', 'payMethod',
          'emp_id', 'receipt_date', 'cc_number', 'receipt', 'counselor_receipt',
          'trans_or_ref_number', 'remarks'
        ],
        limit,
        offset,
        order: [['receipt_date', 'DESC']]
      });

      return NextResponse.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } else {
      const where: any = {};
      if (search) {
        where.lead = search;
      }
      if (branchLeadIds) {
        // A plain search value already pins `where.lead` to one exact id -
        // only add the branch filter when there's no search, so the two
        // conditions don't collide into an impossible AND.
        if (search) {
          if (!branchLeadIds.includes(Number(search))) {
            where.lead = -1;
          }
        } else {
          where.lead = { [Op.in]: branchLeadIds.length ? branchLeadIds : [-1] };
        }
      }

      const { count, rows } = await CrmcForumLeadsFee.findAndCountAll({
        where,
        limit,
        offset,
        order: [['paidDate', 'DESC']]
      });

      return NextResponse.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    }
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'payments.create', 'finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'thirdparty') {
      const leadId = Number(data.leadId);
      const amount = Number(data.amount);
      const particular = String(data.particular || '').trim();
      if (!leadId || !Number.isFinite(amount) || amount <= 0 || !particular) {
        return NextResponse.json({ error: 'leadId, a positive amount, and particular are required' }, { status: 422 });
      }

      if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
        const scopeError = await assertLeadBranchWritable(auth, leadId);
        if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
      }

      // Duplicate-submission guard: block an identical (lead, amount,
      // particular) third-party payment already recorded today, matching the
      // same guard used elsewhere in this codebase against double-click
      // resubmits. crm_3party_payment has no createdAt column to scope this to
      // "the last minute" the way other guards do, so it's scoped to today.
      const recentDuplicate = await sequelize.query<{ id: number }>(
        `SELECT id FROM crm_3party_payment
         WHERE leadId = :leadId AND amount = :amount AND date = CURDATE()
         ORDER BY id DESC LIMIT 1`,
        { replacements: { leadId, amount }, type: QueryTypes.SELECT },
      );
      if (recentDuplicate.length) {
        const [dupDet] = await sequelize.query<{ id: number }>(
          `SELECT id FROM crm_3party_payment_det WHERE payId = :payId AND particular = :particular LIMIT 1`,
          { replacements: { payId: recentDuplicate[0].id, particular }, type: QueryTypes.SELECT },
        );
        if (dupDet) {
          return NextResponse.json({ error: 'A matching third-party payment for this lead was already recorded today.' }, { status: 409 });
        }
      }

      // Tax is always derived server-side from the lead's own branch/region —
      // never trusted from the client (mirrors how admin-fee VAT is computed
      // elsewhere in this app).
      const [leadRow] = await sequelize.query<{ regionName: string | null }>(
        `SELECT r.name AS regionName FROM crm_forum_leads l LEFT JOIN crm_region r ON r.id = l.region WHERE l.id = :leadId LIMIT 1`,
        { replacements: { leadId }, type: QueryTypes.SELECT },
      );
      const tax = TAXABLE_PARTICULARS.has(particular)
        ? Number((amount * (taxRateForRegion(leadRow?.regionName) / 100)).toFixed(2))
        : 0;

      const newPayment = await Crm3partyPayment.create({
        leadId,
        payMethod: data.payMethod || null,
        date: new Date(),
        amount,
        currency_id: Number(data.currency_id) || 0,
        Tax: tax,
        // Legacy NOT NULL columns this drawer's flow has no value for —
        // empty string, matching how the rest of this codebase fills
        // unused legacy varchar-NOT-NULL columns.
        receipt_date: new Date(),
        cc_number: '',
        receipt: '',
        trans_or_ref_number: '',
        counselor_receipt: data.counselor_receipt || '',
        emp_id: Number(auth.id),
        remarks: data.remarks || '',
        payoption: data.payoption || '',
        paycardoption: data.paycardoption || '',
      } as any);

      await Crm3partyPaymentDet.create({
        payId: newPayment.get('id') as number,
        particular,
        amount,
      });

      invalidateReportCaches([CACHE_TAGS.payments]);

      return NextResponse.json(newPayment, { status: 201 });
    } else {
      if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
        const scopeError = await assertLeadBranchWritable(auth, Number(data.lead) || null);
        if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
      }
      const newFee = await CrmcForumLeadsFee.create({
        ...data,
        payDate: data.payDate ? new Date(data.payDate) : new Date(),
        paidDate: data.paidDate ? new Date(data.paidDate) : new Date(),
      });
      return NextResponse.json(newFee, { status: 201 });
    }
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'payments.create', 'finance.view', 'finance.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, type, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'thirdparty') {
      const payment = await Crm3partyPayment.findByPk(id);
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
        const scopeError = await assertLeadBranchWritable(auth, payment.get('leadId') as number | null);
        if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
      }
      await payment.update(updateData);
      return NextResponse.json(payment);
    } else {
      const fee = await CrmcForumLeadsFee.findByPk(id);
      if (!fee) {
        return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
      }
      if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
        const scopeError = await assertLeadBranchWritable(auth, fee.get('lead') as number | null);
        if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
      }
      await fee.update(updateData);
      return NextResponse.json(fee);
    }
  } catch (error: any) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'thirdparty';

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'thirdparty') {
      const deleted = await Crm3partyPayment.destroy({ where: { id } });
      if (!deleted) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
    } else {
      const deleted = await CrmcForumLeadsFee.destroy({ where: { id } });
      if (!deleted) {
        return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Delete payment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment: ' + error.message },
      { status: 500 }
    );
  }
}
