import { resolveModuleRoleKey } from './modulePermissions';

type AccessUser = {
  role?: string | number | null;
  roleName?: string | null;
  type?: string | null;
  permissions?: string[] | null;
};

const normalizePath = (pathname: string) => {
  const path = pathname.split('?')[0] || '/admin';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

export const getUserRoleKey = (user?: AccessUser | null) => {
  if (!user) return 'employee_self';
  return resolveModuleRoleKey({
    roleId: typeof user.role === 'number' ? user.role : Number(user.role) || undefined,
    roleName: user.roleName || user.type,
    roleType: user.type,
  });
};

export const getDefaultAdminPathForUser = (user?: AccessUser | null) => {
  const roleKey = getUserRoleKey(user);

  if (['super_admin', 'director', 'founder'].includes(roleKey)) return '/admin';
  if (roleKey === 'sales') return '/admin/counselor/dashboard';
  if (roleKey === 'branch_manager') return '/admin/branch-manager/dashboard';
  if (['receptionist', 'foe', 'director_of_sales', 'regional_manager'].includes(roleKey)) return '/admin/leads';
  if (roleKey === 'operations') return '/admin/operations-management';
  if (roleKey === 'hr') return '/admin/hr/attendance-management';
  if (roleKey === 'pro') return '/admin/pro-works';
  if (roleKey === 'finance') return '/admin/finance';
  if (roleKey === 'digital_marketing') return '/admin/digital-marketing/dashboard';
  if (['it_manager', 'it_support_staff'].includes(roleKey)) return '/admin/it-support';

  return '/admin';
};

export const canAccessAdminPath = (user: AccessUser | null | undefined, pathname: string) => {
  if (!user) return false;
  if (user.permissions?.includes('all')) return true;

  const path = normalizePath(pathname);
  const roleKey = getUserRoleKey(user);
  const permissions = user.permissions || [];

  const hasAnyPermission = (required: string[]) => required.some((permission) => permissions.includes(permission));

  // Personal self-service pages (profile, attendance/breaks, leave application,
  // resignation) are available to every authenticated user regardless of role.
  if (
    path === '/admin/profile'
    || path === '/admin/settings'
    || path === '/admin/my-attendance'
    || path === '/admin/my-leave'
    || path === '/admin/my-resignation'
  ) return true;

  if (path === '/admin/lead-assignment-availability') {
    return ['branch_manager', 'sales', 'director', 'founder', 'super_admin'].includes(roleKey);
  }

  if (path === '/admin/lead-pool') {
    // FOE gets the same branch-scoped access as Branch Manager here (see
    // roleCat() in /api/admin/lead-pool) — both assign unassigned leads
    // within their own branch.
    return ['branch_manager', 'foe', 'director', 'founder', 'super_admin'].includes(roleKey);
  }

  if (['super_admin', 'director', 'founder'].includes(roleKey)) return path === '/admin' || path.startsWith('/admin/');

  const permissionPathRules: Array<{ test: (value: string) => boolean; permissions: string[] }> = [
    // Dashboard & Analytics
    { test: (value) => value === '/admin/analytics', permissions: ['analytics.view'] },
    { test: (value) => value === '/admin/monitoring', permissions: ['monitoring.view'] },

    // Role dashboards
    { test: (value) => value === '/admin/counselor/dashboard', permissions: ['sales.view'] },
    { test: (value) => value === '/admin/branch-manager/dashboard', permissions: ['counselors.manage'] },

    // Lead Management
    { test: (value) => value === '/admin/leads' || value.startsWith('/admin/leads/'), permissions: ['leads.view'] },
    { test: (value) => value === '/admin/follow-ups' || value.startsWith('/admin/follow-ups/'), permissions: ['leads.view'] },
    { test: (value) => value === '/admin/compliance-approvals' || value.startsWith('/admin/compliance-approvals/'), permissions: ['leads.view', 'admin.access'] },
    { test: (value) => value === '/admin/discount-approvals' || value.startsWith('/admin/discount-approvals/'), permissions: ['sales.update', 'admin.access'] },
    { test: (value) => value === '/admin/lead-transfers', permissions: ['transfers.manage'] },
    { test: (value) => value === '/admin/lead-assignment-availability', permissions: ['sales.view', 'admin.access'] },
    { test: (value) => value === '/admin/immigration-tools' || value.startsWith('/admin/immigration-tools/'), permissions: ['leads.view'] },

    // Clients
    { test: (value) => value === '/admin/clients' || value.startsWith('/admin/clients/'), permissions: ['clients.view'] },

    // Calendar & Appointments
    { test: (value) => value === '/admin/calendar' || value === '/admin/appointments' || value.startsWith('/admin/appointments/') || value === '/admin/cross-branch-appointments' || value.startsWith('/admin/cross-branch-appointments/'), permissions: ['appointments.view', 'appointments.manage'] },

    // Documents
    { test: (value) => value === '/admin/documents' || value.startsWith('/admin/documents/'), permissions: ['documents.view'] },

    // Payments, Invoices, Agreements, Recovery
    { test: (value) => value === '/admin/payments' || value.startsWith('/admin/payments/'), permissions: ['payments.view'] },
    { test: (value) => value === '/admin/invoices' || value.startsWith('/admin/invoices/'), permissions: ['invoices.view'] },
    { test: (value) => value === '/admin/agreements' || value.startsWith('/admin/agreements/'), permissions: ['agreements.view'] },
    { test: (value) => value === '/admin/sample-agreement', permissions: ['agreements.view'] },
    { test: (value) => value === '/admin/recovery-report', permissions: ['finance.view', 'finance.manage', 'payments.view', 'admin.access'] },

    // Reports
    { test: (value) => value === '/admin/reports' || value.startsWith('/admin/reports/'), permissions: ['reports.view'] },

    // People Management
    { test: (value) => value === '/admin/employees' || value.startsWith('/admin/employees/'), permissions: ['employees.manage'] },
    { test: (value) => value === '/admin/branches' || value.startsWith('/admin/branches/'), permissions: ['branches.manage'] },
    { test: (value) => value === '/admin/departments' || value.startsWith('/admin/departments/'), permissions: ['departments.manage'] },
    { test: (value) => value === '/admin/attendance' || value.startsWith('/admin/attendance/'), permissions: ['attendance.manage'] },
    { test: (value) => value === '/admin/b2b', permissions: ['b2b.manage'] },
    { test: (value) => value === '/admin/employers', permissions: ['employers.manage'] },
    { test: (value) => value === '/admin/balance-payments' || value.startsWith('/admin/balance-payments/'), permissions: ['leads.view', 'finance.view', 'payments.view'] },

    // Operations
    { test: (value) => value === '/admin/operations-management' || value.startsWith('/admin/ops-'), permissions: ['operations.view', 'operations.manage', 'operations.assign_activities'] },
    { test: (value) => value === '/admin/operations-console', permissions: ['operations.case_transfer', 'operations.case_status_manage', 'operations.access_control'] },
    { test: (value) => value === '/admin/operations-team-allocation', permissions: ['operations.team_allocation', 'operations.manage', 'employees.manage'] },

    // HR Module — all sub-routes under /admin/hr/
    { test: (value) => value === '/admin/hr' || value.startsWith('/admin/hr/'), permissions: ['hr.dashboard', 'hr.view', 'hr.create', 'hr.update', 'hr.delete', 'hr.config', 'hr.payroll', 'hr.eosb', 'hr.self', 'hr.team.attendance_leave', 'hr.reports.attendance'] },

    // PRO Module — all sub-routes under /admin/pro-works/
    { test: (value) => value === '/admin/pro-works' || value.startsWith('/admin/pro-works/'), permissions: ['pro.dashboard', 'pro.view', 'pro.create', 'pro.update', 'pro.delete', 'pro.config', 'pro.wps.view', 'pro.owners.restricted'] },

    // IT Support Module — all sub-routes under /admin/it-support/
    { test: (value) => value === '/admin/it-support' || value.startsWith('/admin/it-support/'), permissions: ['it.dashboard', 'it.view', 'it.create', 'it.self', 'it.manage', 'it.approve.manager', 'it.approve.branch', 'it.approve.director'] },

    // Finance Module
    { test: (value) => value === '/admin/finance' || value.startsWith('/admin/finance/'), permissions: ['finance.view', 'finance.manage', 'payments.view'] },
    { test: (value) => value === '/admin/accounts' || value.startsWith('/admin/accounts/'), permissions: ['finance.view', 'finance.manage', 'payments.view'] },

    // Meta Lead Ads
    { test: (value) => value === '/admin/meta-leads' || value.startsWith('/admin/meta-leads/'), permissions: ['admin.access', 'marketing.manage'] },

    // Config & Settings
    { test: (value) => value === '/admin/programs' || value === '/admin/fees' || value === '/admin/currency' || value === '/admin/countries', permissions: ['programs.manage', 'fees.manage', 'currency.manage', 'countries.manage'] },
    { test: (value) => value === '/admin/roles' || value.startsWith('/admin/roles/'), permissions: ['roles.manage', 'admin.access'] },
    { test: (value) => value === '/admin/market-sources', permissions: ['marketing.manage'] },
    { test: (value) => value === '/admin/campaigns', permissions: ['campaigns.manage'] },
    { test: (value) => value === '/admin/email-templates', permissions: ['templates.manage'] },
    { test: (value) => value === '/admin/legacy-modules', permissions: ['settings.manage'] },
    { test: (value) => value === '/admin/automation-rules', permissions: ['automation.manage'] },
  ];

  if (permissionPathRules.some((rule) => rule.test(path) && hasAnyPermission(rule.permissions))) return true;

  // /admin dashboard: all roles land here initially; non-admin roles are redirected by getDefaultAdminPathForUser
  if (path === '/admin') {
    return true;
  }

  return false;
};
