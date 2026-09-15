import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeoOrDirectorOfSales } from '@/lib/roleChecks';
import { listActiveOrgEmployees, getSubordinateIds } from '@/lib/targetAssignment';

// Flat active-employee list (id, name, role, managerId) for the admin UI's
// cascading org-chart picker - the client builds the tree from managerId
// links rather than the server pre-nesting it, since the UI needs to filter/
// search across levels interactively.
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const employees = await listActiveOrgEmployees();
    if (isCeoOrDirectorOfSales(auth)) {
      return NextResponse.json({ success: true, employees });
    }
    const visibleIds = new Set([auth.id, ...(await getSubordinateIds(auth.id))]);
    return NextResponse.json({ success: true, employees: employees.filter((e) => visibleIds.has(e.id)) });
  } catch (error) {
    console.error('Error fetching org hierarchy:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch org hierarchy' }, { status: 500 });
  }
}
