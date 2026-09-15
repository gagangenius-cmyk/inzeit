export const modulePermissions = {
  adminAccess: 'admin.access',
  salesView: 'sales.view',
  salesCreate: 'sales.create',
  salesUpdate: 'sales.update',
  salesDelete: 'sales.delete',
  operationsView: 'operations.view',
  operationsCreate: 'operations.create',
  operationsUpdate: 'operations.update',
  operationsDelete: 'operations.delete',
  operationsManage: 'operations.manage',
  operationsCaseTransfer: 'operations.case_transfer',
  operationsCaseStatusManage: 'operations.case_status_manage',
  operationsTaskReassign: 'operations.task_reassign',
  operationsAccessControl: 'operations.access_control',
  operationsTeamAllocation: 'operations.team_allocation',
  reportsView: 'reports.view',
  reportsCreate: 'reports.create',
  reportsUpdate: 'reports.update',
  reportsDelete: 'reports.delete',
  leadsView: 'leads.view',
  leadsCreate: 'leads.create',
  leadsUpdate: 'leads.update',
  leadsDelete: 'leads.delete',
  leadsBulkUpload: 'leads.bulk_upload',
  analyticsView: 'analytics.view',
  appointmentsView: 'appointments.view',
  appointmentsManage: 'appointments.manage',
  documentsView: 'documents.view',
  documentsCreate: 'documents.create',
  documentsUpdate: 'documents.update',
  documentsDelete: 'documents.delete',
  paymentsView: 'payments.view',
  paymentsCreate: 'payments.create',
  paymentsUpdate: 'payments.update',
  paymentsDelete: 'payments.delete',
  invoicesView: 'invoices.view',
  invoicesCreate: 'invoices.create',
  invoicesUpdate: 'invoices.update',
  invoicesDelete: 'invoices.delete',
  agreementsView: 'agreements.view',
  agreementsCreate: 'agreements.create',
  agreementsUpdate: 'agreements.update',
  agreementsDelete: 'agreements.delete',
  clientsView: 'clients.view',
  clientsCreate: 'clients.create',
  clientsUpdate: 'clients.update',
  clientsDelete: 'clients.delete',
  counselorsManage: 'counselors.manage',
  employeesManage: 'employees.manage',
  branchesManage: 'branches.manage',
  departmentsManage: 'departments.manage',
  attendanceManage: 'attendance.manage',
  programsManage: 'programs.manage',
  feesManage: 'fees.manage',
  currencyManage: 'currency.manage',
  countriesManage: 'countries.manage',
  rolesManage: 'roles.manage',
  marketingManage: 'marketing.manage',
  campaignsManage: 'campaigns.manage',
  templatesManage: 'templates.manage',
  b2bManage: 'b2b.manage',
  employersManage: 'employers.manage',
  transfersManage: 'transfers.manage',
  recognitionManage: 'recognition.manage',
  monitoringView: 'monitoring.view',
  settingsManage: 'settings.manage',
  hrDashboard: 'hr.dashboard',
  hrView: 'hr.view',
  hrCreate: 'hr.create',
  hrUpdate: 'hr.update',
  hrDelete: 'hr.delete',
  hrConfig: 'hr.config',
  hrPayroll: 'hr.payroll',
  hrEosb: 'hr.eosb',
  hrSelf: 'hr.self',
  hrTeamAttendanceLeave: 'hr.team.attendance_leave',
  hrReportsAttendance: 'hr.reports.attendance',
  proDashboard: 'pro.dashboard',
  proView: 'pro.view',
  proCreate: 'pro.create',
  proUpdate: 'pro.update',
  proDelete: 'pro.delete',
  proConfig: 'pro.config',
  proWpsView: 'pro.wps.view',
  proOwnersRestricted: 'pro.owners.restricted',
  financeView: 'finance.view',
  financeManage: 'finance.manage',
  feesView: 'fees.view',
  itDashboard: 'it.dashboard',
  itView: 'it.view',
  itCreate: 'it.create',
  itSelf: 'it.self',
  itManage: 'it.manage',
  itApproveManager: 'it.approve.manager',
  itApproveBranch: 'it.approve.branch',
  itApproveDirector: 'it.approve.director',
  itConfig: 'it.config',
  automationManage: 'automation.manage',
} as const;

