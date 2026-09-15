import { NextResponse } from 'next/server';
import { Appointments } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

const handlers = createCrudHandlers({
  model: Appointments,
  entityName: 'appointment',
  searchFields: ['date', 'leadid'],
  attributes: ['id', 'leadid', 'date', 'appointtime', 'counsilorid', 'booked', 'done', 'not_done', 'region', 'branch', 'screenshot'],
  // This CRUD config previously had no requiredPermissions at all, so any
  // authenticated user (not just appointments.view/manage holders) could
  // read/write appointments through it.
  requiredPermissions: ['appointments.view', 'appointments.manage'],
  statusFilter: (status) => {
    if (status === 'booked') return { booked: 1 };
    if (status === 'completed') return { done: 1 };
    if (status === 'cancelled') return { not_done: 1 };
    if (status === 'pending') return { booked: 0 };
    return {};
  },
  defaultOrder: [['date', 'DESC']],
  // Same CEO-all / Branch-Manager-own-branch / everyone-else-own-only rule
  // as beforeUpdate below, applied to the list too.
  listScope: (auth) => {
    if (isCeo(auth)) return null;
    if (isBranchManagerOrCeo(auth)) return { branch: auth.branch || 0 };
    return { counsilorid: auth.id };
  },
  defaults: (body) => ({
    appointtime: normalizeTime(body.appointtime || body.time || '09:00'),
    booked: Number(body.booked ?? 1),
    done: Number(body.done ?? 0),
    not_done: Number(body.not_done ?? 0),
    branch: Number(body.branch ?? 0),
    screenshot: body.screenshot || '',
    second_done: Number(body.second_done ?? 0),
    second_meet_date: body.second_meet_date || body.date || new Date().toISOString().split('T')[0],
  }),
  // Branch Manager may only update an appointment in their own branch,
  // mirroring the already-correct check in appointments/[id]/route.ts PUT;
  // CEO is unrestricted.
  beforeUpdate: async (record, auth) => {
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const recordBranch = record.get('branch');
      if (recordBranch !== null && recordBranch !== undefined && Number(recordBranch) !== Number(auth.branch || 0)) {
        return NextResponse.json({ error: 'You can only update an appointment in your own branch' }, { status: 403 });
      }
    }
    return null;
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;

function normalizeTime(value: unknown): string {
  const time = String(value || '09:00').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
  if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
  return '09:00:00';
}
