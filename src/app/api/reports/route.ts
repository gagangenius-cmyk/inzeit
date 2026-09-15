import { NextRequest, NextResponse } from 'next/server'
import {
  CrmcForumLeads,
  Appointments,
  Crm3partyPayment,
  CrmEmployee,
  CrmBranch,
  CrmRegion
} from '@/models'
import { Op, QueryTypes } from 'sequelize'
import { unstable_cache } from 'next/cache'
import { sequelize } from '@/lib/sequelize'
import { requireAuth, isAuthError } from '@/lib/apiAuth'
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks'
import { CACHE_TAGS } from '@/lib/reportCache'

const toPlain = (row: any) => row?.get ? row.get({ plain: true }) : row
const numericValue = (value: unknown) => Number(value || 0)
const labelFor = (map: Map<string, string>, value: unknown) => {
  const key = String(value || '').trim()
  if (!key) return ''
  return map.get(key) || key
}

const convertedStatuses = ['Converted', 'converted', 'retained', 'Retained', 'client', 'Client']
const newStatuses = ['New', 'new']

// Pulled out of the route handler so it can be wrapped in unstable_cache
// below - see src/app/api/admin/dashboard/route.ts's computeDashboardData
// for the full rationale. Takes plain primitives rather than pre-built
// Sequelize where-objects (which carry Op symbols that don't serialize
// predictably into unstable_cache's argument-based cache key) and rebuilds
// the conditions internally. Returns null for an unrecognized reportType
// instead of returning a NextResponse directly, since this function no
// longer has access to NextResponse.json inside a cache boundary.
async function computeReportData(
  reportType: string,
  startDate: string | null,
  endDate: string | null,
  resolvedBranch: number | null,
  resolvedRegion: number | null,
  resolvedEmployee: number | null,
  resolvedCounselorId: number | null,
  resolvedEmpId: number | null,
): Promise<Record<string, unknown> | null> {
    const dateCondition = startDate && endDate
      ? { created: { [Op.between]: [startDate, endDate] } }
      : {}
    const branchCondition = resolvedBranch !== null ? { branch: resolvedBranch } : {}
    const regionCondition = resolvedRegion !== null ? { region: resolvedRegion } : {}
    const employeeCondition = resolvedEmployee !== null ? { assignTo: resolvedEmployee } : {}
    const ownCounselorCondition = resolvedCounselorId !== null ? { counsilorid: resolvedCounselorId } : {}
    const ownEmpCondition = resolvedEmpId !== null ? { emp_id: resolvedEmpId } : {}
    const leadBaseWhere = { ...dateCondition, ...branchCondition, ...regionCondition, ...employeeCondition }

    let reportData: Record<string, unknown> | null = {}

    switch (reportType) {
      case 'leads':
        const [totalLeads, newLeads, convertedLeads] = await Promise.all([
          CrmcForumLeads.count({
            where: leadBaseWhere
          }),
          CrmcForumLeads.count({
            where: {
              ...leadBaseWhere,
              status: { [Op.in]: newStatuses }
            }
          }),
          CrmcForumLeads.count({
            where: {
              ...leadBaseWhere,
              [Op.or]: [
                { status: { [Op.in]: convertedStatuses } },
                { opportunity_status: 'won' }
              ]
            }
          })
        ])

        const [activeLeads, totalRevenue, pendingRevenue, recentLeads, countries, services, programTypes] = await Promise.all([
          CrmcForumLeads.count({
            where: {
              ...leadBaseWhere,
              status: { [Op.notIn]: [...newStatuses, ...convertedStatuses] }
            }
          }),
          CrmcForumLeads.sum('payTotal', { where: leadBaseWhere }),
          CrmcForumLeads.sum('payBalance', { where: leadBaseWhere }),
          CrmcForumLeads.findAll({
            where: leadBaseWhere,
            attributes: ['id', 'fname', 'lname', 'email', 'phone', 'country_interest', 'service_interest', 'status', 'opportunity_status', 'priority', 'regdate', 'payTotal', 'payBalance'],
            order: [['created', 'DESC']],
            limit: 10
          }),
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
          )
        ])
        const countryMap = new Map(countries.map((row) => [String(row.value), row.label]))
        const serviceMap = new Map([
          ...services.map((row) => [String(row.value), row.label] as const),
          ...programTypes.map((row) => [String(row.value), row.label] as const)
        ])
        const decoratedRecentLeads = recentLeads.map((lead) => {
          const item = toPlain(lead)
          return {
            ...item,
            country_interest_label: labelFor(countryMap, item.country_interest),
            service_interest_label: labelFor(serviceMap, item.service_interest)
          }
        })

        // Same scope as leadBaseWhere above, rebuilt as raw SQL for the
        // GROUP BY aggregates below - src/app/admin/reports/lead-status
        // used to fetch up to 10,000 full lead rows to the browser
        // (`/api/leads?limit=10000`) just to reduce() these three
        // breakdowns client-side; computed here as real SQL aggregates
        // instead, and that page now calls this endpoint.
        const rawConds: string[] = []
        const rawRep: Record<string, unknown> = {}
        if (startDate && endDate) { rawConds.push('l.created BETWEEN :startDate AND :endDate'); rawRep.startDate = startDate; rawRep.endDate = endDate }
        if (resolvedBranch !== null) { rawConds.push('l.branch = :branch'); rawRep.branch = resolvedBranch }
        if (resolvedRegion !== null) { rawConds.push('l.region = :region'); rawRep.region = resolvedRegion }
        if (resolvedEmployee !== null) { rawConds.push('l.assignTo = :employee'); rawRep.employee = resolvedEmployee }
        const rawWhere = rawConds.length ? `WHERE ${rawConds.join(' AND ')}` : ''

        const [topCountriesRows, topServicesRows, monthlyTrendRows] = await Promise.all([
          sequelize.query<{ label: string; count: number }>(
            `SELECT COALESCE(cp.name, l.country_interest, 'Unknown') AS label, COUNT(*) AS count
             FROM crm_forum_leads l
             LEFT JOIN crm_country_proces cp ON cp.id = CAST(l.country_interest AS UNSIGNED)
             ${rawWhere}
             GROUP BY COALESCE(cp.name, l.country_interest, 'Unknown')
             ORDER BY count DESC LIMIT 5`,
            { replacements: rawRep, type: QueryTypes.SELECT }
          ),
          sequelize.query<{ label: string; count: number }>(
            `SELECT COALESCE(sv.name, l.service_interest, 'Unknown') AS label, COUNT(*) AS count
             FROM crm_forum_leads l
             LEFT JOIN crm_service sv ON sv.id = CAST(l.service_interest AS UNSIGNED)
             ${rawWhere}
             GROUP BY COALESCE(sv.name, l.service_interest, 'Unknown')
             ORDER BY count DESC LIMIT 5`,
            { replacements: rawRep, type: QueryTypes.SELECT }
          ),
          sequelize.query<{ month: string; leads: number; revenue: number }>(
            `SELECT DATE_FORMAT(l.regdate, '%b %y') AS month, COUNT(*) AS leads, COALESCE(SUM(l.payTotal),0) AS revenue
             FROM crm_forum_leads l
             ${rawWhere}
             GROUP BY DATE_FORMAT(l.regdate, '%Y-%m'), DATE_FORMAT(l.regdate, '%b %y')
             ORDER BY DATE_FORMAT(l.regdate, '%Y-%m') DESC LIMIT 6`,
            { replacements: rawRep, type: QueryTypes.SELECT }
          ),
        ])

        reportData = {
          totalLeads,
          newLeads,
          convertedLeads,
          activeLeads,
          totalRevenue: numericValue(totalRevenue),
          pendingRevenue: numericValue(pendingRevenue),
          recentLeads: decoratedRecentLeads,
          conversionRate: totalLeads > 0 ? Number((convertedLeads / totalLeads * 100).toFixed(2)) : 0,
          topCountries: topCountriesRows.map((r) => ({ country: r.label, count: numericValue(r.count) })),
          topServices: topServicesRows.map((r) => ({ service: r.label, count: numericValue(r.count) })),
          monthlyTrends: monthlyTrendRows.map((r) => ({ month: r.month, leads: numericValue(r.leads), revenue: numericValue(r.revenue) })).reverse(),
        }
        break

      // Previously src/app/admin/reports/lead-conversion-funnel fetched
      // `/api/leads?limit=500` and reduce()d these 4 stage counts
      // client-side, silently computing an incomplete funnel (with no
      // indication to the viewer) the moment total leads passed 500. Real
      // SQL aggregate instead, same scope as every other case here.
      case 'funnel': {
        const conds: string[] = []
        const rep: Record<string, unknown> = {}
        if (startDate && endDate) { conds.push('created BETWEEN :startDate AND :endDate'); rep.startDate = startDate; rep.endDate = endDate }
        if (resolvedBranch !== null) { conds.push('branch = :branch'); rep.branch = resolvedBranch }
        if (resolvedRegion !== null) { conds.push('region = :region'); rep.region = resolvedRegion }
        if (resolvedEmployee !== null) { conds.push('assignTo = :employee'); rep.employee = resolvedEmployee }
        const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

        const [funnelRow] = await sequelize.query<{ total: number; contacted: number; qualified: number; converted: number }>(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN LOWER(COALESCE(status,'')) NOT IN ('new','not_answered') THEN 1 ELSE 0 END) AS contacted,
             SUM(CASE WHEN LOWER(COALESCE(status,'')) IN ('qualified','prospect','converted','retained','client') THEN 1 ELSE 0 END) AS qualified,
             SUM(CASE WHEN LOWER(COALESCE(status,'')) IN ('converted','retained','client') OR LOWER(COALESCE(opportunity_status,'')) = 'won' THEN 1 ELSE 0 END) AS converted
           FROM crm_forum_leads
           ${where}`,
          { replacements: rep, type: QueryTypes.SELECT }
        )
        const funnelTotal = numericValue(funnelRow?.total) || 1
        const contacted = numericValue(funnelRow?.contacted)
        const qualified = numericValue(funnelRow?.qualified)
        const converted = numericValue(funnelRow?.converted)
        reportData = {
          stages: [
            { label: 'Total Leads', count: numericValue(funnelRow?.total), rate: 100 },
            { label: 'Contacted', count: contacted, rate: contacted / funnelTotal * 100 },
            { label: 'Qualified / Prospect', count: qualified, rate: qualified / funnelTotal * 100 },
            { label: 'Converted', count: converted, rate: converted / funnelTotal * 100 },
          ]
        }
        break
      }

      // Previously src/app/admin/reports/lead-aging fetched
      // `/api/leads?limit=500` and computed age buckets + the "20 oldest"
      // list client-side from that same capped 500-row set - both silently
      // wrong (missing older leads that didn't make the first 500) once the
      // table grew past it. Real SQL aggregate + ORDER BY instead.
      case 'aging': {
        const conds: string[] = []
        const rep: Record<string, unknown> = {}
        if (startDate && endDate) { conds.push('l.created BETWEEN :startDate AND :endDate'); rep.startDate = startDate; rep.endDate = endDate }
        if (resolvedBranch !== null) { conds.push('l.branch = :branch'); rep.branch = resolvedBranch }
        if (resolvedRegion !== null) { conds.push('l.region = :region'); rep.region = resolvedRegion }
        if (resolvedEmployee !== null) { conds.push('l.assignTo = :employee'); rep.employee = resolvedEmployee }
        const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

        const [bucketRow] = await sequelize.query<{ b0_7: number; b8_30: number; b31_60: number; b60plus: number }>(
          `SELECT
             SUM(CASE WHEN DATEDIFF(NOW(), COALESCE(l.created, l.regdate)) <= 7 THEN 1 ELSE 0 END) AS b0_7,
             SUM(CASE WHEN DATEDIFF(NOW(), COALESCE(l.created, l.regdate)) BETWEEN 8 AND 30 THEN 1 ELSE 0 END) AS b8_30,
             SUM(CASE WHEN DATEDIFF(NOW(), COALESCE(l.created, l.regdate)) BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS b31_60,
             SUM(CASE WHEN DATEDIFF(NOW(), COALESCE(l.created, l.regdate)) > 60 THEN 1 ELSE 0 END) AS b60plus
           FROM crm_forum_leads l
           ${where}`,
          { replacements: rep, type: QueryTypes.SELECT }
        )

        const oldestLeadsRows = await sequelize.query<{
          id: number; fname: string; lname: string; status: string; created: string; regdate: string;
          assigned_to_name: string; age: number;
        }>(
          `SELECT l.id, l.fname, l.lname, l.status, l.created, l.regdate,
             COALESCE(e.name, 'Unassigned') AS assigned_to_name,
             DATEDIFF(NOW(), COALESCE(l.created, l.regdate)) AS age
           FROM crm_forum_leads l
           LEFT JOIN crm_employee e ON e.id = l.assignTo
           ${where}
           ORDER BY age DESC
           LIMIT 20`,
          { replacements: rep, type: QueryTypes.SELECT }
        )

        reportData = {
          buckets: {
            '0-7 days': numericValue(bucketRow?.b0_7),
            '8-30 days': numericValue(bucketRow?.b8_30),
            '31-60 days': numericValue(bucketRow?.b31_60),
            '60+ days': numericValue(bucketRow?.b60plus),
          },
          oldLeads: oldestLeadsRows.map((r) => ({ ...r, age: numericValue(r.age) })),
        }
        break
      }

      case 'appointments':
        const [totalAppointments, completedAppointments, pendingAppointments] = await Promise.all([
          Appointments.count({
            where: { ...branchCondition, ...regionCondition, ...ownCounselorCondition }
          }),
          Appointments.count({
            where: {
              ...branchCondition,
              ...regionCondition,
              ...ownCounselorCondition,
              done: 1
            }
          }),
          Appointments.count({
            where: {
              ...branchCondition,
              ...regionCondition,
              ...ownCounselorCondition,
              done: 0,
              not_done: 0
            }
          })
        ])

        reportData = {
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(2) : 0
        }
        break

      case 'payments':
        // crm_3party_payment has no branch/region column of its own - those
        // conditions only bite once joined via the lead, which this simple
        // count/sum doesn't do, so only the owner clamp applies here.
        const [totalPayments, totalAmount] = await Promise.all([
          Crm3partyPayment.count({
            where: { ...ownEmpCondition }
          }),
          Crm3partyPayment.sum('amount', {
            where: { ...ownEmpCondition }
          })
        ])

        reportData = {
          totalPayments,
          totalAmount: totalAmount || 0,
          averagePayment: totalPayments > 0 ? (totalAmount || 0) / totalPayments : 0
        }
        break

      case 'employees':
        const [totalEmployees, activeEmployees] = await Promise.all([
          CrmEmployee.count({
            where: { ...branchCondition, ...regionCondition }
          }),
          CrmEmployee.count({
            where: {
              ...branchCondition,
              ...regionCondition,
              status: 1
            }
          })
        ])

        reportData = {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees
        }
        break

      case 'performance': {
        // Performance metrics by employee. Previously ran 1 + (employees.length
        // * 5) queries - a Promise.all of 5 separate COUNT/SUM queries inside
        // employees.map(), so this got 5x slower (and 5x more DB round trips)
        // for every additional employee in the scoped branch/region. Rewritten
        // as the base employee list plus 3 GROUP-BY aggregate queries (leads,
        // appointments, payments), each pre-aggregated per employee id and
        // joined in JS via a Map lookup - a fixed 4 queries total regardless
        // of headcount. Matches the original's own scoping exactly: the
        // employee list is branch/region-scoped, but each employee's
        // lead/appointment/payment counts are not further date/branch-filtered
        // (same as before) - only how many queries it takes changed.
        const employees = await CrmEmployee.findAll({
          where: { ...branchCondition, ...regionCondition, status: 1 },
          attributes: ['id', 'name'],
        })

        const [leadStatsRows, apptStatsRows, payStatsRows] = await Promise.all([
          sequelize.query<{ employeeId: number; leadCount: number; convertedLeadCount: number }>(
            `SELECT assignTo AS employeeId,
               COUNT(*) AS leadCount,
               SUM(CASE WHEN status IN (:convertedStatuses) OR opportunity_status = 'won' THEN 1 ELSE 0 END) AS convertedLeadCount
             FROM crm_forum_leads
             WHERE assignTo IS NOT NULL
             GROUP BY assignTo`,
            { replacements: { convertedStatuses }, type: QueryTypes.SELECT }
          ),
          sequelize.query<{ employeeId: number; appointmentCount: number }>(
            `SELECT counsilorid AS employeeId, COUNT(*) AS appointmentCount
             FROM appointments
             WHERE counsilorid IS NOT NULL
             GROUP BY counsilorid`,
            { type: QueryTypes.SELECT }
          ),
          sequelize.query<{ employeeId: number; paymentCount: number; totalRevenue: number }>(
            `SELECT emp_id AS employeeId, COUNT(*) AS paymentCount, COALESCE(SUM(amount), 0) AS totalRevenue
             FROM crm_3party_payment
             WHERE emp_id IS NOT NULL
             GROUP BY emp_id`,
            { type: QueryTypes.SELECT }
          ),
        ])
        const leadStatsById = new Map(leadStatsRows.map(r => [Number(r.employeeId), r]))
        const apptStatsById = new Map(apptStatsRows.map(r => [Number(r.employeeId), r]))
        const payStatsById = new Map(payStatsRows.map(r => [Number(r.employeeId), r]))

        const performanceData = employees.map((emp) => {
          const employeeData = toPlain(emp)
          const leadStats = leadStatsById.get(Number(employeeData.id))
          const apptStats = apptStatsById.get(Number(employeeData.id))
          const payStats = payStatsById.get(Number(employeeData.id))
          const leadCount = numericValue(leadStats?.leadCount)
          const convertedLeadCount = numericValue(leadStats?.convertedLeadCount)

          return {
            employeeId: employeeData.id,
            employeeName: employeeData.name,
            leadCount,
            convertedLeadCount,
            conversionRate: leadCount > 0 ? Number((convertedLeadCount / leadCount * 100).toFixed(2)) : 0,
            appointmentCount: numericValue(apptStats?.appointmentCount),
            paymentCount: numericValue(payStats?.paymentCount),
            totalRevenue: numericValue(payStats?.totalRevenue)
          }
        })

        reportData = {
          performance: performanceData,
          totalRevenue: performanceData.reduce((sum, p) => sum + p.totalRevenue, 0)
        }
        break
      }

      default:
        return null
    }

    return reportData
}

const getCachedReportData = unstable_cache(
  computeReportData,
  ['reports'],
  { tags: [CACHE_TAGS.leads, CACHE_TAGS.appointments, CACHE_TAGS.payments, CACHE_TAGS.employees], revalidate: 60 },
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['reports.view']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const branch = searchParams.get('branch')
    const region = searchParams.get('region')
    const employee = searchParams.get('employee')

    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      )
    }

    // CEO can report on any branch/employee; Branch Manager is clamped to
    // their own branch; everyone else to their own leads - this overrides
    // whatever ?branch=/?employee= was requested rather than defaulting it.
    let resolvedBranch: number | null = branch ? parseInt(branch) : null
    let resolvedRegion: number | null = region ? parseInt(region) : null
    let resolvedEmployee: number | null = employee ? parseInt(employee) : null
    let resolvedCounselorId: number | null = null
    let resolvedEmpId: number | null = null
    if (!isCeo(auth)) {
      if (isBranchManagerOrCeo(auth)) {
        resolvedBranch = Number(auth.branch || 0)
      } else {
        resolvedBranch = Number(auth.branch || 0)
        resolvedEmployee = Number(auth.id)
        resolvedCounselorId = Number(auth.id)
        resolvedEmpId = Number(auth.id)
      }
    }

    const reportData = await getCachedReportData(
      reportType, startDate, endDate,
      resolvedBranch, resolvedRegion, resolvedEmployee, resolvedCounselorId, resolvedEmpId,
    )
    if (reportData === null) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      reportType,
      period: { startDate, endDate },
      filters: { branch, region, employee },
      data: reportData,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