export type ModulePermission = typeof modulePermissions[keyof typeof modulePermissions];

export type ModuleRoleKey =
  | 'super_admin'
  | 'director'
  | 'founder'
  | 'director_of_sales'
  | 'regional_manager'
  | 'sales'
  | 'operations'
  | 'hr'
  | 'pro'
  | 'finance'
  | 'branch_manager'
  | 'receptionist'
  | 'foe'
  | 'digital_marketing'
  | 'it_manager'
  | 'it_support_staff'
  | 'employee_self';

const adminPermissions: ModulePermission[] = [
  modulePermissions.adminAccess,
  modulePermissions.salesView,
  modulePermissions.salesCreate,
  modulePermissions.salesUpdate,
  modulePermissions.salesDelete,
  modulePermissions.operationsView,
  modulePermissions.operationsCreate,
  modulePermissions.operationsUpdate,
  modulePermissions.operationsDelete,
  modulePermissions.operationsManage,
  modulePermissions.operationsCaseTransfer,
  modulePermissions.operationsCaseStatusManage,
  modulePermissions.operationsTaskReassign,
  modulePermissions.operationsAccessControl,
  modulePermissions.operationsTeamAllocation,
  modulePermissions.reportsView,
  modulePermissions.reportsCreate,
  modulePermissions.reportsUpdate,
  modulePermissions.reportsDelete,
  modulePermissions.leadsView,
  modulePermissions.leadsCreate,
  modulePermissions.leadsUpdate,
  modulePermissions.leadsDelete,
  modulePermissions.leadsBulkUpload,
  modulePermissions.analyticsView,
  modulePermissions.appointmentsView,
  modulePermissions.appointmentsManage,
  modulePermissions.documentsView,
  modulePermissions.documentsCreate,
  modulePermissions.documentsUpdate,
  modulePermissions.documentsDelete,
  modulePermissions.paymentsView,
  modulePermissions.paymentsCreate,
  modulePermissions.paymentsUpdate,
  modulePermissions.paymentsDelete,
  modulePermissions.invoicesView,
  modulePermissions.invoicesCreate,
  modulePermissions.invoicesUpdate,
  modulePermissions.invoicesDelete,
  modulePermissions.agreementsView,
  modulePermissions.agreementsCreate,
  modulePermissions.agreementsUpdate,
  modulePermissions.agreementsDelete,
  modulePermissions.clientsView,
  modulePermissions.clientsCreate,
  modulePermissions.clientsUpdate,
  modulePermissions.clientsDelete,
  modulePermissions.counselorsManage,
  modulePermissions.employeesManage,
  modulePermissions.branchesManage,
  modulePermissions.departmentsManage,
  modulePermissions.attendanceManage,
  modulePermissions.programsManage,
  modulePermissions.feesManage,
  modulePermissions.currencyManage,
  modulePermissions.countriesManage,
  modulePermissions.rolesManage,
  modulePermissions.marketingManage,
  modulePermissions.campaignsManage,
  modulePermissions.templatesManage,
  modulePermissions.b2bManage,
  modulePermissions.employersManage,
  modulePermissions.transfersManage,
  modulePermissions.recognitionManage,
  modulePermissions.monitoringView,
  modulePermissions.settingsManage,
  modulePermissions.hrDashboard,
  modulePermissions.hrView,
  modulePermissions.hrCreate,
  modulePermissions.hrUpdate,
  modulePermissions.hrDelete,
  modulePermissions.hrConfig,
  modulePermissions.hrPayroll,
  modulePermissions.hrEosb,
  modulePermissions.proDashboard,
  modulePermissions.proView,
  modulePermissions.proCreate,
  modulePermissions.proUpdate,
  modulePermissions.proDelete,
  modulePermissions.proConfig,
  modulePermissions.proWpsView,
  modulePermissions.proOwnersRestricted,
  modulePermissions.hrSelf,
  modulePermissions.hrTeamAttendanceLeave,
  modulePermissions.hrReportsAttendance,
  modulePermissions.financeView,
  modulePermissions.financeManage,
  modulePermissions.itDashboard,
  modulePermissions.itView,
  modulePermissions.itApproveManager,
  modulePermissions.itApproveBranch,
  modulePermissions.itApproveDirector,
  modulePermissions.itManage,
  modulePermissions.itConfig,
];

