// CEO shares crm_role.type = 'director' with Director/Founder/Super Admin (see
// scripts/seed-roles-permissions.js), so `type` alone can never distinguish CEO
// from those roles. `roleName` is the literal crm_role.name ("CEO") and is the
// only reliable signal — use these helpers instead of a `type` string match.

type RoleCheckUser = {
  type?: string | null;
  roleName?: string | null;
  role?: string | number | null;
} | null | undefined;

export function isCeo(user: RoleCheckUser): boolean {
  return String(user?.roleName || '').trim().toLowerCase() === 'ceo';
}

export function isFoe(user: RoleCheckUser): boolean {
  const text = `${String(user?.roleName || '')} ${String(user?.type || '')}`.toLowerCase();
  return text.includes('foe') || text.includes('front office executive');
}

export function isFoeOrCeo(user: RoleCheckUser): boolean {
  if (isCeo(user)) return true;
  return isFoe(user);
}

export function isFoeOrBranchManagerOrCeo(user: RoleCheckUser): boolean {
  if (isCeo(user)) return true;
  // `type` isn't reliably a short code — it falls back to a verbose role
  // label (e.g. "FOE (Front Office Executive)") whenever crm_role.type is
  // unset in the DB, so match by substring across roleName + type rather
  // than requiring an exact 'foe'/'branch_manager' token match.
  // Team Leader / Area Manager are the branch-manager-equivalent tier in the
  // post-restructuring 9-role roster (Branch Manager/FOE were retired) - see
  // scripts/seed-roles-permissions.js.
  const text = `${String(user?.roleName || '')} ${String(user?.type || '')}`.toLowerCase();
  return (
    text.includes('foe')
    || text.includes('front office executive')
    || text.includes('branch manager')
    || text.includes('team leader')
    || text.includes('area manager')
    || /\bbm\b/.test(text)
  );
}

// Company-wide administrative authority (CEO + Director of Sales only) -
// narrower than canViewAllBranches, which also includes Team Leader/Area
// Manager for lead-visibility purposes. Use this one for actions scoped to
// "the two roles that manage the whole org" specifically, e.g. who may set
// a target for ANY employee rather than only their own reporting subtree.
export function isCeoOrDirectorOfSales(user: RoleCheckUser): boolean {
  if (isCeo(user)) return true;
  const text = `${String(user?.roleName || '')} ${String(user?.type || '')}`.toLowerCase();
  return text.includes('director of sales') || text.split(' ').includes('dos');
}

// Deliberately excludes FOE - for actions (e.g. editing a lead's contact info
// once it's already in the CRM) that only a manager tier and CEO may perform.
export function isBranchManagerOrCeo(user: RoleCheckUser): boolean {
  if (isCeo(user)) return true;
  const text = `${String(user?.roleName || '')} ${String(user?.type || '')}`.toLowerCase();
  return (
    text.includes('branch manager')
    || text.includes('team leader')
    || text.includes('area manager')
    || /\bbm\b/.test(text)
  );
}

// Accounts/Finance/Accountant - mirrors the text matching used by
// resolveModuleRoleKey's 'finance' bucket (modulePermissions.ts) so this
// stays in sync with which roles actually hold finance.view/finance.manage.
export function isFinanceOrAccounts(user: RoleCheckUser): boolean {
  const text = `${String(user?.roleName || '')} ${String(user?.type || '')}`.toLowerCase();
  return (
    text.includes('finance')
    || text.includes('accountant')
    || text.includes('accounting')
    || text.includes('accounts')
    || text.includes('account')
    || text.includes('cfo')
    || text.includes('accts')
  );
}

// Sales / Counsellor - an individual-contributor selling role, as opposed to
// Branch Manager/CEO/Finance who are checked (and excluded) first by callers
// since "sales" and "counsellor" are broad substrings that would otherwise
// also match higher-tier roles built on top of the sales module.
export function isCounsellor(user: RoleCheckUser): boolean {
  if (isBranchManagerOrCeo(user) || isFinanceOrAccounts(user)) return false;
  const text = `${String(user?.roleName || '')} ${String(user?.type || '')}`.toLowerCase();
  // "Immigration Advisor"/"Senior Immigration Advisor" are the individual-
  // contributor advisor tier in the post-restructuring roster, functionally
  // equivalent to the retired Sales/Counsellor roles this check predates.
  return text.includes('sales') || text.includes('counsellor') || text.includes('counselor') || text.includes('immigration advisor');
}

// Mirrors the `canViewAll` role whitelist duplicated across several list
// endpoints (e.g. src/app/api/leads/route.ts, .../operations/search/route.ts)
// - roles here see every branch/region's records. `role === 1` is the legacy
// numeric "role 1 = admin" shortcut those routes also honor. Team Leader/Area
// Manager are included per spec ("can see complete leads and data") - unlike
// the retired Branch/Regional Manager tiers they replace, which were
// branch/region-scoped rather than company-wide.
export function canViewAllBranches(user: (RoleCheckUser & { role?: string | number | null }) | null | undefined): boolean {
  if (Number(user?.role) === 1) return true;
  const type = String(user?.type || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (type === 'team_leader' || type === 'area_manager') return true;
  return [
    'admin', 'administrator', 'super_admin', 'director_of_sales', 'director', 'dos',
    'director_of_operations', 'operation_manager',
  ].includes(type);
}

// Which scope a user should be checked against when a route fetches a single
// record by ID (a lead, an appointment, ...) rather than a pre-filtered list -
// mirrors the canViewAll/branch/region tiers from src/app/api/leads/route.ts
// so record-level "may this user see this specific row" checks stay in sync
// with the list-level filtering instead of each route re-deriving its own copy.
export function getRecordVisibilityScope(user: (RoleCheckUser & { role?: string | number | null }) | null | undefined): 'all' | 'branch' | 'region' | 'own' {
  if (canViewAllBranches(user)) return 'all';
  const type = String(user?.type || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (['branch_manager', 'bm', 'receptionist', 'foe'].includes(type)) return 'branch';
  if (['regional_manager', 'rm'].includes(type)) return 'region';
  return 'own';
}
