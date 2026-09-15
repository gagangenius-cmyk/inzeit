import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

const toPositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const addColIfMissing = async (table: string, col: string, def: string) => {
  const [r] = await sequelize.query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:t AND COLUMN_NAME=:c`,
    { replacements: { t: table, c: col }, type: QueryTypes.SELECT }
  );
  if (Number(r?.cnt || 0) === 0) {
    await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
  }
};

const ensureLeaveTables = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_leave_type (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status INT NOT NULL DEFAULT 1
    )
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_leave_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      custId INT NOT NULL,
      applyDate DATE NOT NULL,
      fromDate DATE NOT NULL,
      toDate DATE NOT NULL,
      type VARCHAR(255) NOT NULL,
      approvBy VARCHAR(555) NOT NULL DEFAULT '',
      remark TEXT NULL,
      status INT NOT NULL DEFAULT 1,
      file VARCHAR(50) NOT NULL DEFAULT ''
    )
  `);

  // Add optional columns that may be missing in legacy installations
  await addColIfMissing('crm_leave_history', 'requestedTo', 'VARCHAR(255) NOT NULL DEFAULT \'\'');
  await addColIfMissing('crm_leave_history', 'requested_time_from', 'TIME NULL');
  await addColIfMissing('crm_leave_history', 'requested_time_to', 'TIME NULL');
  await addColIfMissing('crm_leave_history', 'reject', 'VARCHAR(100) NOT NULL DEFAULT \'\'');
  await addColIfMissing('crm_leave_history', 'reject_remarks', 'TEXT NULL');
  await addColIfMissing('crm_leave_history', 'notf', 'INT NOT NULL DEFAULT 0');
  await addColIfMissing('crm_leave_history', 'approved_date', 'DATE NULL');
  await addColIfMissing('crm_leave_history', 'reject_date', 'DATE NULL');
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['hr.view', 'hr.self']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureLeaveTables();
    const { searchParams } = new URL(request.url);
    const page = toPositiveInt(searchParams.get('page'), 1);
    const limit = toPositiveInt(searchParams.get('limit'), 25);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const offset = (page - 1) * limit;
    const conditions = [];
    const replacements: Record<string, string | number> = { limit, offset };

    if (search) {
      conditions.push('(LOWER(e.name) LIKE LOWER(:search) OR LOWER(l.type) LIKE LOWER(:search) OR CAST(l.custId AS CHAR) LIKE :search)');
      replacements.search = `%${search}%`;
    }

    if (status) {
      conditions.push('l.status = :status');
      replacements.status = Number.parseInt(status, 10);
    }

    // requireAuth above accepts either hr.view (real HR staff, unrestricted)
    // or hr.self (every employee's self-service grant) - a self-service-only
    // caller must never see anyone else's leave requests, and a Branch
    // Manager without hr.view is scoped to their own branch's staff.
    const hasFullHrAccess = auth.permissions?.includes('all') || auth.permissions?.includes('hr.view') || isCeo(auth);
    if (!hasFullHrAccess) {
      if (isBranchManagerOrCeo(auth)) {
        conditions.push('e.branch = :userBranch');
        replacements.userBranch = Number(auth.branch || 0);
      } else {
        conditions.push('l.custId = :selfId');
        replacements.selfId = Number(auth.id);
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await sequelize.query(
      `
        SELECT
          l.id,
          l.custId,
          e.name AS employeeName,
          CAST(l.applyDate AS CHAR) AS applyDate,
          CAST(l.fromDate AS CHAR) AS fromDate,
          CAST(l.toDate AS CHAR) AS toDate,
          l.type,
          COALESCE(l.approvBy,'') AS approvBy,
          COALESCE(l.requestedTo,'') AS requestedTo,
          l.remark,
          l.status,
          CAST(l.approved_date AS CHAR) AS approvedDate,
          CAST(l.reject_date AS CHAR) AS rejectDate
        FROM crm_leave_history l
        LEFT JOIN crm_employee e ON e.id = l.custId
        ${where}
        ORDER BY l.id DESC
        LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const countRows = await sequelize.query<{ total: number }>(
      `
        SELECT COUNT(*) AS total
        FROM crm_leave_history l
        LEFT JOIN crm_employee e ON e.id = l.custId
        ${where}
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const total = Number(countRows[0]?.total || 0);

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch HR leaves:', msg);
    return NextResponse.json({ error: 'Failed to fetch HR leaves', details: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.self']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureLeaveTables();
    const body = await request.json();
    const now = new Date();

    await sequelize.query(
      `
        INSERT INTO crm_leave_history (
          custId, applyDate, fromDate, toDate, type, approvBy, requestedTo,
          requested_time_from, requested_time_to, remark, status, file, reject,
          reject_remarks, notf, approved_date, reject_date
        ) VALUES (
          :custId, :applyDate, :fromDate, :toDate, :type, :approvBy, :requestedTo,
          :requestedTimeFrom, :requestedTimeTo, :remark, :status, '', '',
          '', 0, :approvedDate, :rejectDate
        )
      `,
      {
        replacements: {
          custId: Number(body.custId),
          applyDate: body.applyDate || now,
          fromDate: body.fromDate,
          toDate: body.toDate,
          type: body.type || 'Annual Leave',
          approvBy: body.approvBy || '',
          requestedTo: body.requestedTo || '',
          requestedTimeFrom: body.requested_time_from || '00:00:00',
          requestedTimeTo: body.requested_time_to || '00:00:00',
          remark: body.remark || '',
          status: Number(body.status || 1),
          approvedDate: body.approved_date || null,
          rejectDate: body.reject_date || null,
        },
      }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to create HR leave:', error);
    return NextResponse.json({ error: 'Failed to create HR leave' }, { status: 500 });
  }
}