// Every employee, regardless of role, can raise and track their own IT tickets.
const itSelfServicePermissions: ModulePermission[] = [modulePermissions.itCreate, modulePermissions.itSelf];

const itManagerPermissions: ModulePermission[] = [
  modulePermissions.itDashboard,
  modulePermissions.itView,
  modulePermissions.itApproveManager,
  modulePermissions.itManage,
  modulePermissions.itConfig,
];

const itSupportStaffPermissions: ModulePermission[] = [
  modulePermissions.itDashboard,
  modulePermissions.itView,
  modulePermissions.itManage,
];

const salesModulePermissions: ModulePermission[] = [
  modulePermissions.salesView,
  modulePermissions.salesCreate,
  modulePermissions.salesUpdate,
  modulePermissions.leadsView,
  modulePermissions.leadsCreate,
  modulePermissions.leadsUpdate,
  modulePermissions.leadsDelete,
  modulePermissions.clientsView,
  modulePermissions.clientsCreate,
  modulePermissions.clientsUpdate,
  modulePermissions.appointmentsView,
  modulePermissions.appointmentsManage,
  modulePermissions.documentsView,
  modulePermissions.documentsCreate,
  modulePermissions.documentsUpdate,
  modulePermissions.paymentsView,
  modulePermissions.paymentsCreate,
  modulePermissions.invoicesView,
  modulePermissions.invoicesCreate,
  modulePermissions.agreementsView,
  modulePermissions.agreementsCreate,
  modulePermissions.reportsView,
  modulePermissions.feesView,
];

// Individual-contributor tier: own leads/meetings/agreements only, read-only
// Operations visibility, and no receipts/invoice access (front-desk/finance
// handle money; the counsellor generates the paperwork, not the payment).
const counsellorPermissions: ModulePermission[] = [
  modulePermissions.salesView,
  modulePermissions.salesCreate,
  modulePermissions.salesUpdate,
  modulePermissions.leadsView,
  modulePermissions.leadsCreate,
  modulePermissions.leadsUpdate,
  modulePermissions.clientsView,
  modulePermissions.clientsCreate,
  modulePermissions.clientsUpdate,
  modulePermissions.appointmentsView,
  modulePermissions.appointmentsManage,
  modulePermissions.documentsView,
  modulePermissions.documentsCreate,
  modulePermissions.documentsUpdate,
  modulePermissions.agreementsView,
  modulePermissions.agreementsCreate,
  modulePermissions.operationsView,
  modulePermissions.reportsView,
  modulePermissions.feesView,
];

// Director of Sales / Assistant Director of Sales: full company-wide sales +
// operations + reporting authority, but no user/role/system administration,
// no fee-plan editing, and no destructive delete/void/refund actions.
const directorOfSalesPermissions: ModulePermission[] = [
  modulePermissions.salesView,
  modulePermissions.salesCreate,
  modulePermissions.salesUpdate,
  modulePermissions.leadsView,
  modulePermissions.leadsCreate,
  modulePermissions.leadsUpdate,
  modulePermissions.clientsView,
  modulePermissions.clientsCreate,
  modulePermissions.clientsUpdate,
  modulePermissions.clientsDelete,
  modulePermissions.appointmentsView,
  modulePermissions.appointmentsManage,
  modulePermissions.documentsView,
  modulePermissions.documentsCreate,
  modulePermissions.documentsUpdate,
  modulePermissions.documentsDelete,
  modulePermissions.paymentsView,
  modulePermissions.paymentsCreate,
  modulePermissions.paymentsUpdate,
  modulePermissions.invoicesView,
  modulePermissions.invoicesCreate,
  modulePermissions.invoicesUpdate,
  modulePermissions.agreementsView,
  modulePermissions.agreementsCreate,
  modulePermissions.agreementsUpdate,
  modulePermissions.reportsView,
  modulePermissions.reportsCreate,
  modulePermissions.analyticsView,
  modulePermissions.operationsView,
  modulePermissions.operationsCreate,
  modulePermissions.operationsUpdate,
  modulePermissions.operationsManage,
  modulePermissions.counselorsManage,
  modulePermissions.transfersManage,
  modulePermissions.recognitionManage,
  modulePermissions.monitoringView,
  modulePermissions.feesView,
];

