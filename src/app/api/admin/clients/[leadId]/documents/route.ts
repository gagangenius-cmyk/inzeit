import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { ClientPortalService } from '@/services/client-portal-service';
import { checkLeadBranchScope } from '@/lib/branchScopeGuard';

type Context = { params: Promise<{ leadId: string }> };

const reviewStatuses = ['Approved', 'Rejected', 'Resubmit Requested'] as const;
type ReviewStatus = typeof reviewStatuses[number];
const isReviewStatus = (value: unknown): value is ReviewStatus => (
  typeof value === 'string' && reviewStatuses.includes(value as ReviewStatus)
);

export async function GET(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request, ['clients.view']);
  if (isAuthError(auth)) return auth;

  try {
    const leadId = Number((await params).leadId);
    if (!Number.isFinite(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });

    const documents = await ClientPortalService.listDocumentsForStaff(leadId);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Failed to load client documents:', error);
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = requireAuth(request, ['clients.update']);
  if (isAuthError(auth)) return auth;

  try {
    const leadId = Number((await params).leadId);
    if (!Number.isFinite(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });

    const scopeError = await checkLeadBranchScope(auth, leadId);
    if (scopeError) return scopeError;

    const body = await request.json() as Record<string, unknown>;
    const documentId = String(body.document_id || '');
    if (!documentId) return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
    if (!isReviewStatus(body.status)) {
      return NextResponse.json({ error: 'status must be Approved, Rejected, or Resubmit Requested' }, { status: 400 });
    }

    const result = await ClientPortalService.reviewDocument({
      documentId,
      status: body.status,
      reviewerId: String(auth.id),
      reviewNote: body.review_note ? String(body.review_note) : null,
    });

    if (!result) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to review client document:', error);
    return NextResponse.json({ error: 'Failed to review document' }, { status: 500 });
  }
}
