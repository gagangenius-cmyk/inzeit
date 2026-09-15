// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { CrmcFollowUpReminders, CrmcNotifications } from '@/models';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { logLeadRemark } from '@/lib/leadRemarks';
import { verifyToken } from '@/lib/auth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';

// crm_follow_up_reminders.completion_notes is a lazily-added column (no
// migration framework in this project) — ensured here so a database that
// predates this column self-heals instead of erroring the first time a
// Sequelize model method (POST's duplicate check, PUT's update) touches it.
// GET doesn't need this: it reads via `SELECT r.*`, which only returns
// whatever columns currently exist rather than erroring on a missing one.
let followUpCompletionNotesColumnReady: Promise<void> | null = null;
const ensureFollowUpCompletionNotesColumn = async () => {
  if (!followUpCompletionNotesColumnReady) {
    followUpCompletionNotesColumnReady = sequelize.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crm_follow_up_reminders' AND COLUMN_NAME = 'completion_notes'
    `).then(async ([rows]: any) => {
      if (Number(rows?.[0]?.cnt || 0) === 0) {
        await sequelize.query(`ALTER TABLE crm_follow_up_reminders ADD COLUMN completion_notes TEXT NULL AFTER completed_at`);
      }
    }).catch((error) => {
      followUpCompletionNotesColumnReady = null;
      throw error;
    });
  }
  await followUpCompletionNotesColumnReady;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required to view follow-ups' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));

    const conditions: string[] = [];
    const replacements: Record<string, unknown> = {};

    // Visibility: counselors see only their own follow-ups, Branch Manager
    // sees their whole branch, CEO sees everything. Enforced server-side so
    // it can't be bypassed by omitting/changing the employeeId query param.
    if (isCeo(currentUser)) {
      // no restriction
    } else if (isBranchManagerOrCeo(currentUser)) {
      conditions.push('e.branch = :userBranch');
      replacements.userBranch = Number(currentUser.branch || 0);
    } else {
      conditions.push('r.user_id = :currentUserId');
      replacements.currentUserId = Number(currentUser.id);
    }

    if (employeeId) { conditions.push('r.user_id = :employeeId'); replacements.employeeId = Number(employeeId); }
    if (leadId) { conditions.push('r.lead_id = :leadId'); replacements.leadId = Number(leadId); }
    if (status) {
      if (status === 'overdue') {
        conditions.push("r.status = 'pending' AND r.reminder_date < NOW()");
      } else if (status === 'upcoming') {
        conditions.push("r.status = 'pending' AND r.reminder_date >= NOW()");
      } else {
        conditions.push('r.status = :status');
        replacements.status = status;
      }
    }
    if (priority) { conditions.push('r.priority = :priority'); replacements.priority = priority; }
    if (startDate && endDate) {
      conditions.push('r.reminder_date BETWEEN :startDate AND :endDate');
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      conditions.push('r.reminder_date >= :startDate');
      replacements.startDate = startDate;
    } else if (endDate) {
      conditions.push('r.reminder_date <= :endDate');
      replacements.endDate = endDate;
    }

    if (search) {
      conditions.push(`(
        CONCAT_WS(' ', l.fname, l.lname) LIKE :search
        OR e.name LIKE :search
        OR r.message LIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    // Fetched in full (not LIMITed) because the summary cards below count
    // overdue/upcoming/completed/pending across every row matching the
    // current filters, not just the current page — pagination is applied
    // afterward, in JS, to the same result set.
    const reminders = await sequelize.query(`
      SELECT r.*, l.fname, l.lname, l.email, l.phone, l.status AS leadStatus, l.priority AS leadPriority,
             e.name AS employeeName, e.email AS employeeEmail, e.branch AS branchId, b.branch AS branchName
      FROM crm_follow_up_reminders r
      LEFT JOIN crm_forum_leads l ON r.lead_id = l.id
      LEFT JOIN crm_employee e ON r.user_id = e.id
      LEFT JOIN crm_branch b ON b.id = e.branch
      ${whereSql}
      ORDER BY r.reminder_date ASC
    `, { replacements, type: QueryTypes.SELECT });

    // Get overdue reminders
    const now = new Date();
    const overdueReminders = (reminders as any[]).filter(r => r.status === 'pending' && new Date(r.reminder_date) < now);

    // Get upcoming reminders (next 7 days)
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const upcomingReminders = (reminders as any[]).filter(r => {
      const date = new Date(r.reminder_date);
      return r.status === 'pending' && date >= now && date <= nextWeek;
    });

    const total = reminders.length;
    const offset = (page - 1) * limit;
    const pagedReminders = (reminders as any[]).slice(offset, offset + limit);

    return NextResponse.json({
      reminders: pagedReminders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        total: reminders.length,
        overdue: overdueReminders.length,
        upcoming: upcomingReminders.length,
        completed: (reminders as any[]).filter(r => r.status === 'completed').length,
        pending: (reminders as any[]).filter(r => r.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('Error fetching follow-up reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-up reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required to create a follow-up' }, { status: 401 });
    }
    await ensureFollowUpCompletionNotesColumn();

    const body = await request.json();
    const {
      leadId,
      employeeId, 
      userId,
      reminderType, 
      scheduledAt, 
      reminderDate,
      priority, 
      subject, 
      message,
      notes
    } = body;
    const assignedUserId = employeeId || userId;
    const followUpAt = scheduledAt || reminderDate;
    const reminderMessage = message || subject || notes;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }
    if (!assignedUserId) {
      return NextResponse.json({ error: 'employeeId or userId is required' }, { status: 400 });
    }
    if (!followUpAt) {
      return NextResponse.json({ error: 'scheduledAt or reminderDate is required' }, { status: 400 });
    }
    if (!reminderMessage) {
      return NextResponse.json({ error: 'subject or message is required' }, { status: 400 });
    }

    const recentDuplicate = await CrmcFollowUpReminders.findOne({
      where: {
        lead_id: parseInt(leadId),
        user_id: parseInt(assignedUserId),
        message: reminderMessage,
        created_at: { [Op.gte]: new Date(Date.now() - 60_000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json({ error: 'This follow-up was already created a moment ago.' }, { status: 409 });
    }

    const reminder = await CrmcFollowUpReminders.create({
      lead_id: parseInt(leadId),
      user_id: parseInt(assignedUserId),
      reminder_date: new Date(followUpAt),
      message: reminderMessage,
      priority: priority || 'medium',
      status: body.status || 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create notification for the reminder
    await CrmcNotifications.create({
      user_id: parseInt(assignedUserId),
      type: 'followup',
      title: `Follow-up Reminder: ${subject || reminderType || 'Lead follow-up'}`,
      message: `You have a follow-up scheduled for ${new Date(followUpAt).toLocaleDateString()}`,
      priority: priority || 'medium',
      created_at: new Date(),
      updated_at: new Date()
    });

    await logLeadRemark({
      leadId: parseInt(leadId),
      action: 'followup_added',
      remark: `Follow-up added for ${new Date(followUpAt).toLocaleDateString()}: ${reminderMessage}`,
      newValue: new Date(followUpAt).toISOString().split('T')[0],
      actorId: parseInt(assignedUserId),
    });

    return NextResponse.json({
      success: true,
      reminder
    });

  } catch (error) {
    console.error('Error creating follow-up reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create follow-up reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
    }
    await ensureFollowUpCompletionNotesColumn();

    const body = await request.json();
    const { reminderId, action, completedAt, notes, rescheduledAt } = body;

    if (!reminderId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: reminderId, action' },
        { status: 400 }
      );
    }

    // A follow-up can only be completed/rescheduled/cancelled by the
    // counselor it belongs to, or Branch Manager/CEO for their scope.
    const [existing] = await sequelize.query<{ user_id: number; branch: number | null }>(`
      SELECT r.user_id, e.branch FROM crm_follow_up_reminders r
      LEFT JOIN crm_employee e ON e.id = r.user_id
      WHERE r.id = :reminderId LIMIT 1
    `, { replacements: { reminderId: parseInt(reminderId) }, type: QueryTypes.SELECT });

    if (!existing) {
      return NextResponse.json({ error: 'Follow-up reminder not found' }, { status: 404 });
    }

    const isOwn = Number(existing.user_id) === Number(currentUser.id);
    if (!isOwn) {
      if (isCeo(currentUser)) {
        // unrestricted
      } else if (isBranchManagerOrCeo(currentUser) && Number(existing.branch) === Number(currentUser.branch || 0)) {
        // in-branch manager, allowed
      } else {
        return NextResponse.json({ error: 'You do not have permission to update this follow-up' }, { status: 403 });
      }
    }

    let updateData: any = {};

    switch (action) {
      case 'complete':
        updateData = {
          status: 'completed',
          completed_at: completedAt ? new Date(completedAt) : new Date(),
          completion_notes: notes || undefined,
          updated_at: new Date()
        };
        break;
      case 'reschedule':
        updateData = {
          status: 'rescheduled',
          reminder_date: new Date(rescheduledAt),
          completion_notes: notes || undefined,
          updated_at: new Date()
        };
        break;
      case 'cancel':
        updateData = {
          status: 'cancelled',
          completion_notes: notes || undefined,
          updated_at: new Date()
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const reminder = await CrmcFollowUpReminders.update(updateData, {
      where: { id: parseInt(reminderId) }
    });

    return NextResponse.json({
      success: true,
      reminder
    });

  } catch (error) {
    console.error('Error updating follow-up reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update follow-up reminder' },
      { status: 500 }
    );
  }
}