// Digital Marketing: read-only visibility into lead volume/status/source so they can
// judge campaign performance, plus the marketing/campaign config modules.
const digitalMarketingPermissions: ModulePermission[] = [
  modulePermissions.leadsView,
  modulePermissions.reportsView,
  modulePermissions.analyticsView,
  modulePermissions.marketingManage,
  modulePermissions.campaignsManage,
];

const rolePermissionMatrixBase: Array<{
  key: ModuleRoleKey;
  role: string;
  salesModule: string;
  operationsModule: string;
  hrModule: string;
  proModule: string;
  admin: string;
  permissions: ModulePermission[];
}> = [
  {
    key: 'super_admin',
    role: 'Super Admin',
    salesModule: 'Full CRUD',
    operationsModule: 'Full CRUD',
    hrModule: 'Full CRUD + Config',
    proModule: 'Full CRUD + Config',
    admin: 'Yes',
    permissions: adminPermissions,
  },
  {
    key: 'director',
    role: 'Director',
    salesModule: 'Full CRUD',
    operationsModule: 'Full CRUD',
    hrModule: 'Full CRUD + Config',
    proModule: 'Full CRUD + Config',
    admin: 'Yes',
    permissions: adminPermissions,
  },
  {
    key: 'founder',
    role: 'Founder',
    salesModule: 'Full CRUD',
    operationsModule: 'Full CRUD',
    hrModule: 'Full CRUD + Config',
    proModule: 'Full CRUD + Config',
    admin: 'Yes',
    permissions: adminPermissions,
  },
  {
    key: 'director_of_sales',
    role: 'Director of Sales / Assistant Director of Sales',
    salesModule: 'Full CRUD (company-wide)',
    operationsModule: 'Full CRUD (company-wide)',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: directorOfSalesPermissions,
  },
  {
    key: 'regional_manager',
    role: 'Regional Manager',
    salesModule: 'Full CRUD (own region)',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      ...salesModulePermissions,
      modulePermissions.salesDelete,
      modulePermissions.counselorsManage,
      modulePermissions.transfersManage,
    ],
  },
  {
    key: 'sales',
    role: 'Sales / Counsellor',
    salesModule: 'Own leads only',
    operationsModule: 'Read Only',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: counsellorPermissions,
  },
  {
    key: 'branch_manager',
    role: 'Branch Manager',
    salesModule: 'Full CRUD (own branch)',
    operationsModule: 'No Access',
    hrModule: 'Attendance reports (own branch)',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      ...salesModulePermissions,
      modulePermissions.salesDelete,
      modulePermissions.counselorsManage,
      modulePermissions.transfersManage,
      modulePermissions.hrReportsAttendance,
      modulePermissions.itDashboard,
      modulePermissions.itApproveBranch,
      modulePermissions.leadsBulkUpload,
    ],
  },
  {
    key: 'receptionist',
    role: 'Receptionist',
    salesModule: 'Leads Add/Assign Only',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      modulePermissions.leadsView,
      modulePermissions.leadsCreate,
      modulePermissions.leadsUpdate,
    ],
  },
  {
    key: 'foe',
    role: 'FOE (Front Office Executive)',
    salesModule: 'Leads Assign + Receipts + Meetings',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      modulePermissions.leadsView,
      modulePermissions.leadsCreate,
      modulePermissions.leadsUpdate,
      modulePermissions.paymentsView,
      modulePermissions.paymentsCreate,
      modulePermissions.appointmentsView,
      modulePermissions.appointmentsManage,
      modulePermissions.counselorsManage,
    ],
  },
  {
    key: 'operations',
    role: 'Operations',
    salesModule: 'No Access',
    operationsModule: 'Add/Edit',
    hrModule: 'Attendance management (own team)',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      modulePermissions.operationsView,
      modulePermissions.operationsCreate,
      modulePermissions.operationsUpdate,
      modulePermissions.operationsManage,
      // Operations Manager rights: case transfer, case status lifecycle
      // (Close/Refund/On Hold/Visa Approved), task reassignment, attendance
      // management for their team, and CRM access freeze/restrict.
      modulePermissions.operationsCaseTransfer,
      modulePermissions.operationsCaseStatusManage,
      modulePermissions.operationsTaskReassign,
      modulePermissions.operationsAccessControl,
      modulePermissions.operationsTeamAllocation,
      modulePermissions.attendanceManage,
      modulePermissions.hrReportsAttendance,
      modulePermissions.reportsView,
    ],
  },
  {
    key: 'hr',
    role: 'HR',
    salesModule: 'No Access',
    operationsModule: 'No Access',
    hrModule: 'Full CRUD',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      modulePermissions.hrDashboard,
      modulePermissions.hrView,
      modulePermissions.hrCreate,
      modulePermissions.hrUpdate,
      modulePermissions.hrDelete,
      modulePermissions.hrConfig,
      modulePermissions.hrPayroll,
      modulePermissions.hrEosb,
      modulePermissions.hrReportsAttendance,
    ],
  },
  {
    key: 'pro',
    role: 'PRO',
    salesModule: 'No Access',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'Full CRUD',
    admin: 'No',
    permissions: [
      modulePermissions.proDashboard,
      modulePermissions.proView,
      modulePermissions.proCreate,
      modulePermissions.proUpdate,
      modulePermissions.proDelete,
      modulePermissions.proConfig,
      modulePermissions.proWpsView,
      modulePermissions.proOwnersRestricted,
    ],
  },
  {
    key: 'finance',
    role: 'Accountant / Finance',
    salesModule: 'Full CRUD (own leads)',
    operationsModule: 'No Access',
    hrModule: 'Attendance reports (company-wide)',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      ...salesModulePermissions,
      modulePermissions.financeView,
      modulePermissions.financeManage,
      modulePermissions.hrReportsAttendance,
    ],
  },
  {
    key: 'digital_marketing',
    role: 'Digital Marketing',
    salesModule: 'Leads: view only',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: digitalMarketingPermissions,
  },
  {
    key: 'it_manager',
    role: 'IT Manager',
    salesModule: 'No Access',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: itManagerPermissions,
  },
  {
    key: 'it_support_staff',
    role: 'IT Support Staff',
    salesModule: 'No Access',
    operationsModule: 'No Access',
    hrModule: 'No Access',
    proModule: 'No Access',
    admin: 'No',
    permissions: itSupportStaffPermissions,
  },
  {
    key: 'employee_self',
    role: 'Employee (Self)',
    salesModule: 'No Access',
    operationsModule: 'No Access',
    hrModule: 'View own record',
    proModule: 'No Access',
    admin: 'No',
    permissions: [
      modulePermissions.hrSelf,
    ],
  },
];

