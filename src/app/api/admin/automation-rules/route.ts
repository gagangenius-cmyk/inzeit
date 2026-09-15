import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { captureError } from '@/lib/errorTracking';
import { AutomationRulesService, TRIGGER_DEFINITIONS, ACTION_DEFINITIONS } from '@/services/automation-rules-service';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['automation.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const rules = await AutomationRulesService.listRules();
    return NextResponse.json({ rules, triggerDefinitions: TRIGGER_DEFINITIONS, actionDefinitions: ACTION_DEFINITIONS });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    captureError(error, { route: 'GET /api/admin/automation-rules' });
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['automation.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    if (!body.name || !body.triggerType || !Array.isArray(body.actions) || !body.actions.length) {
      return NextResponse.json({ error: 'name, triggerType, and at least one action are required' }, { status: 400 });
    }

    const rule = await AutomationRulesService.createRule({
      name: body.name,
      description: body.description ?? null,
      triggerType: body.triggerType,
      triggerConfig: body.triggerConfig || {},
      conditions: body.conditions || [],
      actions: body.actions,
      isActive: body.isActive !== false,
      createdBy: auth.id,
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    captureError(error, { route: 'POST /api/admin/automation-rules' });
    const message = error instanceof Error ? error.message : 'Failed to create automation rule';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
