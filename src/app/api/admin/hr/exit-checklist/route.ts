import { NextRequest, NextResponse } from 'next/server';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const itemStatuses = ['Pending', 'Completed', 'Waived'] as const;
type ItemStatus = typeof itemStatuses[number];

const readString = (body: Record<string, unknown>, key: string) => (
  body[key] === undefined || body[key] === null ? '' : String(body[key]).trim()
);

const isItemStatus = (value: unknown): value is ItemStatus => (
  typeof value === 'string' && itemStatuses.includes(value as ItemStatus)
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const data = await HRService.listExitChecklists({
      employeeId: searchParams.get('employee_id') || undefined,
      checklistId: searchParams.get('checklist_id') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100', 10),
    });

    return NextResponse.json({
      ...data,
      template: HRService.getExitChecklistTemplate(),
    });
  } catch (error) {
    console.error('Failed to fetch exit checklists:', error);
    return NextResponse.json({ error: 'Failed to fetch exit checklists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const employeeId = readString(body, 'employee_id');
    if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });

    const created = await HRService.assignExitChecklist({
      employee_id: employeeId,
      separation_reason: readString(body, 'separation_reason') || null,
      last_working_day: readString(body, 'last_working_day') || null,
      assigned_by: readString(body, 'assigned_by') || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign exit checklist';
    console.error('Failed to assign exit checklist:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['hr.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json() as Record<string, unknown>;
    const itemId = readString(body, 'item_id');

    if (!itemId) return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    if (!isItemStatus(body.status)) return NextResponse.json({ error: 'status must be Pending, Completed, or Waived' }, { status: 400 });

    const updated = await HRService.updateExitChecklistItem({
      item_id: itemId,
      status: body.status,
      completed_by: readString(body, 'completed_by') || null,
      notes: readString(body, 'notes') || null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update exit checklist item';
    console.error('Failed to update exit checklist item:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['hr.delete']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const checklistId = searchParams.get('checklist_id');
    if (!checklistId) {
      return NextResponse.json({ error: 'checklist_id is required' }, { status: 400 });
    }
    await HRService.deleteExitChecklist(checklistId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete exit checklist:', error);
    return NextResponse.json({ error: 'Failed to delete exit checklist' }, { status: 500 });
  }
}
