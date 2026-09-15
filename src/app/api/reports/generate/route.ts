import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

interface ReportRequest {
  config: {
    name: string;
    description: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate: string;
    endDate: string;
    counselors: number[];
    includeCharts: boolean;
    includeDetails: boolean;
    includeTrends: boolean;
    format: 'csv' | 'json';
    sections: {
      summary: boolean;
      performance: boolean;
      activities: boolean;
      revenue: boolean;
      issues: boolean;
      trends: boolean;
      recommendations: boolean;
    };
  };
}

interface ReportData {
  summary: {
    totalActivities: number;
    totalCounselors: number;
    totalRevenue: number;
    avgConversionRate: number;
    avgResponseTime: number;
    period: string;
    generatedAt: string;
  };
  performance: Array<{
    counselorId: number;
    name: string;
    role: string;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    avgResponseTime: number;
    avgProcessingTime: number;
    satisfactionScore: number;
    workloadUtilization: number;
    completedTasks: number;
    failedTasks: number;
    totalRevenue: number;
    efficiency: number;
    rank: number;
  }>;
  activities: Array<{
    date: string;
    counselorId: number;
    counselorName: string;
    action: string;
    details: string;
    outcome: string;
    duration: number;
    priority: string;
    category: string;
  }>;
  revenue: Array<{
    date: string;
    counselorId: number;
    counselorName: string;
    amount: number;
    source: string;
    type: string;
  }>;
  trends: {
    daily: Array<{ date: string; activities: number; conversions: number; revenue: number }>;
    weekly: Array<{ week: string; activities: number; conversions: number; revenue: number }>;
    monthly: Array<{ month: string; activities: number; conversions: number; revenue: number }>;
  };
  issues: Array<{
    type: string;
    counselor: string;
    description: string;
    severity: string;
    count: number;
    impact: string;
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: string;
    impact: string;
    actionItems: string[];
  }>;
}

