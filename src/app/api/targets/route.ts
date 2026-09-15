import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeoOrDirectorOfSales } from '@/lib/roleChecks';
import { listTargets, upsertTarget, getSubordinateIds, TargetType } from '@/lib/targetAssignment';

// Scopes a caller's visibility to their own target rows plus their full
// reporting subtree (via crm_employee.manager_id). Only CEO/Director of
// Sales see every target company-wide; a Team Leader/Area Manager (who DOES
// get company-wide LEAD visibility elsewhere - see canViewAllBranches) is
// still scoped to their own team here, since two different managers'
// advisors' targets are none of each other's business.
async function resolveVisibleEmployeeIds(auth: { id: number; role?: string | number | null; type?: string | null; roleName?: string | null }): Promise<number[] | null> {
  if (isCeoOrDirectorOfSales(auth)) return null; // null = no restriction
  const subordinateIds = await getSubordinateIds(auth.id);
  return [auth.id, ...subordinateIds];
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const employeeIdParam = searchParams.get('employeeId');
    const month = searchParams.get('month') || undefined;
    const targetType = (searchParams.get('targetType') as TargetType | null) || undefined;

    const visibleIds = await resolveVisibleEmployeeIds(auth);
    let employeeIds: number[] | undefined;
    if (employeeIdParam) {
      const requested = Number.parseInt(employeeIdParam, 10);
      if (visibleIds && !visibleIds.includes(requested)) {
        return NextResponse.json({ success: false, error: 'You cannot view targets for this employee' }, { status: 403 });
      }
      employeeIds = [requested];
    } else if (visibleIds) {
      employeeIds = visibleIds;
    }

    const targets = await listTargets({ employeeIds, month, targetType });
    return NextResponse.json({ success: true, targets });
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Setting/editing a target is a manager action - gated by the same
  // 'transfers.manage' permission (CEO + Director of Sales) used for the
  // sibling assignment-rules/reassignment-rules admin features.
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    if (!body.employeeId || !body.targetMonth || !body.targetType) {
      return NextResponse.json({ success: false, error: 'employeeId, targetMonth, and targetType are required' }, { status: 400 });
    }
    const target = await upsertTarget({
      employeeId: Number(body.employeeId),
      assignedBy: auth.id,
      targetMonth: body.targetMonth,
      targetType: body.targetType,
      meetingsTarget: body.meetingsTarget ?? null,
      appointmentsTarget: body.appointmentsTarget ?? null,
      salesRevenueTarget: body.salesRevenueTarget ?? null,
      collectionTarget: body.collectionTarget ?? null,
      notes: body.notes ?? null,
    });
    return NextResponse.json({ success: true, target }, { status: 201 });
  } catch (error) {
    console.error('Error saving target:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save target' },
      { status: 400 }
    );
  }
}
