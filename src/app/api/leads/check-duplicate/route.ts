import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { findExistingLead, recordDuplicateLeadAttempt } from '@/lib/duplicateLeadCheck';

// Lets the Add Lead form check an email/phone against existing leads as the
// user types, instead of only finding out about the duplicate on submit.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['leads.create', 'leads.view']);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || undefined;
  const phone = searchParams.get('phone') || undefined;

  if (!email && !phone) {
    return NextResponse.json({ duplicate: false });
  }

  const existingLead = await findExistingLead({ email, phone });
  if (!existingLead) {
    return NextResponse.json({ duplicate: false });
  }

  await recordDuplicateLeadAttempt({
    existingLead,
    actorId: auth.id,
    actorRole: auth.roleName || auth.type,
  });

  return NextResponse.json({
    duplicate: true,
    duplicateLeadId: existingLead.id,
    duplicateLeadOwner: existingLead.ownerName,
    duplicateLeadOwnerId: existingLead.ownerId,
    duplicateLeadStatus: existingLead.status || 'New',
  });
}