const generateLiveReportData = async (request: ReportRequest, auth: any): Promise<ReportData> => {
  const startDate = request.config.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = request.config.endDate || new Date().toISOString().split('T')[0];
  let counselorIds = request.config.counselors || [];
  const replacements: any[] = [startDate, endDate];

  // CEO can report on any/all counselors; Branch Manager is clamped to their
  // own branch (via a separate SQL condition, since they may not know every
  // counselor's id to pass); everyone else can only ever pull their own
  // report, regardless of what config.counselors requested.
  let branchClause = '';
  if (!isCeo(auth)) {
    if (isBranchManagerOrCeo(auth)) {
      branchClause = ' AND l.branch = ?';
      replacements.push(Number(auth.branch || 0));
    } else {
      counselorIds = [Number(auth.id)];
    }
  }

  const counselorFilter = counselorIds.length
    ? ` AND l.assignTo IN (${counselorIds.map(() => '?').join(',')})`
    : '';

  const counselorReplacements = [...replacements, ...counselorIds];

  const leads = await sequelize.query<any>(`
    SELECT
      l.id, l.fname, l.lname, l.email, l.phone, l.status, l.opportunity_status,
      l.priority, l.service_interest, l.market_source, l.regdate, l.created,
      l.assignTo, l.payTotal, l.paidYet, l.payBalance,
      e.name as counselorName, e.role as counselorRole
    FROM crm_forum_leads l
    LEFT JOIN crm_employee e ON l.assignTo = e.id
    WHERE DATE(COALESCE(l.created, l.regdate)) BETWEEN ? AND ?
    ${branchClause}
    ${counselorFilter}
    ORDER BY COALESCE(l.created, l.regdate) DESC
  `, {
    replacements: counselorReplacements,
    type: QueryTypes.SELECT
  });

  const employees = await sequelize.query<any>(`
    SELECT DISTINCT
      COALESCE(l.assignTo, 0) as counselorId,
      COALESCE(e.name, 'Unassigned') as name,
      COALESCE(CAST(e.role AS CHAR), 'Counselor') as role
    FROM crm_forum_leads l
    LEFT JOIN crm_employee e ON l.assignTo = e.id
    WHERE DATE(COALESCE(l.created, l.regdate)) BETWEEN ? AND ?
    ${branchClause}
    ${counselorFilter}
  `, {
    replacements: counselorReplacements,
    type: QueryTypes.SELECT
  });

  const isConverted = (lead: any) => {
    const status = String(lead.status || '').toLowerCase();
    return ['converted', 'retained', 'client'].includes(status) || String(lead.opportunity_status || '').toLowerCase() === 'won';
  };

  const performance = employees.map((employee: any) => {
    const employeeLeads = leads.filter((lead: any) => Number(lead.assignTo || 0) === Number(employee.counselorId));
    const convertedLeads = employeeLeads.filter(isConverted).length;
    const totalRevenue = employeeLeads.reduce((sum: number, lead: any) => sum + Number(lead.payTotal || 0), 0);
    const totalLeads = employeeLeads.length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      counselorId: Number(employee.counselorId),
      name: employee.name,
      role: employee.role,
      totalLeads,
      convertedLeads,
      conversionRate,
      avgResponseTime: 0,
      avgProcessingTime: 0,
      satisfactionScore: 0,
      workloadUtilization: totalLeads,
      completedTasks: convertedLeads,
      failedTasks: totalLeads - convertedLeads,
      totalRevenue,
      efficiency: conversionRate,
      rank: 0
    };
  }).sort((a: any, b: any) => b.conversionRate - a.conversionRate)
    .map((item: any, index: number) => ({ ...item, rank: index + 1 }));

  const activities = leads.slice(0, 200).map((lead: any) => ({
    date: new Date(lead.created || lead.regdate).toLocaleDateString(),
    counselorId: Number(lead.assignTo || 0),
    counselorName: lead.counselorName || 'Unassigned',
    action: isConverted(lead) ? 'lead_converted' : 'lead_updated',
    details: `${lead.fname || ''} ${lead.lname || ''} - ${lead.service_interest || 'Lead'}`.trim(),
    outcome: isConverted(lead) ? 'success' : 'pending',
    duration: 0,
    priority: lead.priority || 'medium',
    category: isConverted(lead) ? 'conversion' : 'lead'
  }));

  const revenue = leads.filter((lead: any) => Number(lead.payTotal || 0) > 0).map((lead: any) => ({
    date: new Date(lead.created || lead.regdate).toLocaleDateString(),
    counselorId: Number(lead.assignTo || 0),
    counselorName: lead.counselorName || 'Unassigned',
    amount: Number(lead.payTotal || 0),
    source: lead.market_source || 'Unknown',
    type: lead.service_interest || 'Lead'
  }));

  const dailyMap: Record<string, { date: string; activities: number; conversions: number; revenue: number }> = {};
  leads.forEach((lead: any) => {
    const date = new Date(lead.created || lead.regdate).toISOString().split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = { date, activities: 0, conversions: 0, revenue: 0 };
    dailyMap[date].activities += 1;
    dailyMap[date].conversions += isConverted(lead) ? 1 : 0;
    dailyMap[date].revenue += Number(lead.payTotal || 0);
  });

  const monthlyMap: Record<string, { month: string; activities: number; conversions: number; revenue: number }> = {};
  Object.values(dailyMap).forEach(day => {
    const month = new Date(day.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    if (!monthlyMap[month]) monthlyMap[month] = { month, activities: 0, conversions: 0, revenue: 0 };
    monthlyMap[month].activities += day.activities;
    monthlyMap[month].conversions += day.conversions;
    monthlyMap[month].revenue += day.revenue;
  });

  const totalLeads = leads.length;
  const totalConverted = leads.filter(isConverted).length;
  const totalRevenue = leads.reduce((sum: number, lead: any) => sum + Number(lead.payTotal || 0), 0);

  return {
    summary: {
      totalActivities: totalLeads,
      totalCounselors: employees.length,
      totalRevenue,
      avgConversionRate: totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0,
      avgResponseTime: 0,
      period: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      generatedAt: new Date().toISOString()
    },
    performance,
    activities,
    revenue,
    trends: {
      daily: Object.values(dailyMap),
      weekly: [],
      monthly: Object.values(monthlyMap)
    },
    issues: performance
      .filter((item: any) => item.totalLeads > 0 && item.conversionRate < 25)
      .map((item: any) => ({
        type: 'Performance',
        counselor: item.name,
        description: 'Low lead conversion rate from live lead data',
        severity: 'Medium',
        count: item.totalLeads - item.convertedLeads,
        impact: 'Review follow-up and qualification process'
      })),
    recommendations: [
      {
        category: 'Leads',
        title: 'Review Lead Follow Up',
        description: 'Use live lead status and conversion data to prioritize pending leads.',
        priority: 'High',
        impact: 'Improves conversion visibility and operations handoff',
        actionItems: ['Review pending leads', 'Follow up inactive leads', 'Move won clients into operations modules']
      }
    ]
  };
};

