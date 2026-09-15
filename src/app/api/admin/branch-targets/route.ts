import { NextRequest, NextResponse } from 'next/server';
import { BranchTarget, CrmBranch } from '@/models';
import { apiError } from '@/lib/apiError';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const monthName = (month: number | null) => month ? new Date(2000, month - 1, 1).toLocaleString('en', { month: 'long' }) : '';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['branches.manage']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const branch = searchParams.get('branch');
    const where: Record<string, number> = {};
    if (year) where.year = Number(year);
    if (month) where.month = Number(month);
    if (branch) where.branch = Number(branch);

    const targets = await BranchTarget.findAll({ where, order: [['year', 'DESC'], ['month', 'DESC']] });
    const branchIds = [...new Set(targets.map((target) => target.getDataValue('branch')).filter((id): id is number => id !== null))];
    const branches = branchIds.length ? await CrmBranch.findAll({ where: { id: branchIds } }) : [];
    const branchNames = new Map(branches.map((item) => {
      const id = item.getDataValue('id');
      return [id, item.getDataValue('branch') || item.getDataValue('name') || `Branch ${id}`];
    }));

    return NextResponse.json({
      success: true,
      data: targets.map((target) => ({
        id: target.getDataValue('id'),
        branchId: target.getDataValue('branch') || 0,
        branchName: branchNames.get(target.getDataValue('branch') || 0) || `Branch ${target.getDataValue('branch') || ''}`,
        targetMonth: monthName(target.getDataValue('month')),
        targetYear: target.getDataValue('year') || 0,
        leadsTarget: target.getDataValue('leads') || 0,
        appointmentsTarget: target.getDataValue('appointment') || 0,
        revenueTarget: target.getDataValue('sales') || 0,
        conversionsTarget: 0,
        actualLeads: 0,
        actualAppointments: 0,
        actualRevenue: 0,
        actualConversions: 0,
        achievedLeads: 0,
        achievedAppointments: 0,
        achievedRevenue: 0,
        achievedConversions: 0,
        status: 'active',
        createdAt: '', updatedAt: '', managerId: 0, managerName: '',
      })),
    });
  } catch (error: unknown) {
    return apiError(error, 'Unable to load branch targets');
  }
}
