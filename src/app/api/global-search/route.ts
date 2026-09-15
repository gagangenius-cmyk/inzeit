import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';

type SearchRow = {
  id: string | number;
  title: string;
  subtitle: string | null;
  type: string;
  href: string;
};

const likeTerm = (value: string) => `%${value.trim()}%`;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const replacements: Record<string, unknown> = { query: likeTerm(query), exact: query, limit: 8 };

    // Search results must respect the same visibility rule as the pages they
    // link into: CEO sees everything, Branch Manager their own branch,
    // everyone else only records they own - otherwise the search box becomes
    // a way to discover other branches'/counselors' leads and clients that
    // the underlying list pages already hide.
    let leadScopeSql = '';
    let clientScopeSql = '';
    let invoiceScopeSql = '';
    if (!isCeo(auth)) {
      if (isBranchManagerOrCeo(auth)) {
        leadScopeSql = ' AND l.branch = :userBranch';
        clientScopeSql = ' AND l.branch = :userBranch';
        invoiceScopeSql = ' AND i.branch = :userBranch';
        replacements.userBranch = auth.branch || 0;
      } else {
        leadScopeSql = ' AND (l.assignTo = :userId OR l.Counsilor = :userId)';
        clientScopeSql = ' AND (l.assignTo = :userId OR l.Counsilor = :userId)';
        invoiceScopeSql = ' AND i.branch = :userBranch';
        replacements.userId = auth.id;
        replacements.userBranch = auth.branch || 0;
      }
    }

    const [leads, clients, reports, invoices, employees] = await Promise.all([
      sequelize.query<SearchRow>(
        `
          SELECT
            l.id,
            TRIM(CONCAT(COALESCE(l.fname, ''), ' ', COALESCE(l.lname, ''))) AS title,
            CONCAT(COALESCE(l.email, ''), CASE WHEN l.mobile IS NULL OR l.mobile = '' THEN '' ELSE CONCAT(' | ', l.mobile) END) AS subtitle,
            'Lead' AS type,
            CONCAT('/admin/leads/', l.id, '/edit') AS href
          FROM crm_forum_leads l
          WHERE (
             CAST(l.id AS CHAR) = :exact
             OR l.fname LIKE :query
             OR l.lname LIKE :query
             OR l.email LIKE :query
             OR l.mobile LIKE :query
             OR l.phone LIKE :query
          )
          ${leadScopeSql}
          ORDER BY l.created DESC
          LIMIT :limit
        `,
        { replacements, type: QueryTypes.SELECT }
      ),
      sequelize.query<SearchRow>(
        `
          SELECT
            c.id,
            COALESCE(NULLIF(TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))), ''), c.email, CONCAT('Client #', c.id)) AS title,
            CONCAT(COALESCE(c.email, ''), CASE WHEN l.mobile IS NULL OR l.mobile = '' THEN '' ELSE CONCAT(' | ', l.mobile) END) AS subtitle,
            'Client' AS type,
            CONCAT('/admin/leads/', c.leadId, '/edit') AS href
          FROM crm_clients c
          LEFT JOIN crm_forum_leads l ON l.id = c.leadId
          WHERE c.is_deleted = 0
            AND (
              CAST(c.id AS CHAR) = :exact
              OR c.first_name LIKE :query
              OR c.last_name LIKE :query
              OR c.email LIKE :query
              OR l.mobile LIKE :query
              OR l.phone LIKE :query
            )
            ${clientScopeSql}
          ORDER BY c.created DESC
          LIMIT :limit
        `,
        { replacements, type: QueryTypes.SELECT }
      ),
      sequelize.query<SearchRow>(
        `
          SELECT id, title, subtitle, type, href
          FROM (
            SELECT 1 AS id, 'Lead Reports' AS title, 'Revenue, countries and services' AS subtitle, 'Report' AS type, '/admin/reports/lead-status' AS href
            UNION ALL SELECT 2, 'Finance Report', 'Contracts and payment balances', 'Report', '/admin/reports/finance'
            UNION ALL SELECT 3, 'Branch Performance', 'Branch and counselor performance', 'Report', '/admin/reports/branch-performance'
            UNION ALL SELECT 4, 'Lead Source Analytics', 'Source quality and conversion analytics', 'Report', '/admin/reports/lead-source-analytics'
            UNION ALL SELECT 5, 'Conversion Funnel', 'Lead conversion funnel', 'Report', '/admin/reports/lead-conversion-funnel'
            UNION ALL SELECT 6, 'Lead Aging', 'Aging and stale leads', 'Report', '/admin/reports/lead-aging'
          ) r
          WHERE title LIKE :query OR subtitle LIKE :query
          LIMIT :limit
        `,
        { replacements, type: QueryTypes.SELECT }
      ),
      sequelize.query<SearchRow>(
        `
          SELECT
            i.id,
            COALESCE(NULLIF(i.receipt, ''), CONCAT('Invoice #', i.id)) AS title,
            CONCAT(COALESCE(i.company, ''), CASE WHEN i.purpose IS NULL OR i.purpose = '' THEN '' ELSE CONCAT(' | ', i.purpose) END) AS subtitle,
            'Invoice' AS type,
            '/admin/invoices' AS href
          FROM crm_b2b_invoices i
          WHERE (
             CAST(i.id AS CHAR) = :exact
             OR i.receipt LIKE :query
             OR i.company LIKE :query
             OR i.purpose LIKE :query
          )
          ${invoiceScopeSql}
          ORDER BY i.created DESC
          LIMIT :limit
        `,
        { replacements, type: QueryTypes.SELECT }
      ),
      sequelize.query<SearchRow>(
        `
          SELECT
            e.id,
            e.name AS title,
            CONCAT(COALESCE(e.email, ''), CASE WHEN e.mobile IS NULL OR e.mobile = '' THEN '' ELSE CONCAT(' | ', e.mobile) END) AS subtitle,
            'Employee' AS type,
            '/admin/hr/employee-data-sheet' AS href
          FROM crm_employee e
          WHERE CAST(e.id AS CHAR) = :exact
             OR e.name LIKE :query
             OR e.email LIKE :query
             OR e.mobile LIKE :query
          ORDER BY e.id DESC
          LIMIT :limit
        `,
        { replacements, type: QueryTypes.SELECT }
      ),
    ]);

    return NextResponse.json({
      results: [...leads, ...clients, ...reports, ...invoices, ...employees].slice(0, 12),
    });
  } catch (error) {
    console.error('Global search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
