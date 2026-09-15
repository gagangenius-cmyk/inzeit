import { NextRequest, NextResponse } from 'next/server'
import { Appointments } from '@/models'
import { verifyToken } from '@/lib/auth'
import { isCeo, isBranchManagerOrCeo, isFoeOrBranchManagerOrCeo, isFoe } from '@/lib/roleChecks'
import { ensureAppointmentRemarksColumn } from '@/lib/ensureAppointmentRemarksColumn'

const getCurrentUser = (request: NextRequest) => {
  const token = request.cookies.get('auth-token')?.value
    || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return token ? verifyToken(token) : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 })
    }
    await ensureAppointmentRemarksColumn()

    const { id } = await params
    const appointment = await Appointments.findByPk(id, {
      include: [
        {
          association: 'lead',
          attributes: ['id', 'fname', 'lname', 'phone', 'email']
        },
        {
          association: 'counselor',
          attributes: ['id', 'name']
        }
      ]
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Same visibility scoping as the list endpoint: counselors see only their
    // own appointments, Branch Manager and FOE their branch, CEO everything —
    // a single-item lookup by id shouldn't bypass that.
    if (!isCeo(currentUser)) {
      if (isBranchManagerOrCeo(currentUser) || isFoe(currentUser)) {
        const ownsBranch = Number((appointment as any).branch) === Number(currentUser.branch || 0)
        const assignedToBranch = Boolean((appointment as any).cross_branch) && Number((appointment as any).assigned_branch) === Number(currentUser.branch || 0)
        if (!ownsBranch && !assignedToBranch) {
          return NextResponse.json({ error: 'You do not have permission to view this appointment' }, { status: 403 })
        }
      } else if (Number((appointment as any).counsilorid) !== Number(currentUser.id)) {
        return NextResponse.json({ error: 'You do not have permission to view this appointment' }, { status: 403 })
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 })
    }
    await ensureAppointmentRemarksColumn()

    const { id } = await params
    const data = await request.json()

    const appointment = await Appointments.findByPk(id)

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const isOwnAppointment = Number((appointment as any).counsilorid) === Number(currentUser.id)
    // Also allow Branch Manager/CEO to manage appointments cross-branch-assigned
    // *to* their branch, not just ones that originated there — mirrors the same
    // ownsBranch/assignedToBranch allowance already used by GET above, so a
    // receiving branch manager can actually add remarks on a handoff into their
    // branch instead of getting a 403 on this same endpoint.
    const canManageAnyInBranch = isBranchManagerOrCeo(currentUser)
      && (
        Number((appointment as any).branch) === Number(currentUser.branch || 0)
        || (Boolean((appointment as any).cross_branch) && Number((appointment as any).assigned_branch) === Number(currentUser.branch || 0))
      )

    // Reassigning an appointment (owner/lead/branch/region) is the same
    // sensitive action as reassigning a lead — restrict it the same way,
    // rather than letting any authenticated caller rewrite whose
    // appointment this is.
    const touchesAssignment = data.leadId !== undefined || data.leadid !== undefined
      || data.counselorId !== undefined || data.counsilorid !== undefined || data.employeeId !== undefined
      || data.branch !== undefined || data.region !== undefined
    if (touchesAssignment && !isCeo(currentUser) && !canManageAnyInBranch) {
      return NextResponse.json({ error: 'Only Branch Manager or CEO can reassign an appointment' }, { status: 403 })
    }

    // Meeting-proof verification must come from someone other than the
    // counselor who owns the appointment — otherwise the FOE-verification
    // control described elsewhere in this flow is meaningless. This only
    // applies to an actual verify/reject decision (meeting_verified set to
    // 0/1) — marking a meeting done resets these fields to null as a side
    // effect of the new proof upload, and the owning counselor must be able
    // to do that (that reset is what makes it show up as "pending
    // verification" for FOE/BM/CEO in the first place).
    const verificationFields = ['meeting_verified', 'verified_by', 'verified_at', 'foe_remark']
    const isVerificationDecision = data.meeting_verified !== undefined && data.meeting_verified !== null
    const onlyTouchesVerification = verificationFields.some((field) => data[field] !== undefined)
      && Object.keys(data).every((key) => verificationFields.includes(key))
    if (isVerificationDecision) {
      if (!isFoeOrBranchManagerOrCeo(currentUser)) {
        return NextResponse.json({ error: 'Only FOE, Branch Manager, or CEO can verify a meeting' }, { status: 403 })
      }
      if (isOwnAppointment && !isCeo(currentUser)) {
        return NextResponse.json({ error: 'You cannot verify your own appointment' }, { status: 403 })
      }
    }

    // FOE isn't included in canManageAnyInBranch (that's reserved for
    // Branch Manager/CEO reassignment rights above), so a verification-only
    // update needs its own branch-scoped allowance here or the general
    // permission check below would 403 a legitimate FOE verification.
    const sameBranch = Number((appointment as any).branch) === Number(currentUser.branch || 0)
    const canVerifyAsFoe = onlyTouchesVerification && isVerificationDecision && isFoe(currentUser) && sameBranch

    if (!isOwnAppointment && !canManageAnyInBranch && !isCeo(currentUser) && !canVerifyAsFoe) {
      return NextResponse.json({ error: 'You do not have permission to update this appointment' }, { status: 403 })
    }

    await appointment.update(normalizeAppointmentPayload(data))

    // Reload with associations
    const updatedAppointment = await Appointments.findByPk(id, {
      include: [
        {
          association: 'lead',
          attributes: ['id', 'fname', 'lname', 'phone', 'email']
        },
        {
          association: 'counselor',
          attributes: ['id', 'name']
        }
      ]
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function normalizeAppointmentPayload(data: Record<string, any>) {
  const normalized = { ...data };

  if (normalized.leadId !== undefined && normalized.leadid === undefined) normalized.leadid = normalized.leadId;
  if (normalized.counselorId !== undefined && normalized.counsilorid === undefined) normalized.counsilorid = normalized.counselorId;
  if (normalized.employeeId !== undefined && normalized.counsilorid === undefined) normalized.counsilorid = normalized.employeeId;
  if (normalized.appointtime || normalized.time) normalized.appointtime = normalizeTime(normalized.appointtime || normalized.time);
  if (normalized.booked !== undefined) normalized.booked = Number(normalized.booked);
  if (normalized.done !== undefined) normalized.done = Number(normalized.done);
  if (normalized.not_done !== undefined) normalized.not_done = Number(normalized.not_done);
  if (normalized.second_done !== undefined) normalized.second_done = Number(normalized.second_done);
  if (normalized.meeting_verified !== undefined && normalized.meeting_verified !== null) normalized.meeting_verified = Number(normalized.meeting_verified);
  if (normalized.verified_by !== undefined && normalized.verified_by !== null) normalized.verified_by = Number(normalized.verified_by);

  delete normalized.leadId;
  delete normalized.counselorId;
  delete normalized.employeeId;
  delete normalized.time;

  return normalized;
}

function normalizeTime(value: unknown): string {
  const time = String(value || '09:00').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
  if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
  return '09:00:00';
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(request)
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 })
    }
    await ensureAppointmentRemarksColumn()

    const { id } = await params
    const appointment = await Appointments.findByPk(id)

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    await appointment.destroy()

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
