import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

let tableReady: Promise<void> | null = null;
const ensureTable = async () => {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        event_date DATE NOT NULL,
        start_time VARCHAR(10) NULL,
        end_time VARCHAR(10) NULL,
        location VARCHAR(255) NULL,
        attendees_json TEXT NULL,
        images_json TEXT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'meeting',
        priority VARCHAR(10) NOT NULL DEFAULT 'medium',
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        created_by INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  await ensureDB();
  await ensureTable();

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  // Visibility: counselors see only the events they created, Branch Manager
  // sees their whole branch, CEO sees everything — mirrors the same
  // three-tier check in /api/appointments and /api/follow-up-reminders so
  // the Calendar page can't leak every counselor's events to everyone.
  if (isCeo(auth)) {
    // no restriction
  } else if (isBranchManagerOrCeo(auth)) {
    conditions.push('e.branch = :userBranch');
    replacements.userBranch = Number(auth.branch || 0);
  } else {
    conditions.push('crm_calendar_events.created_by = :currentUserId');
    replacements.currentUserId = Number(auth.id);
  }

  if (from) { conditions.push('event_date >= :from'); replacements.from = from; }
  if (to) { conditions.push('event_date <= :to'); replacements.to = to; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await sequelize.query<any>(
    `SELECT crm_calendar_events.* FROM crm_calendar_events
     LEFT JOIN crm_employee e ON e.id = crm_calendar_events.created_by
     ${where} ORDER BY event_date ASC LIMIT 500`,
    { replacements, type: QueryTypes.SELECT }
  );

  return NextResponse.json({
    success: true,
    events: rows.map((row) => ({
      ...row,
      attendees: row.attendees_json ? JSON.parse(row.attendees_json) : [],
      images: row.images_json ? JSON.parse(row.images_json) : [],
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  await ensureDB();
  await ensureTable();
  const userId = auth.id;
  const body = await request.json();

  // Duplicate-submission guard: no client-side saving-state guard exists on
  // this form either, so a double-click on "Create Event" reaches here
  // twice - block an identical (creator, title, date, start time) event
  // created in the last minute.
  const [recentDuplicate] = await sequelize.query<{ id: number }>(
    `SELECT id FROM crm_calendar_events
     WHERE created_by = :createdBy AND title = :title AND event_date = :eventDate
       AND (start_time <=> :startTime)
       AND created_at >= (NOW() - INTERVAL 60 SECOND)
     LIMIT 1`,
    {
      replacements: { createdBy: userId, title: body.title || 'Untitled Event', eventDate: body.date, startTime: body.startTime || null },
      type: QueryTypes.SELECT,
    }
  );
  if (recentDuplicate) {
    return NextResponse.json({ error: 'This event was already created a moment ago.' }, { status: 409 });
  }

  const [insertId] = await sequelize.query(
    `INSERT INTO crm_calendar_events
       (title, description, event_date, start_time, end_time, location, attendees_json, images_json, type, priority, status, created_by)
     VALUES (:title, :description, :eventDate, :startTime, :endTime, :location, :attendees, :images, :type, :priority, :status, :createdBy)`,
    {
      replacements: {
        title: body.title || 'Untitled Event',
        description: body.description || '',
        eventDate: body.date,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        location: body.location || '',
        attendees: JSON.stringify(body.attendees || []),
        images: JSON.stringify(body.images || []),
        type: body.type || 'meeting',
        priority: body.priority || 'medium',
        status: body.status || 'scheduled',
        createdBy: userId,
      },
      type: QueryTypes.INSERT,
    }
  );

  return NextResponse.json({ success: true, id: insertId }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  await ensureDB();
  await ensureTable();
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await request.json();
  await sequelize.query(
    `UPDATE crm_calendar_events SET
       title = :title, description = :description, event_date = :eventDate,
       start_time = :startTime, end_time = :endTime, location = :location,
       attendees_json = :attendees, images_json = :images, type = :type,
       priority = :priority, status = :status
     WHERE id = :id`,
    {
      replacements: {
        id,
        title: body.title || 'Untitled Event',
        description: body.description || '',
        eventDate: body.date,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        location: body.location || '',
        attendees: JSON.stringify(body.attendees || []),
        images: JSON.stringify(body.images || []),
        type: body.type || 'meeting',
        priority: body.priority || 'medium',
        status: body.status || 'scheduled',
      },
    }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
    || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const currentUser = token ? verifyToken(token) : null;
  if (!currentUser || !isCeo(currentUser)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }

  await ensureDB();
  await ensureTable();
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await sequelize.query(`DELETE FROM crm_calendar_events WHERE id = :id`, { replacements: { id } });
  return NextResponse.json({ success: true });
}
