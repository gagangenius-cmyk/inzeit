import { NextRequest, NextResponse } from 'next/server';
import { ITSupportService, ITSupportCategories, ITSupportPriorities, type ITSupportCategory, type ITSupportPriority } from '@/services/it-support-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const isCategory = (value: unknown): value is ITSupportCategory =>
  typeof value === 'string' && (ITSupportCategories as readonly string[]).includes(value);

const isPriority = (value: unknown): value is ITSupportPriority =>
  typeof value === 'string' && (ITSupportPriorities as readonly string[]).includes(value);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['it.self']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const tickets = await ITSupportService.listTickets(auth, {
      tab: searchParams.get('tab') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      branchId: searchParams.get('branch_id') ? Number(searchParams.get('branch_id')) : undefined,
      search: searchParams.get('search') || undefined,
      mine: searchParams.get('mine') === '1',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Failed to fetch IT support tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch IT support tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['it.create', 'it.self']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!isCategory(body.category)) return NextResponse.json({ error: 'category is invalid' }, { status: 400 });
    const priority = isPriority(body.priority) ? body.priority : 'Medium';

    if (body.category === 'New Procurement' && (body.estimated_cost_aed === undefined || body.estimated_cost_aed === null || body.estimated_cost_aed === '')) {
      return NextResponse.json({ error: 'estimated_cost_aed is required for New Procurement tickets' }, { status: 400 });
    }

    const result = await ITSupportService.createTicket({
      title,
      description: typeof body.description === 'string' ? body.description : null,
      category: body.category,
      priority,
      estimated_cost_aed: body.estimated_cost_aed != null && body.estimated_cost_aed !== '' ? Number(body.estimated_cost_aed) : null,
      branch_id: body.branch_id != null ? Number(body.branch_id) : null,
    }, auth);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to raise IT support ticket';
    console.error('Failed to raise IT support ticket:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