// Every role gets it.create/it.self merged in, so any employee can raise and
// track their own IT support tickets regardless of their primary role.
export const rolePermissionMatrix: typeof rolePermissionMatrixBase = rolePermissionMatrixBase.map((row) => ({
  ...row,
  permissions: Array.from(new Set([...row.permissions, ...itSelfServicePermissions])),
}));

const normalize = (value?: string | number | null) => String(value || '')
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const resolveModuleRoleKey = (input: {
  roleId?: number | null;
  roleName?: string | null;
  roleType?: string | null;
}): ModuleRoleKey => {
  const text = normalize(`${input.roleName || ''} ${input.roleType || ''}`);

  // Superadmin — explicit markers only. (Do not gate on a hardcoded roleId:
  // the current crm_role table's numeric IDs don't correspond to any fixed
  // legacy scheme — e.g. role id 1 is "Operations" — so an ID-based shortcut
  // here would silently grant super admin to whichever role happens to hold
  // that ID.)
  if (text.includes('super admin') || text.includes('superadmin') || text === 'admin' || text.includes('administrator')) {
    return 'super_admin';
  }

  // NOTE: role resolution below is text-based only, matching against
  // crm_role.name / crm_role.type. Earlier versions of this function also
  // special-cased legacy numeric role IDs (e.g. treating role id 15 as HR),
  // but those IDs have since been reassigned in crm_role (id 15 is now
  // "Counsellor", id 10 is "CEO", id 4 is "PRO", etc.), which misrouted
  // those roles to the wrong dashboard/permission set. The text match below
  // reads the live role name/type and is not subject to that drift.

  // IT Support ticketing module roles — must be checked before the generic
  // 'it' substring isn't matched by anything else below, but keep these early
  // and explicit rather than relying on absence of collisions elsewhere.
  if (text.includes('it support staff') || text.includes('it support')) return 'it_support_staff';
  if (text.includes('it manager')) return 'it_manager';

  // Text-based matching (covers department_id=1 roles and any name-based roles)
  if (text.includes('founder')) return 'founder';
  if (text.includes('ceo') || text.includes('chief executive')) return 'director';
  // Must be checked before the generic 'director' match below, since
  // "director of operations" contains the substring "director".
  if (text.includes('director of operations') || text.includes('operations director')) return 'operations';
  // Director of Sales / Assistant Director of Sales: narrower than full
  // 'director' — must be checked before the generic 'director' match below.
  if (
    text.includes('director of sales')
    || text.includes('director sales')
    || text.includes('assistant director of sales')
    || text.includes('asst director of sales')
    || text.split(' ').includes('ados')
    || text.split(' ').includes('dos')
  ) return 'director_of_sales';
  if (text.includes('director') || text.split(' ').includes('ds')) return 'director';
  if (text.includes('regional manager') || text.split(' ').includes('rm')) return 'regional_manager';
  // Team Leader / Area Manager are the branch-manager-equivalent tier in the
  // post-restructuring 9-role roster (Branch Manager itself was retired).
  if (text.includes('branch manager') || text === 'bm' || text.includes('team leader') || text.includes('area manager')) return 'branch_manager';
  if (text.includes('receptionist') || text.includes('front desk')) return 'receptionist';
  if (text.includes('foe') || text.includes('front office executive')) return 'foe';
  if (text.includes('digital marketing') || text.includes('digital branding') || text.includes('digital marketer')) return 'digital_marketing';
  // Must be checked before the generic 'pro' match below, since
  // "process coordinator" contains the substring "pro".
  if (text.includes('process coordinator') || text.includes('case officer')) return 'operations';
  // Immigration Advisor / Senior Immigration Advisor replace the retired
  // Sales/Counsellor individual-contributor tier.
  if (text.includes('sales') || text.includes('counsellor') || text.includes('counselor') || text.includes('immigration advisor')) return 'sales';
  // "operation manager" (singular "operation") doesn't contain the substring
  // "operations", so it needs its own check ahead of the generic one below.
  if (text.includes('operation manager') || text.includes('operations manager')) return 'operations';
  if (text.includes('operations') || text === 'ops' || text === 'op') return 'operations';
  if (text.includes('hr') || text.includes('human resources')) return 'hr';
  if (text.includes('pro') || text.includes('public relations officer')) return 'pro';
  if (text.includes('finance') || text.includes('accountant') || text.includes('accounting') || text.includes('accounts') || text.includes('account') || text.includes('cfo') || text.includes('accts')) return 'finance';

  return 'employee_self';
};

export const getModulePermissionsForRole = (input: {
  roleId?: number | null;
  roleName?: string | null;
  roleType?: string | null;
}) => {
  const roleKey = resolveModuleRoleKey(input);
  const row = rolePermissionMatrix.find((item) => item.key === roleKey)
    || rolePermissionMatrix.find((item) => item.key === 'employee_self')!;
  return {
    roleKey,
    roleLabel: row.role,
    permissions: ['super_admin', 'director', 'founder'].includes(row.key)
      ? ['all', ...adminPermissions]
      : row.permissions,
  };
};
