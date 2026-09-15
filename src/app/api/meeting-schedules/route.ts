// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { CrmcMeetingSchedules, CrmcNotifications } from '@/models';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const leadId = searchParams.get('leadId');
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');
    const meetingType = searchParams.get('meetingType');
    const priority = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions: string[] = [];
    const replacements: Record<string, unknown> = {};
    if (employeeId) { conditions.push('m.user_id = :employeeId'); replacements.employeeId = Number(employeeId); }
    if (leadId) { conditions.push('m.lead_id = :leadId'); replacements.leadId = Number(leadId); }
    if (status) { conditions.push('m.status = :status'); replacements.status = status; }
    if (meetingType) { conditions.push('m.meeting_type = :meetingType'); replacements.meetingType = meetingType; }
    if (priority) { conditions.push('m.priority = :priority'); replacements.priority = priority; }
    if (startDate && endDate) {
      conditions.push('m.meeting_date BETWEEN :startDate AND :endDate');
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      conditions.push('m.meeting_date >= :startDate');
      replacements.startDate = startDate;
    }

    // Visibility: counselors see only their own meetings, Branch Manager
    // their whole branch, CEO everything - requireAuth above has no
    // permission requirement at all (any authenticated user).
    if (isCeo(auth)) {
      // no restriction
    } else if (isBranchManagerOrCeo(auth)) {
      conditions.push('e.branch = :userBranch');
      replacements.userBranch = Number(auth.branch || 0);
    } else {
      conditions.push('m.user_id = :currentUserId');
      replacements.currentUserId = Number(auth.id);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const meetings = await sequelize.query(`
      SELECT m.*, l.fname, l.lname, l.email, l.phone, l.status AS leadStatus,
             e.name AS employeeName, e.email AS employeeEmail
      FROM crm_meeting_schedules m
      LEFT JOIN crm_forum_leads l ON m.lead_id = l.id
      LEFT JOIN crm_employee e ON m.user_id = e.id
      ${whereSql}
      ORDER BY m.meeting_date ASC
    `, { replacements, type: QueryTypes.SELECT });

    // Get today's meetings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeetings = (meetings as any[]).filter(m => {
      const date = new Date(m.meeting_date);
      return m.status === 'scheduled' && date >= today && date < tomorrow;
    });

    // Get upcoming meetings (next 7 days)
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const upcomingMeetings = (meetings as any[]).filter(m => {
      const date = new Date(m.meeting_date);
      return m.status === 'scheduled' && date >= today && date <= nextWeek;
    });

    // Get meetings that need reminders (within 15 minutes)
    const reminderTime = new Date(Date.now() + (15 * 60 * 1000));
    const meetingsNeedingReminders = (meetings as any[]).filter(m => {
      const date = new Date(m.meeting_date);
      return m.status === 'scheduled' && date <= reminderTime;
    });

    return NextResponse.json({
      meetings,
      todayMeetings,
      upcomingMeetings,
      meetingsNeedingReminders,
      summary: {
        total: meetings.length,
        today: todayMeetings.length,
        upcoming: upcomingMeetings.length,
        pendingReminders: meetingsNeedingReminders.length,
        completed: (meetings as any[]).filter(m => m.status === 'completed').length,
        scheduled: (meetings as any[]).filter(m => m.status === 'scheduled').length
      }
    });

  } catch (error) {
    console.error('Error fetching meeting schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const {
      leadId, 
      opportunityId, 
      employeeId, 
      userId,
      title, 
      description, 
      meetingType, 
      scheduledAt, 
      meetingDate,
      duration, 
      priority, 
      location, 
      meetingLink, 
      attendees, 
      reminderMinutes 
    } = body;
    const assignedUserId = employeeId || userId;
    const appointmentAt = scheduledAt || meetingDate;

    if (!assignedUserId || !meetingType || !appointmentAt) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId/userId, meetingType, scheduledAt/meetingDate' },
        { status: 400 }
      );
    }

    const meeting = await CrmcMeetingSchedules.create({
      lead_id: leadId ? parseInt(leadId) : 0,
      user_id: parseInt(assignedUserId),
      meeting_date: new Date(appointmentAt),
      meeting_type: meetingType,
      location: location || null,
      agenda: title || description || null,
      status: body.status || 'scheduled',
      priority: priority || 'normal',
      notes: body.notes || meetingLink || (opportunityId ? `Opportunity ID: ${opportunityId}` : null),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create notification for the meeting
    await CrmcNotifications.create({
      user_id: parseInt(assignedUserId),
      type: 'meeting',
      title: `Meeting Scheduled: ${title || meetingType}`,
      message: `You have a ${meetingType} meeting scheduled for ${new Date(appointmentAt).toLocaleString()}`,
      priority: priority || 'medium',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create notifications for attendees
    if (attendees && Array.isArray(attendees)) {
      for (const attendeeId of attendees) {
        await CrmcNotifications.create({
          user_id: parseInt(attendeeId),
          type: 'meeting',
          title: `Meeting Invitation: ${title || meetingType}`,
          message: `You have been invited to a ${meetingType} meeting on ${new Date(appointmentAt).toLocaleString()}`,
          priority: priority || 'medium',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    return NextResponse.json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error('Error creating meeting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { meetingId, action, outcome, nextAction, notes, rescheduledAt } = body;

    if (!meetingId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingId, action' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'start':
        updateData = {
          status: 'in_progress'
        };
        break;
      case 'complete':
        updateData = {
          status: 'completed',
          completed_at: new Date(),
          notes: notes || outcome || nextAction || null,
          updated_at: new Date()
        };
        break;
      case 'reschedule':
        updateData = {
          status: 'rescheduled',
          meeting_date: new Date(rescheduledAt),
          notes: notes || null,
          updated_at: new Date()
        };
        break;
      case 'cancel':
        updateData = {
          status: 'cancelled',
          notes: notes || null,
          updated_at: new Date()
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const meeting = await CrmcMeetingSchedules.update(updateData, {
      where: { id: parseInt(meetingId) }
    });

    return NextResponse.json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error('Error updating meeting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting schedule' },
      { status: 500 }
    );
  }
}
