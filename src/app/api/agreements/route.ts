import { NextRequest, NextResponse } from 'next/server';
import { models } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const toPlain = (row: any) => row?.get ? row.get({ plain: true }) : row;

function normalizeAgreement(row: any) {
  const agreement = toPlain(row);
  return {
    id: agreement.id,
    agreementNumber: agreement.agreementNumber,
    title: agreement.title || agreement.agreementTitle,
    description: agreement.description,
    status: agreement.status,
    opportunityId: agreement.opportunityId,
    clientName: agreement.clientName,
    clientEmail: agreement.clientEmail,
    clientPhone: agreement.clientPhone,
    totalAmount: Number(agreement.totalAmount || agreement.amount || 0),
    currency: agreement.currency || 'AED',
    startDate: agreement.startDate,
    endDate: agreement.endDate,
    generatedDate: agreement.generatedDate,
    signedDate: agreement.signedDate,
    createdAt: agreement.createdAt,
    updatedAt: agreement.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const limit = Math.max(Number(searchParams.get('limit') || 10), 1);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

    if (action === 'templates') {
      return NextResponse.json({ success: true, templates: [] });
    }

    if (action === 'get' || action === 'pdf') {
      if (!id) {
        return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });
      }

      const where = Number.isFinite(Number(id))
        ? { id: Number(id) }
        : { agreementNumber: id };
      const agreement = await models.CrmcOpportunityAgreements.findOne({ where });

      if (!agreement) {
        return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
      }

      const normalized = normalizeAgreement(agreement);
      if (action === 'pdf') {
        return new NextResponse(JSON.stringify(normalized, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="agreement-${normalized.id}.json"`,
          },
        });
      }

      return NextResponse.json({ success: true, agreement: normalized });
    }

    const where = status ? { status } : undefined;
    const { rows, count } = await models.CrmcOpportunityAgreements.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      agreements: rows.map(normalizeAgreement),
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error in agreements API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // This endpoint's only functional POST action is deleting an agreement
  // (see below); everything else 400s. Gate on agreements.delete accordingly.
  const auth = requireAuth(request, ['agreements.delete']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'delete') {
      const id = body.data?.id || body.id;
      if (!id) {
        return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });
      }
      const deleted = await models.CrmcOpportunityAgreements.destroy({ where: { id: Number(id) } });
      return NextResponse.json({ success: deleted > 0, deleted });
    }

    return NextResponse.json(
      { error: 'Use lead-to-opportunity or opportunity agreement APIs to create/update database agreements.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in agreements API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
