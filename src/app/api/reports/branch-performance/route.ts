import { NextRequest, NextResponse } from 'next/server';
import { CrmBranch, CrmcForumLeads, CrmEmployee, CrmRegion, CrmRole, BranchTarget } from '@/models';
import { Op, QueryTypes } from 'sequelize';
import { unstable_cache } from 'next/cache';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { CACHE_TAGS } from '@/lib/reportCache';

const toPlain = (row: any) => row?.get ? row.get({ plain: true }) : row;
const toPlainArray = (rows: any[]) => rows.map(toPlain);
const amount = (value: unknown) => Number(value || 0);
const labelFor = (map: Map<string, string>, value: unknown) => {
  const key = String(value || '').trim();
  if (!key) return '';
  return map.get(key) || key;
};

// Pulled out of the route handler so it can be wrapped in unstable_cache
// below - see src/app/api/admin/dashboard/route.ts's computeDashboardData
// for the full rationale.
async function computeBranchPerformanceData(
  isCeoFlag: boolean,
  leadScopeKind: 'all' | 'branch' | 'own',
  userBranch: number,
  userId: number,
  dateRangeKey: string,
  branchIdParam: string | null,
) {
    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (dateRangeKey) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // "Branch Performance" is inherently a cross-branch comparison view -
    // CEO sees every branch, everyone else (this only requires reports.view,
    // which most sales staff hold) is narrowed to just their own branch,
    // turning it into a single-branch scorecard rather than a company-wide
    // comparison of revenue/counselor counts they shouldn't see.
    const branchScopeWhere: any = {};
    if (!isCeoFlag && userBranch) {
      branchScopeWhere.id = userBranch;
    }

    // Fetch all branches
    const branchRows = await CrmBranch.findAll({
      where: branchScopeWhere,
      attributes: ['id', 'branch', 'region', 'status'],
      order: [['branch', 'ASC']]
    });
    const branches = toPlainArray(branchRows);

    // Fetch regions separately
    const regionRows = await CrmRegion.findAll({
      attributes: ['id', 'name']
    });
    const regions = toPlainArray(regionRows);
    
    const regionMap = new Map(regions.map(r => [r.id, r.name]));

    // Fetch leads data for the date range
    const leadsWhereClause: any = {
      regdate: {
        [Op.gte]: startDate
      }
    };

    if (branchIdParam) {
      leadsWhereClause.branch = parseInt(branchIdParam);
    }
    // Overrides whatever ?branchId= was requested - the raw `leads` array
    // below is a separate response field from the branch aggregates above
    // and needs its own scoping, not just the aggregate's.
    if (!isCeoFlag) {
      if (leadScopeKind === 'branch') {
        leadsWhereClause.branch = userBranch;
      } else {
        leadsWhereClause[Op.or] = [{ assignTo: userId }, { Counsilor: userId }];
      }
    }

    const leads = await CrmcForumLeads.findAll({
      where: leadsWhereClause,
      attributes: [
        'id', 'fname', 'mname', 'lname', 'email', 'phone', 'mobile',
        'nationality', 'address', 'dob', 'gender', 'id_number', 'id_expiry',
        'country_interest', 'service_interest', 'market_source', 'appointment',
        'followup', 'folowuptime', 'followupstat', 'enquiry', 'convet',
        'priority', 'status', 'regdate', 'assignTo', 'branch', 'region',
        'payTotal', 'paidYet', 'payBalance', 'demdRemark', 'opportunity_status'
      ],
      include: [
        {
          model: CrmEmployee,
          as: 'dmEmployeeByASSIGNTo',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: CrmEmployee,
          as: 'dmEmployeeByCoUNSILOR',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: CrmBranch,
          as: 'dmBranch',
          attributes: ['id', 'branch'],
          required: false
        }
      ]
    });
    const leadData = toPlainArray(leads);

    // Fetch all employees with their roles for counselor counts
    const employeeRows = await CrmEmployee.findAll({
      where: {
        status: 1 // Active employees
      },
      attributes: ['id', 'name', 'branch', 'role', 'status']
    });
    const employees = toPlainArray(employeeRows);

    // Fetch role names separately
    const roleRows = await CrmRole.findAll({
      attributes: ['id', 'name']
    });
    const roles = toPlainArray(roleRows);
    
    const roleMap = new Map(roles.map(r => [r.id, r.name]));
    const [countries, services, programTypes] = await Promise.all([
      sequelize.query<{ value: number | string; label: string }>(
        'SELECT id AS value, name AS label FROM crm_country_proces',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ value: number | string; label: string }>(
        'SELECT id AS value, name AS label FROM crm_service',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<{ value: number | string; label: string }>(
        'SELECT id AS value, type AS label FROM crm_program_type',
        { type: QueryTypes.SELECT }
      ),
    ]);
    const countryMap = new Map(countries.map(row => [String(row.value), row.label]));
    const serviceMap = new Map([
      ...services.map(row => [String(row.value), row.label] as const),
      ...programTypes.map(row => [String(row.value), row.label] as const),
    ]);

    // Real revenue targets from the same source /admin/branch-target manages
    // (BranchTarget/crm_branch_targets), summed across every month the
    // selected date range spans - this report used to fabricate a "target"
    // as 90% of the branch's own revenue, which made "Achievement Rate"
    // meaningless (a branch can't help but hit ~111% of 90% of itself).
    const periodMonths: Array<{ year: number; month: number }> = [];
    {
      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      while (cursor <= end) {
        periodMonths.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    const branchIdsForTargets = branches.map(b => b.id);
    const targetRows = branchIdsForTargets.length
      ? await BranchTarget.findAll({ where: { branch: { [Op.in]: branchIdsForTargets } } })
      : [];
    const targetsByBranch = new Map<number, number>();
    for (const row of toPlainArray(targetRows)) {
      const matchesPeriod = periodMonths.some(p => p.year === row.year && p.month === row.month);
      if (!matchesPeriod) continue;
      const branchIdKey = Number(row.branch);
      targetsByBranch.set(branchIdKey, (targetsByBranch.get(branchIdKey) || 0) + amount(row.sales));
    }

    // Calculate performance metrics for each branch
    const branchPerformance = branches.map(branch => {
      const branchLeads = leadData.filter(lead => lead.branch === branch.id);
      const branchEmployees = employees.filter(emp => emp.branch === branch.id);
      
      const totalLeads = branchLeads.length;
      const convertedLeads = branchLeads.filter(lead => {
        const status = String(lead.status || '').toLowerCase();
        return ['converted', 'retained', 'client'].includes(status) || String((lead as any).opportunity_status || '').toLowerCase() === 'won';
      }).length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      const totalRevenue = branchLeads.reduce((sum, lead) => sum + amount(lead.payTotal), 0);
      const paidAmount = branchLeads.reduce((sum, lead) => sum + amount(lead.paidYet), 0);
      const pendingRevenue = totalRevenue - paidAmount;
      
      // Real target set via /admin/branch-target (BranchTarget model) for
      // whichever months this date range spans - 0 if nobody has set one
      // for this branch/period yet, rather than a number derived from the
      // branch's own revenue.
      const target = targetsByBranch.get(branch.id) || 0;
      const achievementRate = target > 0 ? (totalRevenue / target) * 100 : 0;
      
      // Count counselors based on role names
      const totalCounselors = branchEmployees.filter(emp => {
        const roleName = emp.role ? roleMap.get(emp.role)?.toLowerCase() || '' : '';
        return roleName.includes('counselor') || roleName.includes('consultant') || roleName.includes('advisor');
      }).length;
      
      const activeCounselors = branchEmployees.filter(emp => {
        const roleName = emp.role ? roleMap.get(emp.role)?.toLowerCase() || '' : '';
        return (roleName.includes('counselor') || roleName.includes('consultant') || roleName.includes('advisor')) && emp.status === 1;
      }).length;

      return {
        id: branch.id,
        name: branch.branch,
        region: regionMap.get(branch.region) || 'Unknown',
        totalLeads,
        convertedLeads,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        revenue: totalRevenue,
        target,
        achievementRate: parseFloat(achievementRate.toFixed(1)),
        counselors: totalCounselors,
        activeCounselors,
        branchData: branch
      };
    });

    // Calculate overall statistics
    const totalBranches = branchPerformance.length;
    const totalLeadsAll = branchPerformance.reduce((sum, b) => sum + b.totalLeads, 0);
    const totalConvertedAll = branchPerformance.reduce((sum, b) => sum + b.convertedLeads, 0);
    const avgConversionRate = totalLeadsAll > 0 ? (totalConvertedAll / totalLeadsAll) * 100 : 0;
    const totalRevenueAll = branchPerformance.reduce((sum, b) => sum + b.revenue, 0);
    const totalActiveCounselors = branchPerformance.reduce((sum, b) => sum + b.activeCounselors, 0);

    const statistics = {
      totalBranches,
      totalLeads: totalLeadsAll,
      totalConverted: totalConvertedAll,
      avgConversionRate: parseFloat(avgConversionRate.toFixed(1)),
      totalRevenue: totalRevenueAll,
      totalActiveCounselors
    };

    return {
      branches: branchPerformance,
      statistics,
      leads: leadData.map(lead => ({
        id: lead.id,
        fname: lead.fname,
        mname: lead.mname,
        lname: lead.lname,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        nationality: lead.nationality,
        address: lead.address,
        dob: lead.dob,
        gender: lead.gender,
        id_number: lead.id_number,
        id_expiry: lead.id_expiry,
        country_interest: lead.country_interest,
        service_interest: lead.service_interest,
        market_source: lead.market_source,
        appointment: lead.appointment,
        followup: lead.followup,
        folowuptime: lead.folowuptime,
        followupstat: lead.followupstat,
        enquiry: lead.enquiry,
        convet: lead.convet,
        priority: lead.priority,
        status: lead.status,
        regdate: lead.regdate,
        assignTo: lead.assignTo,
        branch: lead.branch,
        region: lead.region,
        payTotal: lead.payTotal,
        paidYet: lead.paidYet,
        payBalance: lead.payBalance,
        lead_remark: lead.demdRemark,
        created: lead.regdate,
        lead_quality: lead.priority,
        country_interest_label: labelFor(countryMap, lead.country_interest),
        service_interest_label: labelFor(serviceMap, lead.service_interest),
        dmEmployeeByASSIGNTo: lead.dmEmployeeByASSIGNTo ? {
          id: lead.dmEmployeeByASSIGNTo.id,
          name: lead.dmEmployeeByASSIGNTo.name
        } : null,
        dmEmployeeByCoUNSILOR: lead.dmEmployeeByCoUNSILOR ? {
          id: lead.dmEmployeeByCoUNSILOR.id,
          name: lead.dmEmployeeByCoUNSILOR.name
        } : null,
        dmBranch: lead.branch ? {
          id: lead.branch,
          name: branches.find(b => b.id === lead.branch)?.branch || 'Unknown'
        } : null
      }))
    };
}

const getCachedBranchPerformanceData = unstable_cache(
  computeBranchPerformanceData,
  ['reports-branch-performance'],
  { tags: [CACHE_TAGS.leads, CACHE_TAGS.employees, CACHE_TAGS.targets], revalidate: 60 },
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['reports.view']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'month';
    const branchId = searchParams.get('branchId');

    const isCeoFlag = isCeo(auth);
    const leadScopeKind: 'all' | 'branch' | 'own' = isCeoFlag
      ? 'all'
      : isBranchManagerOrCeo(auth)
        ? 'branch'
        : 'own';

    const data = await getCachedBranchPerformanceData(
      isCeoFlag,
      leadScopeKind,
      Number(auth.branch || 0),
      Number(auth.id),
      dateRange,
      branchId,
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching branch performance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
