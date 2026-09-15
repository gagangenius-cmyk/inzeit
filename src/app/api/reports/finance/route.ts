import { NextRequest, NextResponse } from 'next/server';
import { CrmcForumLeadsContracts, CrmcForumLeads, CrmPayHistory, Crm3partyPayment, CrmEmployee, CrmBranch, CrmVendors } from '@/models';
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
// below. scopeKind/scopeBranchOrUserId together replicate the exact
// role-scope leadScopeWhere used to compute; kept as primitives (not the
// auth object) so unstable_cache's argument-based cache key stays stable.
async function computeFinanceData(
  scopeKind: 'all' | 'branch' | 'own',
  scopeBranchOrUserId: number,
  dateRangeKey: string,
  verificationStatus: string | null,
  paymentStatus: string | null,
) {
    // Calculate date range - previously computed but never actually applied
    // to any query below, so every dateRange selection ('week'/'month'/
    // 'quarter'/'year') silently returned the exact same all-time,
    // unbounded result. Now applied to the leads query via regdate, which
    // (since contracts/payments are scoped to these same lead ids) bounds
    // the whole report by the selected period instead of ever-growing
    // unbounded.
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

    // Build where clause for contracts
    const contractsWhereClause: any = {};

    if (verificationStatus) {
      contractsWhereClause.verify = parseInt(verificationStatus);
    }

    if (paymentStatus) {
      contractsWhereClause.payment_status = parseInt(paymentStatus);
    }

    // CEO sees every lead's financials; Branch Manager only their own
    // branch's; everyone else (a counselor with reports.view) only leads
    // they own. Resolved as a lead-where-clause first, then propagated as a
    // leadId IN (...) filter to contracts/payment history/third-party
    // payments below, since those don't carry branch/owner columns of their
    // own - only the lead they're tied to does.
    const leadScopeWhere: any = { regdate: { [Op.gte]: startDate } };
    if (scopeKind === 'branch') {
      leadScopeWhere.branch = scopeBranchOrUserId;
    } else if (scopeKind === 'own') {
      leadScopeWhere[Op.or] = [{ assignTo: scopeBranchOrUserId }, { Counsilor: scopeBranchOrUserId }];
    }

    // Fetch all leads separately
    const leadRows = await CrmcForumLeads.findAll({
      where: leadScopeWhere,
      attributes: ['id', 'fname', 'lname', 'email', 'phone', 'country_interest', 'service_interest', 'payTotal', 'payBalance', 'paidYet', 'regdate', 'branch', 'region']
    });
    const leads = toPlainArray(leadRows);
    const scopedLeadIds = leads.map((l) => l.id);
    const leadIdScope = scopeKind === 'all' ? {} : { leadId: { [Op.in]: scopedLeadIds.length ? scopedLeadIds : [-1] } };

    // Fetch contracts with leads data
    const contractRows = await CrmcForumLeadsContracts.findAll({
      where: { ...contractsWhereClause, ...leadIdScope },
      attributes: [
        'id', 'leadId', 'contract', 'unsigned_contract', 'new_contract',
        'ar_contract', 'garys', 'verify', 'remarks', 'verify_by',
        'verify_date', 'batch_id', 'wp_batch_id', 'vendor_id', 'payment_status'
      ],
      order: [['id', 'DESC']]
    });
    const contracts = toPlainArray(contractRows);

    // Fetch payment history for all leads
    const paymentHistoryRows = await CrmPayHistory.findAll({
      where: leadIdScope,
      attributes: [
        'id', 'leadId', 'amount', 'counselor_receipt', 'date', 'payMethod',
        'payBalance', 'tax', 'payCategory', 'payment_remarks', 'status',
        'remark', 'canDate', 'thirdPartyAmt', 'dmAmt', 'dmTax',
        'dmRefundAmt', 'curValue', 'refNumber', 'created_by', 'stage'
      ],
      order: [['date', 'DESC']]
    });
    const paymentHistory = toPlainArray(paymentHistoryRows);

    // Fetch 3rd party payments
    const thirdPartyPaymentRows = await Crm3partyPayment.findAll({
      where: leadIdScope,
      attributes: [
        'id', 'leadId', 'date', 'currency_id', 'amount', 'Tax', 'payMethod',
        'emp_id', 'receipt_date', 'cc_number', 'receipt', 'counselor_receipt',
        'trans_or_ref_number', 'remarks'
      ],
      order: [['date', 'DESC']]
    });
    const thirdPartyPayments = toPlainArray(thirdPartyPaymentRows);

    // Fetch employees and branches for mapping
    const employees = await CrmEmployee.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 }
    });

    const branches = await CrmBranch.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 }
    });

    const vendors = await CrmVendors.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 }
    });
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

    const employeeMap = new Map(toPlainArray(employees).map(e => [e.id, e.name]));
    const branchMap = new Map(toPlainArray(branches).map(b => [b.id, b.name]));
    const vendorMap = new Map(toPlainArray(vendors).map(v => [v.id, v.name]));
    const countryMap = new Map(countries.map(row => [String(row.value), row.label]));
    const serviceMap = new Map([
      ...services.map(row => [String(row.value), row.label] as const),
      ...programTypes.map(row => [String(row.value), row.label] as const),
    ]);
    const leadMap = new Map(leads.map(l => [l.id, l]));

    // Calculate comprehensive statistics
    const totalContracts = contracts.length;
    const verifiedContracts = contracts.filter(c => c.verify === 1).length;
    const pendingContracts = contracts.filter(c => c.verify === 0).length;
    const rejectedContracts = contracts.filter(c => c.verify === 2).length;

    // Calculate financial metrics from contracts
    const contractsWithLeads = contracts.filter(c => leadMap.has(c.leadId));
    const totalContractValue = contractsWithLeads.reduce((sum, contract) => {
      const lead = leadMap.get(contract.leadId);
      return sum + amount(lead?.payTotal);
    }, 0);
    
    const totalPaidFromContracts = contractsWithLeads.reduce((sum, contract) => {
      const lead = leadMap.get(contract.leadId);
      return sum + amount(lead?.paidYet);
    }, 0);
    
    const totalBalanceFromContracts = contractsWithLeads.reduce((sum, contract) => {
      const lead = leadMap.get(contract.leadId);
      return sum + amount(lead?.payBalance);
    }, 0);

    // Calculate payment history metrics
    const totalPaymentHistory = paymentHistory.reduce((sum, payment) => sum + amount(payment.amount), 0);
    const totalThirdPartyPayments = thirdPartyPayments.reduce((sum, payment) => sum + amount(payment.amount), 0);
    const totalTaxCollected = paymentHistory.reduce((sum, payment) => sum + amount(payment.tax), 0);
    const totalThirdPartyTax = thirdPartyPayments.reduce((sum, payment) => sum + amount(payment.Tax), 0);

    // Combined financial metrics
    const totalRevenue = totalContractValue;
    const totalPaid = totalPaidFromContracts + totalPaymentHistory + totalThirdPartyPayments;
    const pendingRevenue = totalRevenue - totalPaid;
    const totalTaxes = totalTaxCollected + totalThirdPartyTax;

    // Verification rate
    const verificationRate = totalContracts > 0 ? (verifiedContracts / totalContracts) * 100 : 0;

    // Group contracts by status
    const contractsByStatus = [
      {
        status: 'Verified',
        count: verifiedContracts,
        value: contracts.filter(c => c.verify === 1).reduce((sum, c) => {
          const lead = leadMap.get(c.leadId);
          return sum + amount(lead?.payTotal);
        }, 0)
      },
      {
        status: 'Pending',
        count: pendingContracts,
        value: contracts.filter(c => c.verify === 0).reduce((sum, c) => {
          const lead = leadMap.get(c.leadId);
          return sum + amount(lead?.payTotal);
        }, 0)
      },
      {
        status: 'Rejected',
        count: rejectedContracts,
        value: contracts.filter(c => c.verify === 2).reduce((sum, c) => {
          const lead = leadMap.get(c.leadId);
          return sum + amount(lead?.payTotal);
        }, 0)
      }
    ];

    const monthlyMap = contractsWithLeads.reduce((acc, contract) => {
      const lead = leadMap.get(contract.leadId);
      const date = new Date(contract.verify_date || new Date());
      const month = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!acc[month]) acc[month] = { month, contracts: 0, value: 0 };
      acc[month].contracts += 1;
      acc[month].value += amount(lead?.payTotal);
      return acc;
    }, {} as Record<string, { month: string; contracts: number; value: number }>);

    const monthlyContracts = Object.values(monthlyMap).slice(-6);

    // Top vendors (based on contract count)
    const vendorCounts = contracts.reduce((acc, contract) => {
      const vendorId = contract.vendor_id;
      acc[vendorId] = (acc[vendorId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topVendors = (Object.entries(vendorCounts) as Array<[string, number]>)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([vendorId, count]) => ({
        vendor: vendorMap.get(Number(vendorId)) || 'Unassigned',
        contracts: count
      }));

    // Payment method analysis
    const paymentMethods = paymentHistory.reduce((acc, payment) => {
      const method = payment.payMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + amount(payment.amount);
      return acc;
    }, {} as Record<string, number>);

    const thirdPartyPaymentMethods = thirdPartyPayments.reduce((acc, payment) => {
      const method = payment.payMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + amount(payment.amount);
      return acc;
    }, {} as Record<string, number>);

    // Branch-wise financial data
    const branchFinancials = contractsWithLeads.reduce((acc, contract) => {
      const lead = leadMap.get(contract.leadId);
      const branchId = lead?.branch;
      if (branchId) {
        if (!acc[branchId]) {
          acc[branchId] = {
            branchName: branchMap.get(branchId) || `Branch ${branchId}`,
            contracts: 0,
            totalValue: 0,
            paidAmount: 0,
            balance: 0
          };
        }
        acc[branchId].contracts += 1;
        acc[branchId].totalValue += amount(lead?.payTotal);
        acc[branchId].paidAmount += amount(lead?.paidYet);
        acc[branchId].balance += amount(lead?.payBalance);
      }
      return acc;
    }, {} as Record<number, any>);

    const statistics = {
      totalContracts,
      verifiedContracts,
      pendingContracts,
      rejectedContracts,
      totalValue: totalRevenue,
      paidValue: totalPaid,
      pendingValue: pendingRevenue,
      verificationRate,
      totalPaymentHistory,
      totalThirdPartyPayments,
      totalTaxes,
      contractsByStatus,
      monthlyContracts,
      topVendors,
      paymentMethods,
      thirdPartyPaymentMethods,
      branchFinancials: Object.values(branchFinancials)
    };

    // Format contracts data for frontend
    const formattedContracts = contracts.map(contract => {
      const lead = leadMap.get(contract.leadId);
      return {
        id: contract.id,
        leadId: contract.leadId,
        contract: contract.contract,
        unsigned_contract: contract.unsigned_contract,
        new_contract: contract.new_contract,
        ar_contract: contract.ar_contract,
        garys: contract.garys,
        verify: contract.verify,
        remarks: contract.remarks,
        verify_by: contract.verify_by,
        verify_date: contract.verify_date,
        batch_id: contract.batch_id,
        wp_batch_id: contract.wp_batch_id,
        vendor_id: contract.vendor_id,
        vendor_name: vendorMap.get(Number(contract.vendor_id)) || null,
        employer_id: null,
        old_crm_ag_id: contract.old_crm_ag_id,
        payment_status: contract.payment_status,
        dmcForumLeads: lead ? {
          id: lead.id,
          fname: lead.fname,
          lname: lead.lname,
          email: lead.email,
          phone: lead.phone,
          country_interest: lead.country_interest,
          country_interest_label: labelFor(countryMap, lead.country_interest),
          service_interest: lead.service_interest,
          service_interest_label: labelFor(serviceMap, lead.service_interest),
          payTotal: lead.payTotal,
          payBalance: lead.payBalance,
          regdate: lead.regdate,
          branch: lead.branch,
          region: lead.region
        } : null,
        // Add payment summary
        paymentSummary: {
          totalPaid: paymentHistory
            .filter(p => p.leadId === contract.leadId)
            .reduce((sum, p) => sum + amount(p.amount), 0),
          thirdPartyPaid: thirdPartyPayments
            .filter(p => p.leadId === contract.leadId)
            .reduce((sum, p) => sum + amount(p.amount), 0),
          totalPayments: 0
        }
      };
    });

    // Calculate total payments for each contract
    formattedContracts.forEach(contract => {
      contract.paymentSummary.totalPayments = 
        contract.paymentSummary.totalPaid + contract.paymentSummary.thirdPartyPaid;
    });

    return {
      contracts: formattedContracts,
      statistics,
      paymentHistory: paymentHistory.map(p => {
        const lead = leadMap.get(p.leadId);
        return {
          id: p.id,
          leadId: p.leadId,
          amount: p.amount,
          date: p.date,
          payMethod: p.payMethod,
          payCategory: p.payCategory,
          status: p.status,
          thirdPartyAmt: p.thirdPartyAmt,
          dmAmt: p.dmAmt,
          tax: p.tax,
          dmcForumLeads: lead ? {
            id: lead.id,
            fname: lead.fname,
            lname: lead.lname,
            email: lead.email
          } : null
        };
      }),
      thirdPartyPayments: thirdPartyPayments.map(p => {
        const lead = leadMap.get(p.leadId);
        return {
          id: p.id,
          leadId: p.leadId,
          amount: p.amount,
          date: p.date,
          payMethod: p.payMethod,
          Tax: p.Tax,
          receipt: p.receipt,
          trans_or_ref_number: p.trans_or_ref_number,
          dmcForumLeads: lead ? {
            id: lead.id,
            fname: lead.fname,
            lname: lead.lname,
            email: lead.email
          } : null
        };
      })
    };
}

const getCachedFinanceData = unstable_cache(
  computeFinanceData,
  ['reports-finance'],
  { tags: [CACHE_TAGS.leads, CACHE_TAGS.payments], revalidate: 60 },
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['reports.view', 'finance.view']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'month';
    const verificationStatus = searchParams.get('verificationStatus');
    const paymentStatus = searchParams.get('paymentStatus');

    const scopeKind: 'all' | 'branch' | 'own' = isCeo(auth)
      ? 'all'
      : isBranchManagerOrCeo(auth)
        ? 'branch'
        : 'own';
    const scopeBranchOrUserId = scopeKind === 'branch' ? Number(auth.branch || 0) : Number(auth.id);

    const data = await getCachedFinanceData(scopeKind, scopeBranchOrUserId, dateRange, verificationStatus, paymentStatus);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
