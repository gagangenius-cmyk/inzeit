import { NextRequest, NextResponse } from 'next/server';
import { CrmcForumLeads } from '@/models';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['leads.view', 'leads.update']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { leadId, ...data } = body;

    if (!leadId) {
      return NextResponse.json({ message: 'Lead ID is required' }, { status: 400 });
    }

    // Find the lead
    const lead = await CrmcForumLeads.findByPk(leadId);
    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Update lead to become an opportunity
    await lead.update({
      stepComplete: 2, // 2 = Opportunity
      convet: 'Opportunity',
      service_interest: data.opportunityName || lead.service_interest,
      type: data.opportunityType || lead.type,
      priority: data.priority || lead.priority,
      payTotal: data.expectedRevenue ? parseFloat(data.expectedRevenue) : lead.payTotal,
      dueDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : lead.dueDate,
      lead_remark: data.notes || lead.lead_remark,
      last_updated: new Date().toLocaleDateString(),
      last_updtd_time: new Date().toTimeString().split(' ')[0]
    });

    return NextResponse.json({
      message: 'Opportunity created successfully',
      opportunityId: lead.id,
      opportunity: lead,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Opportunity creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create opportunity: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['leads.view', 'leads.update']);
  if (isAuthError(auth)) return auth;

  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
