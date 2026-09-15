import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { CrmcForumLeads } from '@/models';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

const toPlain = (row: any) => row?.get ? row.get({ plain: true }) : row;
const toPlainArray = (rows: any[]) => rows.map(toPlain);
const numericValue = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

async function getReferenceMaps() {
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

  const countryMap = new Map(countries.map((row) => [String(row.value), row.label]));
  const serviceMap = new Map([
    ...services.map((row) => [String(row.value), row.label] as const),
    ...programTypes.map((row) => [String(row.value), row.label] as const),
  ]);

  return { countryMap, serviceMap };
}

let savedReportsTableReady: Promise<void> | null = null;
const ensureSavedReportsTable = async () => {
  if (!savedReportsTableReady) {
    savedReportsTableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_saved_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_name VARCHAR(255) NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        filters TEXT NULL,
        columns TEXT NULL,
        group_by VARCHAR(50) NULL,
        created_by INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `).then(() => undefined).catch((error) => {
      savedReportsTableReady = null;
      throw error;
    });
  }
  await savedReportsTableReady;
};

const labelFor = (map: Map<string, string>, value: unknown) => {
  const key = String(value || '').trim();
  if (!key) return 'Unknown';
  return map.get(key) || key;
};

const decorateLeadLabels = (items: any[], maps: Awaited<ReturnType<typeof getReferenceMaps>>) => (
  items.map((item) => ({
    ...item,
    country_interest_label: labelFor(maps.countryMap, item.country_interest),
    service_interest_label: labelFor(maps.serviceMap, item.service_interest),
  }))
);

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['reports.view']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'getSavedReports') {
      await ensureSavedReportsTable();
      const rows = await sequelize.query<any>(
        `SELECT id, report_name, report_type, filters, columns, group_by, created_by, created_at, updated_at
         FROM crm_saved_reports ORDER BY created_at DESC`,
        { type: QueryTypes.SELECT }
      );
      return NextResponse.json({
        success: true,
        data: rows.map((row) => ({
          ...row,
          name: row.report_name,
          type: row.report_type,
          createdOn: row.created_at,
          filters: row.filters ? JSON.parse(row.filters) : {},
          columns: row.columns ? JSON.parse(row.columns) : [],
        })),
      });
    }

    if (action === 'getReport') {
      const reportId = searchParams.get('reportId');
      if (!reportId) {
        return NextResponse.json({ success: false, error: 'Report ID required' }, { status: 400 });
      }

      await ensureSavedReportsTable();
      const rows = await sequelize.query<any>(
        `SELECT id, report_name, report_type, filters, columns, group_by, created_by, created_at, updated_at
         FROM crm_saved_reports WHERE id = :reportId LIMIT 1`,
        { replacements: { reportId: Number(reportId) }, type: QueryTypes.SELECT }
      );
      if (!rows[0]) {
        return NextResponse.json({ success: false, error: 'Saved report not found' }, { status: 404 });
      }
      const row = rows[0];
      return NextResponse.json({
        success: true,
        data: { ...row, filters: row.filters ? JSON.parse(row.filters) : {}, columns: row.columns ? JSON.parse(row.columns) : [] },
      });
    }

    // Generate custom report
    const reportType = searchParams.get('reportType') || 'leads';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const programType = searchParams.get('programType');
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const branch = searchParams.get('branch');
    const counselor = searchParams.get('counselor');
    const region = searchParams.get('region');
    const nationality = searchParams.get('nationality');
    const groupBy = searchParams.get('groupBy');

    const where: any = {};
    const referenceMaps = await getReferenceMaps();

    // Date range filter
    if (startDate && endDate) {
      where.feeAgreeDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Apply filters
    if (programType) where.type = programType;
    if (status) where.status = status;
    if (country) where.country_interest = parseInt(country);
    if (branch) where.branch = parseInt(branch);
    if (counselor) where.Counsilor = parseInt(counselor);
    if (region) where.region = parseInt(region);
    if (nationality) where.nationality = nationality;

    // CEO can report on anything; Branch Manager is clamped to their own
    // branch and everyone else to their own leads, regardless of whatever
    // ?branch=/?counselor= was requested - this overrides the filters above
    // rather than merely defaulting them.
    if (!isCeo(auth)) {
      if (isBranchManagerOrCeo(auth)) {
        where.branch = auth.branch || 0;
      } else {
        where.Counsilor = auth.id;
      }
    }

    // Only paid clients with agreements
    where.stepComplete = 3;
    where.paidYet = { [Op.ne]: 0 };

    if (reportType === 'leads') {
      const leadRows = await CrmcForumLeads.findAll({
        where,
        attributes: [
          'id', 'fname', 'lname', 'email', 'mobile', 'type', 'status',
          'country_interest', 'service_interest', 'feeAgreeDate', 'agreeDate',
          'Counsilor', 'case_officer', 'branch', 'region', 'nationality',
          'paidYet', 'payBalance', 'payTotal', 'payType', 'no_of_applicants'
        ],
        order: [['feeAgreeDate', 'DESC']]
      });
      const leads = decorateLeadLabels(toPlainArray(leadRows), referenceMaps);

      // Group data if requested
      let groupedData = null;
      if (groupBy) {
        groupedData = groupLeads(leads, groupBy);
      }

      return NextResponse.json({
        success: true,
        data: {
          leads,
          groupedData,
          summary: {
            totalLeads: leads.length,
            totalApplicants: leads.reduce((sum: number, l: any) => sum + (l.noOfApplicants || l.no_of_applicants || 0), 0),
            byStatus: countBy(leads, 'status'),
            byType: countBy(leads, 'type'),
            byCountry: countBy(leads, 'country_interest_label')
          }
        }
      });
    }

    if (reportType === 'opportunities') {
      // Get opportunities data
      const opportunityRows = await CrmcForumLeads.findAll({
        where: {
          ...where,
          stepComplete: { [Op.gte]: 1 }
        },
        attributes: [
          'id', 'fname', 'lname', 'email', 'mobile', 'type', 'status',
          'service_interest', 'country_interest', 'feeAgreeDate', 'agreeDate',
          'Counsilor', 'case_officer', 'branch', 'paidYet', 'payBalance'
        ],
        order: [['feeAgreeDate', 'DESC']]
      });
      const opportunities = decorateLeadLabels(toPlainArray(opportunityRows), referenceMaps);

      return NextResponse.json({
        success: true,
        data: {
          opportunities,
          summary: {
            total: opportunities.length,
            paid: opportunities.filter((o: any) => numericValue(o.paidYet) > 0).length,
            pending: opportunities.filter((o: any) => numericValue(o.payBalance) > 0).length,
            totalRevenue: opportunities.reduce((sum: number, o: any) => sum + numericValue(o.paidYet), 0),
            pendingRevenue: opportunities.reduce((sum: number, o: any) => sum + numericValue(o.payBalance), 0)
          }
        }
      });
    }

    if (reportType === 'revenue') {
      // Revenue report
      const paymentRows = await CrmcForumLeads.findAll({
        where: {
          ...where,
          paidYet: { [Op.gt]: 0 }
        },
        attributes: [
          'id', 'fname', 'lname', 'type', 'feeAgreeDate', 'paidYet',
          'payBalance', 'payType', 'branch', 'region', 'Counsilor'
        ],
        order: [['feeAgreeDate', 'DESC']]
      });
      const payments = toPlainArray(paymentRows);

      return NextResponse.json({
        success: true,
        data: {
          payments,
          summary: {
            totalReceived: payments.reduce((sum: number, p: any) => sum + numericValue(p.paidYet), 0),
            totalPending: payments.reduce((sum: number, p: any) => sum + numericValue(p.payBalance), 0),
            totalTransactions: payments.length,
            byPaymentType: countBy(payments, 'payType'),
            byBranch: countBy(payments, 'branch')
          }
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });

  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['reports.create']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { action, reportName, reportType, filters, columns, groupBy, userId, reportId } = body;

    if (action === 'saveReport') {
      if (!reportName || !reportType) {
        return NextResponse.json({ success: false, error: 'reportName and reportType are required' }, { status: 400 });
      }
      await ensureSavedReportsTable();
      const [insertId] = await sequelize.query(
        `INSERT INTO crm_saved_reports (report_name, report_type, filters, columns, group_by, created_by)
         VALUES (:reportName, :reportType, :filters, :columns, :groupBy, :createdBy)`,
        {
          replacements: {
            reportName,
            reportType,
            filters: JSON.stringify(filters || {}),
            columns: JSON.stringify(columns || []),
            groupBy: groupBy || null,
            createdBy: Number(userId || 1),
          },
          type: QueryTypes.INSERT,
        }
      );
      return NextResponse.json({ success: true, data: { id: insertId } }, { status: 201 });
    }

    if (action === 'deleteReport') {
      if (!reportId) {
        return NextResponse.json({ success: false, error: 'reportId is required' }, { status: 400 });
      }
      await ensureSavedReportsTable();
      await sequelize.query(`DELETE FROM crm_saved_reports WHERE id = :reportId`, { replacements: { reportId: Number(reportId) } });
      return NextResponse.json({ success: true });
    }

    if (action === 'updateReport') {
      if (!reportId) {
        return NextResponse.json({ success: false, error: 'reportId is required' }, { status: 400 });
      }
      await ensureSavedReportsTable();
      await sequelize.query(
        `UPDATE crm_saved_reports
         SET report_name = COALESCE(:reportName, report_name),
             report_type = COALESCE(:reportType, report_type),
             filters = COALESCE(:filters, filters),
             columns = COALESCE(:columns, columns),
             group_by = COALESCE(:groupBy, group_by)
         WHERE id = :reportId`,
        {
          replacements: {
            reportId: Number(reportId),
            reportName: reportName || null,
            reportType: reportType || null,
            filters: filters ? JSON.stringify(filters) : null,
            columns: columns ? JSON.stringify(columns) : null,
            groupBy: groupBy || null,
          },
        }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Report save error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper functions
function countBy(array: any[], field: string) {
  return array.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function groupLeads(leads: any[], groupBy: string) {
  const grouped = leads.reduce((acc, lead) => {
    const key = lead[groupBy] || 'Unknown';
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        applicants: 0,
        revenue: 0,
        items: []
      };
    }
    acc[key].count += 1;
    acc[key].applicants += lead.no_of_applicants || 0;
    acc[key].revenue += numericValue(lead.paidYet);
    acc[key].items.push(lead);
    return acc;
  }, {} as Record<string, any>);

  return grouped;
}
