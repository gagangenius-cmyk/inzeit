import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { getDiscountTier, canApproveDiscountTier, discountTierLabel } from '@/lib/discountApproval';
import { getDiscountTierThresholds } from '@/lib/discountTierConfig';
import { notifyUser } from '@/lib/notify';
import { logDataAccess } from '@/lib/dataAccessAudit';
import { captureError } from '@/lib/errorTracking';

// roleName is the only reliable signal for CEO (see lib/roleChecks.ts: CEO
// shares `type: 'director'` with Director/Founder/Super Admin, so a `type`
// string match can't tell them apart).
function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('auth-token')?.value || authorization?.replace(/^Bearer\s+/i, '');
  return token ? verifyToken(token) : null;
}
function getCeoApprover(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  return user && isCeo(user) ? user : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Authentication is required' }, { status: 401 });
    }
    const { id: discountId } = await params;

    if (!discountId) {
      return NextResponse.json(
        { success: false, error: 'Discount approval ID is required' },
        { status: 400 }
      );
    }

    const [discountResult] = await sequelize.query(`
      SELECT
        da.*,
        l.fname, l.lname, l.email, l.mobile, l.branch AS leadBranch,
        o.opportunityName, o.estimatedValue, o.currency,
        e_req.name as requestedEmployeeName,
        e_app.name as approvedEmployeeName,
        e_req.name as createdEmployeeName
      FROM crm_discount_approvals da
      LEFT JOIN crm_forum_leads l ON da.leadId = l.id
      LEFT JOIN crm_opportunities o ON da.opportunityId = o.id
      LEFT JOIN crm_employee e_req ON da.requestedBy = e_req.id
      LEFT JOIN crm_employee e_app ON da.approvedBy = e_app.id
      WHERE da.id = ?
    `, {
      replacements: [discountId]
    });

    if (!discountResult || (discountResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Discount approval not found' },
        { status: 404 }
      );
    }

    const discountRow = (discountResult as any[])[0];

    // Was missing here (PUT already had it) - any authenticated employee
    // could view any other branch's discount request, including the
    // client's name/email/mobile and discount amount, just by guessing ids.
    if (discountRow.leadBranch !== undefined && discountRow.leadBranch !== null
      && isBranchManagerOrCeo(currentUser) && !isCeo(currentUser)
      && Number(discountRow.leadBranch) !== Number((currentUser as any).branch || 0)) {
      return NextResponse.json(
        { success: false, error: 'You can only view a discount request for a lead in your own branch' },
        { status: 403 }
      );
    }

    void logDataAccess({ userId: currentUser.id, entityType: 'discount_approval', entityId: discountId, action: 'view' });

    return NextResponse.json({
      success: true,
      data: discountRow
    });

  } catch (error: any) {
    console.error('Error fetching discount approval:', error);
    captureError(error, { route: '/api/discount-approvals/[id]' });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discount approval: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: discountId } = await params;
    const body = await request.json();

    if (!discountId) {
      return NextResponse.json(
        { success: false, error: 'Discount approval ID is required' },
        { status: 400 }
      );
    }

    const [existingResult] = await sequelize.query(`
      SELECT id, leadId, opportunityId, discountedAmount, discountAmount, originalAmount, requestedBy, is_deleted FROM crm_discount_approvals WHERE id = ?
    `, {
      replacements: [discountId]
    });

    if (!existingResult || (existingResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Discount approval not found' },
        { status: 404 }
      );
    }

    const existingForAuth = (existingResult as any[])[0];
    const updateData: any = {
      updatedAt: new Date()
    };

    if (['approved', 'rejected'].includes(body.status) && existingForAuth.is_deleted) {
      return NextResponse.json(
        { success: false, error: 'This discount request was replaced by a correction and can no longer be approved or rejected.' },
        { status: 409 }
      );
    }

    if (['approved', 'rejected'].includes(body.status)) {
      const reviewer = getAuthenticatedUser(request);
      const thresholds = await getDiscountTierThresholds();
      const tier = getDiscountTier(Number(existingForAuth.discountAmount), Number(existingForAuth.originalAmount), thresholds);
      if (!reviewer || !canApproveDiscountTier(tier, reviewer as any)) {
        return NextResponse.json(
          { success: false, error: `This is a ${discountTierLabel(tier, thresholds)} discount request — you're not authorized to approve or reject it.` },
          { status: 403 }
        );
      }

      // canApproveDiscountTier() gives Branch Manager the same tier rights as
      // CEO, but that was never meant to cross branches - restrict Branch
      // Manager to discount requests on their own branch's lead.
      if (existingForAuth.leadId && isBranchManagerOrCeo(reviewer) && !isCeo(reviewer)) {
        const [leadBranchRows] = await sequelize.query(
          'SELECT branch FROM crm_forum_leads WHERE id = ? LIMIT 1',
          { replacements: [existingForAuth.leadId] },
        );
        const leadBranch = (leadBranchRows as any[])[0]?.branch;
        if (leadBranch !== undefined && leadBranch !== null && Number(leadBranch) !== Number((reviewer as any).branch || 0)) {
          return NextResponse.json(
            { success: false, error: 'You can only approve or reject a discount request for a lead in your own branch' },
            { status: 403 },
          );
        }
      }

      updateData.approvedBy = reviewer.id;
    }

    // Add approval timestamps based on status
    if (body.status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (body.status === 'rejected') {
      updateData.rejectedDate = new Date();
    }

    // Update other fields
    if (body.status) updateData.status = body.status;
    if (body.approvedAt && !updateData.approvedAt) updateData.approvedAt = new Date(body.approvedAt);
    if (body.rejectedDate && !updateData.rejectedDate) updateData.rejectedDate = new Date(body.rejectedDate);

    await sequelize.query(`
      UPDATE crm_discount_approvals 
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE id = ?
    `, {
      replacements: [...Object.values(updateData), discountId]
    });

    const existingApproval = (existingResult as any[])[0];

    if (['approved', 'rejected'].includes(body.status) && existingApproval?.leadId) {
      const [leadRow] = await sequelize.query<{ fname: string; lname: string }>(
        `SELECT fname, lname FROM crm_forum_leads WHERE id = ? LIMIT 1`,
        { replacements: [existingApproval.leadId], type: QueryTypes.SELECT }
      );
      const clientName = leadRow ? `${leadRow.fname || ''} ${leadRow.lname || ''}`.trim() : `Lead #${existingApproval.leadId}`;
      await notifyUser({
        userId: existingApproval.requestedBy,
        type: 'discount_reviewed',
        title: body.status === 'approved' ? 'Discount approved' : 'Discount rejected',
        message: body.status === 'approved'
          ? `Your discount request for ${clientName} was approved.`
          : `Your discount request for ${clientName} was rejected.`,
        priority: body.status === 'approved' ? 'medium' : 'high',
        link: `/admin/leads/${existingApproval.leadId}/edit`,
        relatedId: existingApproval.leadId,
        relatedType: 'lead',
      });
    }

    if (body.status === 'approved' && existingApproval?.leadId) {
      // payTotal must itself shrink by the discount — otherwise it's left
      // stale at the pre-discount amount while payBalance silently accounts
      // for a discount that payTotal never reflects.
      await sequelize.query(
        `UPDATE crm_forum_leads
         SET discount = ?, payTotal = ?, payBalance = GREATEST(? - COALESCE(paidYet, 0), 0)
         WHERE id = ?`,
        {
          replacements: [
            existingApproval.discountAmount,
            existingApproval.discountedAmount,
            existingApproval.discountedAmount,
            existingApproval.leadId,
          ],
        }
      );
    }
    if (body.status === 'approved' && existingApproval?.opportunityId) {
      await sequelize.query(
        `UPDATE crm_opportunities
         SET estimatedValue = ?, actualValue = COALESCE(actualValue, ?), updatedAt = ?
         WHERE id = ?`,
        {
          replacements: [
            existingApproval.discountedAmount,
            existingApproval.discountedAmount,
            new Date(),
            existingApproval.opportunityId,
          ],
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discount approval updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating discount approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update discount approval: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!getCeoApprover(request)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { id: discountId } = await params;

    if (!discountId) {
      return NextResponse.json(
        { success: false, error: 'Discount approval ID is required' },
        { status: 400 }
      );
    }

    const [existingResult] = await sequelize.query(`
      SELECT id FROM crm_discount_approvals WHERE id = ?
    `, {
      replacements: [discountId]
    });

    if (!existingResult || (existingResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Discount approval not found' },
        { status: 404 }
      );
    }

    await sequelize.query(`DELETE FROM crm_discount_approvals WHERE id = ?`, {
      replacements: [discountId]
    });

    return NextResponse.json({
      success: true,
      message: 'Discount approval deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting discount approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete discount approval: ' + error.message },
      { status: 500 }
    );
  }
}