const generateCSVReport = (data: ReportData): string => {
  const headers = ['Date', 'Counselor', 'Action', 'Details', 'Outcome', 'Duration (s)', 'Priority', 'Category'];
  const rows = data.activities.map(activity => [
    activity.date,
    activity.counselorName,
    activity.action,
    activity.details,
    activity.outcome,
    (activity.duration / 1000).toFixed(2),
    activity.priority,
    activity.category
  ]);

  return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
};

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['reports.view']);
  if (isAuthError(auth)) return auth;

  try {
    const body: ReportRequest = await request.json();
    
    // Validate request
    if (!body.config) {
      return NextResponse.json(
        { error: 'Report configuration is required' },
        { status: 400 }
      );
    }

    // Generate report data from live lead records
    const reportData = await generateLiveReportData(body, auth);
    
    // Generate report based on format
    let content = '';
    let contentType = 'application/json';
    let filename = '';

    // 'excel' and 'pdf' used to be offered here but both just returned
    // JSON.stringify() text mislabeled with an .xlsx/.pdf filename and a
    // spreadsheet/PDF content-type - Excel/Acrobat would refuse to open the
    // resulting "export" or show a format-mismatch warning. Removed rather
    // than left broken; CSV and JSON are the two formats that actually work.
    switch (body.config.format) {
      case 'csv':
        content = generateCSVReport(reportData);
        contentType = 'text/csv';
        filename = `${body.config.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
      default:
        content = JSON.stringify({
          config: body.config,
          data: reportData,
          generatedAt: new Date().toISOString()
        }, null, 2);
        contentType = 'application/json';
        filename = `${body.config.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    // Create response
    const response = new NextResponse(content);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return response;
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['reports.view']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        // Return available report templates
        const templates = [
          {
            id: 'weekly-performance',
            name: 'Weekly Performance Report',
            description: 'Comprehensive weekly performance analysis',
            period: 'weekly',
            sections: {
              summary: true,
              performance: true,
              activities: true,
              revenue: true,
              issues: true,
              trends: true,
              recommendations: true
            }
          },
          {
            id: 'monthly-performance',
            name: 'Monthly Performance Report',
            description: 'Detailed monthly performance analysis',
            period: 'monthly',
            sections: {
              summary: true,
              performance: true,
              activities: false,
              revenue: true,
              issues: true,
              trends: true,
              recommendations: true
            }
          },
          {
            id: 'quarterly-summary',
            name: 'Quarterly Summary Report',
            description: 'Executive quarterly summary',
            period: 'quarterly',
            sections: {
              summary: true,
              performance: true,
              activities: false,
              revenue: true,
              issues: true,
              trends: true,
              recommendations: true
            }
          }
        ];
        
        return NextResponse.json({ templates });
      
      case 'preview':
        // Generate preview data from live leads
        const previewData = await generateLiveReportData({
          config: {
            // (auth-derived scoping applied inside generateLiveReportData)
            name: 'Preview Report',
            description: 'Preview report',
            period: 'weekly',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            counselors: [],
            includeCharts: true,
            includeDetails: true,
            includeTrends: true,
            format: 'json',
            sections: {
              summary: true,
              performance: true,
              activities: true,
              revenue: true,
              issues: true,
              trends: true,
              recommendations: true
            }
          }
        }, auth);

        return NextResponse.json({ data: previewData });
      
      default:
        return NextResponse.json({
          message: 'Available actions: templates, preview',
          description: 'Use ?action=templates or ?action=preview'
        });
    }
  } catch (error: any) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
