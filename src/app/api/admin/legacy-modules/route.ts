import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const legacyRoot = process.env.LEGACY_DM_PATH || 'D:\\xampp\\htdocs\\dm';

const modules = [
  { name: 'Accounts', oldFile: 'accounts.php', table: 'crm_accounts', nextPath: '/admin/accounts', apiPath: '/api/admin/accounts', status: 'migrated' },
  { name: 'Prospects', oldFile: 'add_prospect.php', table: 'crm_prospects', nextPath: '/admin/add-prospect', apiPath: '/api/admin/prospects', status: 'migrated' },
  { name: 'Tasks', oldFile: 'all_task_list.php', table: 'crm_task', nextPath: '/admin/all-task-list', apiPath: '/api/admin/tasks', status: 'migrated' },
  { name: 'Branch Targets', oldFile: 'branch-target.php', table: 'branch_target', nextPath: '/admin/branch-target', apiPath: null, status: 'page-only' },
  { name: 'Regions', oldFile: 'region_list.php', table: 'crm_region', nextPath: '/admin/regions', apiPath: '/api/admin/regions', status: 'migrated' },
  { name: 'Discounts', oldFile: 'discount_lead_management.php', table: 'crm_discount_approvals', nextPath: '/admin/discounts', apiPath: '/api/discount-approvals', status: 'migrated' },
  { name: 'Contracts', oldFile: 'contract_file_list.php', table: 'crm_contract_file', nextPath: '/admin/contracts', apiPath: '/api/admin/contracts', status: 'partial' },
  { name: 'Opportunity Payments', oldFile: 'business_lead_payment.php', table: 'crm_opportunity_payments', nextPath: '/admin/opportunity-payments', apiPath: '/api/opportunity-payments', status: 'partial' },
  { name: 'Vendors', oldFile: 'vendor_list.php', table: 'crm_vendors', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Refunds', oldFile: 'refund_management.php', table: 'crm_refunds', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Expenses', oldFile: 'expense_list.php', table: 'crm_expense', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Leave History', oldFile: 'employe_leave_list.php', table: 'crm_leave_history', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Library', oldFile: 'group_library_files.php', table: 'crm_library', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Teams', oldFile: 'team_allocation.php', table: 'crm_teams', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Branch Allocations', oldFile: 'branch_allocations.php', table: 'crm_branch_allocations', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Counselor Allocations', oldFile: 'counsellor_allocations.php', table: 'crm_counsilor_allocations', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Client Conversations', oldFile: 'client_conversations.php', table: 'crm_client_conversations', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Client Logs', oldFile: 'view_client_logs.php', table: 'crm_client_logs', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Official Emails', oldFile: 'counsilor_email.php', table: 'crm_official_emails', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Target Dates', oldFile: 'target_dates.php', table: 'crm_target_dates', nextPath: null, apiPath: null, status: 'needed' },
  { name: 'Sources', oldFile: 'source_list.php', table: 'crm_source', nextPath: null, apiPath: null, status: 'needed' },
] as const;

const tableNames = new Set<string>(modules.map((module) => module.table));

const countRows = async (table: string) => {
  if (!tableNames.has(table)) {
    return null;
  }

  try {
    const rows = await sequelize.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM \`${table}\``,
      { type: QueryTypes.SELECT }
    );
    return Number(rows[0]?.count || 0);
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['settings.manage']);
  if (isAuthError(auth)) return auth;

  const data = await Promise.all(
    modules.map(async (module) => ({
      ...module,
      oldFileExists: fs.existsSync(path.join(legacyRoot, module.oldFile)),
      recordCount: await countRows(module.table),
    }))
  );

  return NextResponse.json({
    legacyRoot,
    data,
    summary: {
      total: data.length,
      migrated: data.filter((module) => module.status === 'migrated').length,
      partial: data.filter((module) => module.status === 'partial' || module.status === 'page-only').length,
      needed: data.filter((module) => module.status === 'needed').length,
    },
  });
}
