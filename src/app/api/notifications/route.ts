// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { CrmcNotifications, CrmcFollowUpReminders, CrmcMeetingSchedules } from '@/models';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { captureError } from '@/lib/errorTracking';

export async function GET(request: NextRequest) {
  // This is a personal notification feed - always the caller's own, never
  // client-suppliable. Previously `userId` was read from the query string
  // and trusted outright (falling back to the auth token only when the
  // param was absent), which let any authenticated request read another
  // employee's notifications, follow-up reminders, and appointment details
  // just by passing a different id - fixed by requiring auth and always
  // deriving userId from the verified token.
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const priority = searchParams.get('priority');
    const limit = searchParams.get('limit') || '50';
    const userId = String(auth.id);

    await createThirtyMinuteReminderNotifications(Number(userId));

    const conditions = ['n.user_id = :userId'];
    const replacements: Record<string, unknown> = { userId: Number(userId), limit: Number(limit) };
    if (type) { conditions.push('n.type = :type'); replacements.type = type; }
    if (isRead !== null) { conditions.push('n.is_read = :isRead'); replacements.isRead = isRead === 'true' ? 1 : 0; }
    if (priority) { conditions.push('n.priority = :priority'); replacements.priority = priority; }

    const notificationRows = await sequelize.query<any>(`
      SELECT n.*, e.name AS employeeName, e.email AS employeeEmail
      FROM crm_notifications n
      LEFT JOIN crm_employee e ON n.user_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT :limit
    `, { replacements, type: QueryTypes.SELECT });

    const notifications = notificationRows.map((notification) => ({
      ...notification,
      isRead: Boolean(notification.is_read),
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
      relatedId: notification.related_id,
      relatedType: notification.related_type,
      link: notification.link || null
    }));

    // Get unread count
    const [{ unreadCount }] = await sequelize.query<any>(`
      SELECT COUNT(*) AS unreadCount
      FROM crm_notifications
      WHERE user_id = :userId AND is_read = 0
    `, { replacements: { userId: Number(userId) }, type: QueryTypes.SELECT });

    // Get upcoming follow-ups and meetings
    const upcomingFollowUps = await sequelize.query(`
      SELECT
        r.id,
        r.lead_id AS leadId,
        r.user_id AS employeeId,
        'call' AS reminderType,
        r.reminder_date AS scheduledAt,
        r.message AS subject,
        r.priority,
        l.fname,
        l.lname,
        l.email,
        l.phone
      FROM crm_follow_up_reminders r
      LEFT JOIN crm_forum_leads l ON r.lead_id = l.id
      WHERE r.user_id = :userId AND r.status = 'pending' AND r.reminder_date >= NOW()
      ORDER BY r.reminder_date ASC
      LIMIT 5
    `, { replacements: { userId: Number(userId) }, type: QueryTypes.SELECT });

    const upcomingMeetings = await sequelize.query(`
      SELECT
        a.id,
        a.leadid AS leadId,
        CONCAT('Appointment with ', COALESCE(NULLIF(TRIM(CONCAT(l.fname, ' ', l.lname)), ''), CONCAT('Lead #', a.leadid))) AS title,
        'in_person' AS meetingType,
        STR_TO_DATE(CONCAT(a.date, ' ', TIME_FORMAT(a.appointtime, '%H:%i:%s')), '%Y-%m-%d %H:%i:%s') AS scheduledAt,
        30 AS duration,
        'high' AS priority,
        COALESCE(b.branch, 'Office') AS location,
        l.fname,
        l.lname,
        l.email,
        l.phone
      FROM appointments a
      LEFT JOIN crm_forum_leads l ON a.leadid = l.id
      LEFT JOIN crm_branch b ON a.branch = b.id
      WHERE a.counsilorid = :userId
        AND COALESCE(a.done, 0) = 0
        AND COALESCE(a.not_done, 0) = 0
        AND STR_TO_DATE(CONCAT(a.date, ' ', TIME_FORMAT(a.appointtime, '%H:%i:%s')), '%Y-%m-%d %H:%i:%s') >= NOW()
      ORDER BY scheduledAt ASC
      LIMIT 5
    `, { replacements: { userId: Number(userId) }, type: QueryTypes.SELECT });

    return NextResponse.json({
      notifications,
      unreadCount,
      upcomingFollowUps,
      upcomingMeetings,
      summary: {
        total: notifications.length,
        unread: unreadCount,
        followUps: upcomingFollowUps.length,
        meetings: upcomingMeetings.length
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    captureError(error, { route: '/api/notifications' });
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { userId, type, title, message, priority, relatedId, relatedType, link } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const notification = await CrmcNotifications.create({
      user_id: parseInt(userId),
      type,
      title,
      message,
      priority: priority || 'medium',
      related_id: relatedId ?? null,
      related_type: relatedType ?? null,
      link: link ?? null
    });

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { notificationIds, action } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData = { is_read: true };
        break;
      case 'mark_unread':
        updateData = { is_read: false };
        break;
      case 'delete':
        await CrmcNotifications.destroy({
          where: {
            id: {
              [Op.in]: notificationIds
            }
          }
        });
        return NextResponse.json({
          success: true,
          message: 'Notifications deleted successfully'
        });
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    await CrmcNotifications.update(updateData, {
      where: {
        id: {
          [Op.in]: notificationIds
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Notifications ${action.replace('_', ' ')} successfully`
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

async function createThirtyMinuteReminderNotifications(userId: number) {
  await sequelize.query(`
    INSERT INTO crm_notifications (user_id, type, title, message, related_id, related_type, link, is_read, priority, created_at, updated_at)
    SELECT
      r.user_id,
      'followup',
      'Follow-up in 30 minutes',
      CONCAT(
        'Follow-up #', r.id, ' is scheduled at ',
        DATE_FORMAT(r.reminder_date, '%Y-%m-%d %H:%i'),
        ' for ',
        COALESCE(NULLIF(TRIM(CONCAT(l.fname, ' ', l.lname)), ''), CONCAT('Lead #', r.lead_id)),
        '. ', COALESCE(r.message, '')
      ),
      r.lead_id,
      'lead',
      CONCAT('/admin/leads/', r.lead_id, '/edit'),
      0,
      COALESCE(r.priority, 'high'),
      NOW(),
      NOW()
    FROM crm_follow_up_reminders r
    LEFT JOIN crm_forum_leads l ON r.lead_id = l.id
    WHERE r.user_id = :userId
      AND r.status = 'pending'
      AND r.reminder_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
      AND NOT EXISTS (
        SELECT 1
        FROM crm_notifications n
        WHERE n.user_id = r.user_id
          AND n.type = 'followup'
          AND n.message LIKE CONCAT('%Follow-up #', r.id, '%')
      )
  `, { replacements: { userId }, type: QueryTypes.INSERT });

  await sequelize.query(`
    INSERT INTO crm_notifications (user_id, type, title, message, related_id, related_type, link, is_read, priority, created_at, updated_at)
    SELECT
      a.counsilorid,
      'appointment',
      'Appointment in 30 minutes',
      CONCAT(
        'Appointment #', a.id, ' is scheduled at ',
        DATE_FORMAT(STR_TO_DATE(CONCAT(a.date, ' ', TIME_FORMAT(a.appointtime, '%H:%i:%s')), '%Y-%m-%d %H:%i:%s'), '%Y-%m-%d %H:%i'),
        ' for ',
        COALESCE(NULLIF(TRIM(CONCAT(l.fname, ' ', l.lname)), ''), CONCAT('Lead #', a.leadid))
      ),
      a.leadid,
      'lead',
      CONCAT('/admin/leads/', a.leadid, '/edit'),
      0,
      'high',
      NOW(),
      NOW()
    FROM appointments a
    LEFT JOIN crm_forum_leads l ON a.leadid = l.id
    WHERE a.counsilorid = :userId
      AND COALESCE(a.done, 0) = 0
      AND COALESCE(a.not_done, 0) = 0
      AND STR_TO_DATE(CONCAT(a.date, ' ', TIME_FORMAT(a.appointtime, '%H:%i:%s')), '%Y-%m-%d %H:%i:%s')
        BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
      AND NOT EXISTS (
        SELECT 1
        FROM crm_notifications n
        WHERE n.user_id = a.counsilorid
          AND n.type = 'appointment'
          AND n.message LIKE CONCAT('%Appointment #', a.id, '%')
      )
  `, { replacements: { userId }, type: QueryTypes.INSERT });
}
