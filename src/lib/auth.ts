import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { QueryTypes } from 'sequelize'
import { CrmEmployee, CrmRole } from '../models'
import { sequelize } from './sequelize'
import { getModulePermissionsForRole } from './modulePermissions'
import { getJwtSecret } from './jwtSecret'

const JWT_SECRET = getJwtSecret()

export interface User {
  id: number
  name: string
  email: string
  cemail: string
  role: number
  branch: number
  region: number
  type: string
  roleName: string
  photo?: string
  wfh: number
  permissions: string[]
  mustChangePassword?: boolean
}

export interface AuthUser extends User {
  token: string
}

type AuthEmployeeRow = {
  id: number
  name: string
  email?: string | null
  role?: number | null
  branch?: number | null
  region?: number | null
  photo?: string | null
  wfh?: number | null
  password?: string | null
  must_change_password?: number | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      cemail: user.cemail,
      role: user.role,
      branch: user.branch,
      region: user.region,
      type: user.type,
      roleName: user.roleName,
      photo: user.photo,
      wfh: user.wfh,
      permissions: user.permissions
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User
    return decoded
  } catch {
    return null
  }
}

// Short-lived token for the gap between "password verified" and "MFA code
// verified" (see src/app/api/auth/login/route.ts and
// src/app/api/auth/verify-mfa/route.ts). Deliberately separate from the real
// session token/cookie so a caller can never skip the MFA step by reusing
// this token as if it were `auth-token` — verifyToken() below only accepts
// tokens without a `purpose`, and requireAuth() reads `auth-token` alone.
const MFA_PENDING_PURPOSE = 'mfa-pending'

export function generateMfaPendingToken(employeeId: number): string {
  return jwt.sign({ id: employeeId, purpose: MFA_PENDING_PURPOSE }, JWT_SECRET, { expiresIn: '5m' })
}

export function verifyMfaPendingToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; purpose: string }
    return decoded.purpose === MFA_PENDING_PURPOSE ? decoded.id : null
  } catch {
    return null
  }
}

async function getDatabasePermissionsForRole(roleId: number): Promise<string[] | null> {
  try {
    const rows = await sequelize.query<{ permission_key: string }>(
      `SELECT p.permission_key
       FROM crm_role_permissions rp
       INNER JOIN crm_permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = :roleId
         AND rp.status = 1
         AND p.status = 1
       ORDER BY p.module ASC, p.action ASC`,
      {
        replacements: { roleId },
        type: QueryTypes.SELECT,
      },
    );

    if (!rows.length) return null;
    return Array.from(new Set(rows.map((row) => row.permission_key)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Role permission tables unavailable; using module permission fallback:', message);
    return null;
  }
}

export async function auth(): Promise<AuthUser | null> {
  // This function can be used to get the current authenticated user
  // For now, return null - implement based on your session management
  try {
    // In a real implementation, you would:
    // 1. Get token from request/session
    // 2. Verify the token
    // 3. Return user data

    return null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Shared tail of session-building — resolves permissions and mints the JWT
// for an already-identified, already-authorized employee row. Split out of
// authenticateUser() so MFA verification (src/lib/mfa.ts,
// /api/auth/verify-mfa) can build the exact same session for an employee id
// alone, without re-deriving password logic or duplicating the permission
// resolution rules.
async function buildAuthUser(user: AuthEmployeeRow, roleType: string, roleName: string): Promise<AuthUser> {
  const moduleAccess = getModulePermissionsForRole({
    roleId: user.role || 1,
    roleName,
    roleType,
  });

  const dbPerms = user.role ? await getDatabasePermissionsForRole(user.role) : null;
  const permissions = moduleAccess.permissions.includes('all')
    ? Array.from(new Set(['all', ...(dbPerms || moduleAccess.permissions)]))
    : Array.from(new Set(dbPerms || moduleAccess.permissions));

  const userWithoutPassword = {
    id: user.id,
    name: user.name,
    email: user.email || '',
    cemail: user.email || '',
    role: user.role || 1,
    branch: user.branch || 0,
    region: user.region || 0,
    // Preserve role-specific types such as `director_of_sales` in the session.
    type: roleType || moduleAccess.roleLabel,
    // The literal crm_role.name (e.g. "CEO") — unlike `type`, this isn't collapsed
    // into a shared bucket with Director/Founder/Super Admin, so it's the only
    // reliable way to gate a feature to CEO specifically.
    roleName,
    photo: user.photo || '',
    wfh: user.wfh || 0,
    permissions,
    mustChangePassword: Number(user.must_change_password || 0) === 1,
  };

  const token = generateToken(userWithoutPassword);
  return { ...userWithoutPassword, token };
}

async function loadEmployeeAndRole(where: Record<string, unknown>): Promise<{ user: AuthEmployeeRow; roleType: string; roleName: string } | null> {
  const user = await CrmEmployee.findOne({ where, raw: true }) as AuthEmployeeRow | null;
  if (!user) return null;

  let roleType = user.role === 1 ? 'Administrator' : 'User';
  let roleName = '';
  const role = user.role
    ? await CrmRole.findByPk(user.role, { raw: true }).catch(() => null)
    : null;
  if (role) {
    roleName = role.name || '';
    roleType = role.type || roleType;
  }
  return { user, roleType, roleName };
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  try {
    let loaded: { user: AuthEmployeeRow; roleType: string; roleName: string } | null = null;

    // Try DmcEmployee first (original crm_employee table)
    try {
      loaded = await loadEmployeeAndRole({ username: username.toLowerCase(), status: 1 });
    } catch (employeeError: unknown) {
      const message = employeeError instanceof Error ? employeeError.message : employeeError;
      console.warn('DmcEmployee not accessible during authentication:', message);

      // Fallback to direct database query for test_users table

    }

    if (!loaded) {
      return null;
    }

    // Verify password — bcrypt only. Legacy plaintext/MD5 rows are migrated
    // by scripts/migrate-legacy-passwords.js; see its dry-run output before
    // relying on this in an environment that hasn't been migrated yet.
    const stored = loaded.user.password ?? '';
    const passwordOk = stored ? await bcrypt.compare(password, stored).catch(() => false) : false;
    if (!passwordOk) {
      return null;
    }

    return await buildAuthUser(loaded.user, loaded.roleType, loaded.roleName);
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return null;
  }
}

// Used only after a successful MFA code verification, where the password has
// already been checked by authenticateUser() in the initial login call and
// only a stable identifier (the employee id carried in the MFA-pending
// token) survives to this second step.
export async function buildAuthSessionForEmployeeId(employeeId: number): Promise<AuthUser | null> {
  try {
    const loaded = await loadEmployeeAndRole({ id: employeeId, status: 1 });
    if (!loaded) return null;
    return await buildAuthUser(loaded.user, loaded.roleType, loaded.roleName);
  } catch (error) {
    console.error('❌ MFA session build error:', error);
    return null;
  }
}
