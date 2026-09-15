import { NextRequest, NextResponse } from 'next/server';
import { CrmEvaluationReportDocuments } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isFinanceOrAccounts } from '@/lib/roleChecks';

// Accounts verifies (or rejects) a document uploaded in the Evaluation
// Report wizard's Documents stage. Deliberately touches nothing but this
// one row — no crm_opportunity_workflow_reviews row, no crm_opportunities
// row, no agreement — unlike the real PUT /api/admin/opportunity-payments/verify,
// which auto-generates an agreement on verify. There is no opportunity in
// this flow for that kind of side effect to even attach to.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['finance.view', 'finance.manage', 'documents.create']);
  if (isAuthError(auth)) return auth;

  if (!isFinanceOrAccounts(auth)) {
    return NextResponse.json({ error: 'Only Accounts/Finance can verify documents' }, { status: 403 });
  }

  const { id } = await params;
  const documentId = Number(id);
  if (!documentId) {
    return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
  }

  const body = await request.json();
  const status = body.status as 'verified' | 'rejected';
  const reviewNote = body.reviewNote ? String(body.reviewNote).trim() : null;

  if (status !== 'verified' && status !== 'rejected') {
    return NextResponse.json({ error: "status must be 'verified' or 'rejected'" }, { status: 400 });
  }
  if (status === 'rejected' && !reviewNote) {
    return NextResponse.json({ error: 'A review note is required when rejecting a document' }, { status: 422 });
  }

  const document = await CrmEvaluationReportDocuments.findByPk(documentId);
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  await document.update({
    status,
    reviewNote,
    verifiedBy: auth.id,
    verifiedAt: new Date(),
  });

  return NextResponse.json(document);
}
