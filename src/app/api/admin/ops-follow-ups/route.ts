import { NextRequest, NextResponse } from 'next/server';
import { sequelize, connectDB } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { canViewAllBranches, isBranchManagerOrCeo } from '@/lib/roleChecks';

let dbInitialized = false;
const ensureDB = async () => {
  if (!dbInitialized) { await connectDB(); dbInitialized = true; }
};

export async function GET(request: NextRequest) {
  try {
    await ensureDB();

    const authorization = request.headers.get('authorization');
    const token = request.cookies.get('auth-token')?.value || authorization?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const search = searchParams.get('search') || '';

    // Was a locally-maintained whitelist missing 'team_leader'/'area_manager'
    // (the post-restructuring manager tier that replaced Branch/Regional
    // Manager) - fell through to the most restrictive "own follow-ups only"
    // branch below instead of the company-wide access those roles should
    // have. Now shares the same canonical check as src/lib/roleChecks.ts.
    const role = String(currentUser.type || '').toLowerCase().replace(/[\s-]+/g, '_');
    const canViewAll = canViewAllBranches(currentUser);
    const isBranchManager = isBranchManagerOrCeo(currentUser) && !canViewAll;
    const isRegionalManager = ['regional_manager', 'rm'].includes(role) && !canViewAll && !isBranchManager;

    const conditions: string[] = [];
    const replacements: Record<string, any> = {};

    // Role-based filtering
    if (canViewAll) {
      // Super admin, DS, admin: see all follow-ups — no filter
    } else if (isBranchManager) {
      // BM: follow-ups where the assigned employee is in their branch
      conditions.push(`e.branch = :branch`);
      replacements.branch = currentUser.branch;
    } else if (isRegionalManager) {
      // RM: follow-ups where the assigned employee is in their region
      conditions.push(`e.region = :region`);
      replacements.region = currentUser.region;
    } else {
      // Counselor: only their own follow-ups
      conditions.push(`r.user_id = :userId`);
      replacements.userId = currentUser.id;
    }

    // Status filter
    if (status === 'overdue') {
      conditions.push("r.status = 'pending' AND r.reminder_date < NOW()");
    } else if (status === 'upcoming') {
      conditions.push("r.status = 'pending' AND r.reminder_date >= NOW()");
    } else if (status) {
      conditions.push('r.status = :status');
      replacements.status = status;
    }

    // Priority filter
    if (priority) {
      conditions.push('r.priority = :priority');
      replacements.priority = priority;
    }

    // Search filter
    if (search) {
      conditions.push(`(
        CONCAT_WS(' ', l.fname, l.lname) LIKE :search
        OR l.phone LIKE :search
        OR l.email LIKE :search
        OR e.name LIKE :search
        OR r.message LIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const reminders = await sequelize.query<any>(`
      SELECT
        r.id, r.lead_id, r.user_id, r.reminder_date, r.message, r.status, r.priority,
        r.completed_at, r.created_at, r.updated_at,
        l.fname, l.lname, l.phone, l.email, l.mobile,
        l.country_interest, l.service_interest, l.status AS leadStatus,
        COALESCE(cp.name, l.country_interest) AS countryName,
        COALESCE(s.name, l.service_interest) AS serviceName,
        e.name AS employeeName, e.branch AS employeeBranch,
        b.branch AS branchName
      FROM crm_follow_up_reminders r
      LEFT JOIN crm_forum_leads l ON r.lead_id = l.id
      LEFT JOIN crm_employee e ON r.user_id = e.id
      LEFT JOIN crm_branch b ON e.branch = b.id
      LEFT JOIN crm_country_proces cp ON l.country_interest = cp.id
      LEFT JOIN crm_service s ON l.service_interest = s.id
      ${whereSql}
      ORDER BY
        CASE WHEN r.status = 'pending' AND r.reminder_date < NOW() THEN 0 ELSE 1 END,
        r.reminder_date ASC
      LIMIT 200
    `, { replacements, type: QueryTypes.SELECT });

    const now = new Date();
    const summary = {
      total: reminders.length,
      overdue: reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) < now).length,
      pending: reminders.filter(r => r.status === 'pending' && new Date(r.reminder_date) >= now).length,
      completed: reminders.filter(r => r.status === 'completed').length,
    };

    return NextResponse.json({ data: reminders, summary });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDB();

    const authorization = request.headers.get('authorization');
    const token = request.cookies.get('auth-token')?.value || authorization?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, notes, rescheduledAt } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    const updates: string[] = [];
    const replacements: Record<string, any> = { id };

    if (action === 'complete') {
      updates.push("status = 'completed'", "completed_at = NOW()");
      if (notes) {
        updates.push("message = CONCAT(COALESCE(message, ''), '\\n--- Completed note: ', :notes)");
        replacements.notes = notes;
      }
    } else if (action === 'reschedule') {
      if (!rescheduledAt) {
        return NextResponse.json({ error: 'rescheduledAt is required for reschedule' }, { status: 400 });
      }
      updates.push("reminder_date = :rescheduledAt", "status = 'pending'");
      replacements.rescheduledAt = rescheduledAt;
    } else if (action === 'cancel') {
      updates.push("status = 'cancelled'");
    } else {
      return NextResponse.json({ error: 'Invalid action. Use: complete, reschedule, cancel' }, { status: 400 });
    }

    await sequelize.query(
      `UPDATE crm_follow_up_reminders SET ${updates.join(', ')} WHERE id = :id`,
      { replacements, type: QueryTypes.UPDATE }
    );

    return NextResponse.json({ success: true, message: `Follow-up ${action}d` });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}
